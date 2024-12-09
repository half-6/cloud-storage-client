import {
  FileFormatType,
  FileInfo,
  JobInfo,
  JobProgressInfo,
  JobStatusInfo,
  JobTypeInfo,
} from "#types";
import { v4 } from "uuid";
import fs from "fs";
import { StorageClientFactory } from "./StorageClientFactory";
import path from "path";
import { getPercentage } from "#utility";
import { WriteStream } from "node:fs";

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
      await downloadFile(subJob, (x: JobInfo) => {
        progress(job);
      });
      if (subJob.status === JobStatusInfo.completed) {
        job.progress.loaded += subJob.file.size;
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

function createDirByFilePath(filePath: string) {
  const dir = path.dirname(filePath);
  createDir(dir);
}

function createDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
