import {
  FileFormatType,
  FileInfo,
  FolderFileType,
  JobInfo,
  JobProgressInfo,
  JobStatusInfo,
  JobTypeInfo,
} from "#types";
import { v4 } from "uuid";
import fs from "fs";
import { StorageClientFactory } from "./StorageClientFactory";
import path from "path";
import { getFileName, getPercentage } from "#utility";
import { WriteStream } from "node:fs";
import { buildCloudPath } from "./Util";

export async function download(
  file: FileInfo,
  localFilePath: string,
  progress: (job: JobInfo) => void,
) {
  const job = {
    id: v4().toString(),
    name: file.name,
    status: JobStatusInfo.loading,
    progress: {
      loaded: -1,
      total: file.size,
      percentage: 0,
    } as JobProgressInfo,
    createdTime: new Date(),
    type: JobTypeInfo.download,
    file: file,
    localFilePath: localFilePath,
  } as JobInfo;

  if (file.type.fileType === FileFormatType.Folder) {
    const client = StorageClientFactory.createClient(file.storage);
    const allFiles = await client.getFilesRecursively(file.bucket, file.path);
    job.progress.loaded = 0;
    job.progress.total = allFiles.reduce(
      (previousValue, currentValue) => previousValue + (currentValue.size || 0),
      0,
    );
    if (job.progress.total === 0) {
      job.status = JobStatusInfo.completed;
      job.error = "The folder is empty, nothing to download";
      progress(job);
      return;
    }
    job.subJobs = [];
    for (const remoteFile of allFiles) {
      const newLocalFilePath = path.join(
        localFilePath,
        remoteFile.path.substring(file.path.length),
      );
      if (remoteFile.type.fileType === FileFormatType.Folder) {
        createDir(newLocalFilePath);
      } else {
        const subJob = {
          id: v4().toString(),
          name: remoteFile.name,
          status: JobStatusInfo.loading,
          progress: {
            loaded: -1,
            total: remoteFile.size,
            percentage: 0,
          } as JobProgressInfo,
          createdTime: new Date(),
          type: JobTypeInfo.download,
          file: remoteFile,
          localFilePath: newLocalFilePath,
        } as JobInfo;
        job.subJobs.push(subJob);
      }
    }
    progress(job);
    //start job
    for (const subJob of job.subJobs) {
      const previousLoaded = job.progress.loaded;
      await downloadFile(subJob, (x: JobInfo) => {
        job.progress.loaded = previousLoaded + x.progress.loaded;
        job.progress.percentage = getPercentage(
          job.progress.loaded,
          job.progress.total,
        );
        progress(job);
      });
      if (subJob.status === JobStatusInfo.completed) {
        job.progress.loaded = previousLoaded + subJob.file.size;
      }
      job.progress.percentage = getPercentage(
        job.progress.loaded,
        job.progress.total,
      );
      progress(job);
    }
    if (job.progress.percentage === 100) {
      job.status = JobStatusInfo.completed;
      progress(job);
    } else {
      job.status = JobStatusInfo.failed;
      progress(job);
    }
  } else {
    await downloadFile(job, progress);
  }
}

async function downloadFile(job: JobInfo, progress: (job: JobInfo) => void) {
  let writeStream: WriteStream;
  try {
    createDirByFilePath(job.localFilePath);
    writeStream = fs.createWriteStream(job.localFilePath);
    progress(job);
    const client = StorageClientFactory.createClient(job.file.storage);
    const oneMB = 1024 * 1024;
    while (job.progress.percentage !== 100) {
      const start = job.progress.loaded + 1;
      const end = start + oneMB;
      const res = await client.downloadFileInChunks(job.file, start, end);
      job.progress.loaded = res.progress.loaded;
      job.progress.percentage = res.progress.percentage;
      job.progress.total = res.progress.total;
      writeStream.write(res.content);
      progress(job);
    }
    job.status = JobStatusInfo.completed;
    progress(job);
  } catch (e: any) {
    job.status = JobStatusInfo.failed;
    job.error = e.message;
    progress(job);
  } finally {
    if (writeStream) {
      writeStream.close();
    }
  }
}

function getFilesRecursively(
  dir: string,
): { isDirectory: boolean; path: string; size: number }[] {
  const files = fs.readdirSync(dir);
  const fileList: { isDirectory: boolean; path: string; size: number }[] = [];
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      fileList.push({
        isDirectory: true,
        path: filePath,
        size: 0,
      });
      const files = getFilesRecursively(filePath);
      fileList.push(...files);
    } else {
      fileList.push({
        isDirectory: false,
        path: filePath,
        size: stat.size,
      });
    }
  });
  return fileList;
}

export async function upload(
  file: FileInfo,
  localFilePath: string,
  progress: (job: JobInfo) => void,
) {
  const job = {
    id: v4().toString(),
    name: file.name,
    status: JobStatusInfo.loading,
    progress: {
      loaded: -1,
      total: 0,
      percentage: 0,
    } as JobProgressInfo,
    createdTime: new Date(),
    type: JobTypeInfo.upload,
    file: file,
    localFilePath: localFilePath,
  } as JobInfo;
  if (file.type.fileType === FileFormatType.Folder) {
    const files = getFilesRecursively(localFilePath);
    job.progress.loaded = 0;
    if (files.length === 0) {
      job.status = JobStatusInfo.completed;
      job.error = "The folder is empty, nothing to upload";
      progress(job);
      return;
    }
    job.subJobs = [];
    for (const localFile of files) {
      const localFileName = getFileName(localFile.path);
      if (localFile.isDirectory) {
        const remoteFile = {
          ...file,
          name: localFileName,
          path: buildCloudPath(
            file.path,
            localFile.path.substring(localFilePath.length + 1),
          ),
          size: 0,
          type: FolderFileType,
        } as FileInfo;
        await StorageClientFactory.createClient(job.file.storage).createFolder(
          remoteFile,
        );
      } else {
        job.progress.total += localFile.size;
        const remoteFile = {
          ...file,
          name: localFileName,
          path: buildCloudPath(
            file.path,
            localFile.path.substring(localFilePath.length + 1),
          ),
          //path: `${file.path}${localFile.path.substring(localFilePath.length + 1).replace("\\", "/")}`,
          size: localFile.size,
        } as FileInfo;
        const subJob = {
          id: v4().toString(),
          name: remoteFile.name,
          status: JobStatusInfo.loading,
          progress: {
            loaded: -1,
            total: remoteFile.size,
            percentage: 0,
          } as JobProgressInfo,
          createdTime: new Date(),
          type: JobTypeInfo.upload,
          file: remoteFile,
          localFilePath: localFile.path,
        } as JobInfo;
        job.subJobs.push(subJob);
      }
    }
    progress(job);
    //start job
    for (const subJob of job.subJobs) {
      const previousLoaded = job.progress.loaded;
      await uploadFile(subJob, (x: JobInfo) => {
        job.progress.loaded = previousLoaded + x.progress.loaded;
        job.progress.percentage = getPercentage(
          job.progress.loaded,
          job.progress.total,
        );
        progress(job);
      });
      if (subJob.status === JobStatusInfo.completed) {
        job.progress.loaded = previousLoaded + subJob.file.size;
      }
      job.progress.percentage = getPercentage(
        job.progress.loaded,
        job.progress.total,
      );
      progress(job);
    }
    if (job.progress.percentage === 100) {
      job.status = JobStatusInfo.completed;
      progress(job);
    } else {
      job.status = JobStatusInfo.failed;
      progress(job);
    }
  } else {
    await uploadFile(job, progress);
  }
}

async function uploadFile(job: JobInfo, progress: (job: JobInfo) => void) {
  progress(job);
  await StorageClientFactory.createClient(job.file.storage).uploadFile(
    job.file,
    job.localFilePath,
    (progressStatus) => {
      job.progress = progressStatus;
      progress(job);
    },
  );
  job.status = JobStatusInfo.completed;
  progress(job);
  return true;
}

function createDirByFilePath(filePath: string) {
  const dir = path.dirname(filePath);
  createDir(dir);
}

function createDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
