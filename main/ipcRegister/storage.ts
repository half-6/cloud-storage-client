import { ipcMain } from "electron";
import { BucketInfo, FileInfo, JobInfo, StorageInfo } from "#types";
import { StorageClientFactory, download, upload } from "../storageClient";

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

ipcMain.handle("delete-file", async (event, file: FileInfo) => {
  await StorageClientFactory.createClient(file.storage).delete(file);
});

ipcMain.handle(
  "move-file",
  async (event, file: FileInfo, destinationFile: FileInfo) => {
    await StorageClientFactory.createClient(file.storage).move(
      file,
      destinationFile,
    );
  },
);

ipcMain.handle("has-file", async (event, file: FileInfo) => {
  return await StorageClientFactory.createClient(file.storage).hasObject(file);
});

ipcMain.handle(
  "copy-file",
  async (event, file: FileInfo, destinationFile: FileInfo) => {
    await StorageClientFactory.createClient(file.storage).copy(
      file,
      destinationFile,
    );
  },
);

ipcMain.handle(
  "upload-file",
  async (event, file: FileInfo, localFilePath: string) => {
    await upload(file, localFilePath, (job: JobInfo) => {
      event.sender.send("file-progress", {
        job,
      });
    });
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
