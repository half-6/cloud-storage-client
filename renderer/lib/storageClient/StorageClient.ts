import {
  BucketInfo,
  FileDetailInfo,
  FileInfo,
  JobDownloadInfo,
  StorageInfo,
} from "#types";

export class StorageClient<T extends StorageInfo> {
  static defaultDelimiter = "/";
  storage: T;

  constructor(storage: T) {
    this.storage = storage;
  }

  //bucket operation
  async getBuckets(
    signal?: AbortSignal,
    progress?: (progress: number) => void,
  ): Promise<BucketInfo[]> {
    return window.ipc.invoke("get-buckets", this.storage);
  }

  async createBucket(bucket: BucketInfo): Promise<void> {
    return window.ipc.invoke("create-bucket", this.storage, bucket);
  }

  async deleteBucket(bucket: BucketInfo): Promise<void> {
    return window.ipc.invoke("delete-bucket", this.storage, bucket);
  }

  //file Operation
  async getFiles(
    bucket: BucketInfo,
    parentPath: string,
    signal?: AbortSignal,
    progress?: (progress: number) => void,
    delimiter?: string,
  ): Promise<FileInfo[]> {
    let output: FileInfo[] = [];
    let nextContinuationToken: string | undefined = undefined;
    let index = 0;
    progress && progress(index);
    do {
      const res = await this.getTop1000Files(
        bucket,
        parentPath,
        nextContinuationToken,
        delimiter,
      );
      nextContinuationToken = res.nextToken;
      const currentRes = res.list.map((r, i) => {
        return {
          ...r,
          id: ++index,
          bucket,
          storage: this.storage,
        } as FileInfo;
      });
      output.push(...currentRes);
      progress && progress(output.length);
    } while (nextContinuationToken && (!signal || !signal.aborted));
    return output;
  }

  async getTop1000Files(
    bucket: BucketInfo,
    parentPath: string,
    continuationToken?: string,
    delimiter?: string | undefined,
  ): Promise<{
    list: FileInfo[];
    nextToken: string;
  }> {
    return await window.ipc.invoke(
      "get-top1000-files",
      this.storage,
      bucket,
      parentPath,
      continuationToken,
      delimiter,
    );
  }

  async getFilesRecursively(
    bucket: BucketInfo,
    parentPath: string,
    signal?: AbortSignal,
    progress?: (progress: number) => void,
  ): Promise<FileInfo[]> {
    return this.getFiles(bucket, parentPath, signal, progress, "");
  }

  async uploadFile(file: FileInfo, localFilePath: string): Promise<void> {
    await window.ipc.invoke("upload-file", file, localFilePath);
  }

  //folder operation
  async createFolder(file: FileInfo): Promise<FileInfo> {
    return await window.ipc.invoke("create-folder", file);
  }

  async delete(file: FileInfo): Promise<void> {
    await window.ipc.invoke("delete-file", file);
  }

  async getFile(file: FileInfo): Promise<FileDetailInfo> {
    return await window.ipc.invoke("get-file", file);
  }

  async downloadFile(file: FileInfo): Promise<FileDetailInfo> {
    return await window.ipc.invoke("download-file", file);
  }

  async downloadFileInChunks(
    file: FileInfo,
    localFilePath: string,
  ): Promise<JobDownloadInfo> {
    return await window.ipc.invoke(
      "download-file-in-chunks",
      file,
      localFilePath,
    );
  }

  async move(file: FileInfo, destinationFile: FileInfo): Promise<void> {
    await window.ipc.invoke("move-file", file, destinationFile);
  }

  async copy(file: FileInfo, destinationFile: FileInfo): Promise<void> {
    await window.ipc.invoke("copy-file", file, destinationFile);
  }

  async hasObject(file: FileInfo): Promise<boolean> {
    return await window.ipc.invoke("has-file", file);
  }
}
