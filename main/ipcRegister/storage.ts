import { ipcMain } from "electron";
import {
  BucketInfo,
  FileInfo,
  JobInfo,
  JobProgressInfo,
  JobStatusInfo,
  JobTypeInfo,
  StorageInfo,
} from "#types";
import { StorageClientFactory, download } from "../storageClient";
import { v4 } from "uuid";

//region bucket
ipcMain.handle("get-buckets", async (event, storage: StorageInfo) => {
  return await StorageClientFactory.createClient(storage).getBuckets();
});

ipcMain.handle(
  "create-bucket",
  async (event, storage: StorageInfo, bucket: BucketInfo) => {
    return await StorageClientFactory.createClient(storage).createBucket(
      bucket,
    );
  },
);

ipcMain.handle(
  "delete-bucket",
  async (event, storage: StorageInfo, bucket: BucketInfo) => {
    return await StorageClientFactory.createClient(storage).deleteBucket(
      bucket,
    );
  },
);
// endregion

ipcMain.handle(
  "get-top1000-files",
  async (
    event,
    storage: StorageInfo,
    bucket: BucketInfo,
    parentPath?: string,
    continuationToken?: string,
    delimiter?: string,
  ) => {
    return await StorageClientFactory.createClient(storage).getTop1000Files(
      bucket,
      parentPath,
      continuationToken,
      delimiter,
    );
  },
);

ipcMain.handle("get-file", async (event, file: FileInfo) => {
  return await StorageClientFactory.createClient(file.storage).getFile(file);
});

ipcMain.handle("create-folder", async (event, file: FileInfo) => {
  return await StorageClientFactory.createClient(file.storage).createFolder(
    file,
  );
});

ipcMain.handle("delete-object", async (event, file: FileInfo) => {
  return await StorageClientFactory.createClient(file.storage).deleteObject(
    file,
  );
});

ipcMain.handle(
  "rename-object",
  async (event, file: FileInfo, newFileName: string) => {
    return await StorageClientFactory.createClient(file.storage).renameObject(
      file,
      newFileName,
    );
  },
);

ipcMain.handle("has-object", async (event, file: FileInfo) => {
  return await StorageClientFactory.createClient(file.storage).hasObject(file);
});

ipcMain.handle(
  "clone-object",
  async (event, file: FileInfo, newFileName: string) => {
    return await StorageClientFactory.createClient(file.storage).cloneObject(
      file,
      newFileName,
    );
  },
);

ipcMain.handle(
  "upload-file",
  async (event, file: FileInfo, localFilePath: string) => {
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
    event.sender.send("file-progress", {
      job,
    });
    await StorageClientFactory.createClient(file.storage).uploadFile(
      file,
      localFilePath,
      (progress) => {
        job.progress = progress;
        event.sender.send("file-progress", {
          job,
        });
      },
    );
    job.status = JobStatusInfo.completed;
    event.sender.send("file-progress", {
      job,
    });
    return true;
  },
);

ipcMain.handle("download-file", async (event, file: FileInfo) => {
  return await StorageClientFactory.createClient(file.storage).downloadFile(
    file,
  );
});

ipcMain.handle(
  "download-file-in-chunks",
  async (event, file: FileInfo, localFilePath: string) => {
    await download(file, localFilePath, (job: JobInfo) => {
      event.sender.send("file-progress", {
        job,
      });
    });
  },
);