import {
  BucketInfo,
  FileDetailInfo,
  FileFormatType,
  FileInfo,
  JobDownloadInfo,
  JobProgressInfo,
  StorageInfo,
} from "#types";
import { promiseAllInBatches } from "#utility";

export abstract class StorageClient<T extends StorageInfo> {
  static defaultDelimiter = "/";
  storage: T;

  constructor(storage: T) {
    this.storage = storage;
  }

  //bucket operation
  abstract getBuckets(
    signal?: AbortSignal,
    progress?: (progress: number) => void,
  ): Promise<BucketInfo[]>;

  abstract createBucket(bucket: BucketInfo): Promise<void>;

  abstract deleteBucket(bucket: BucketInfo): Promise<void>;

  //file Operation
  abstract getTop1000Files(
    bucket: BucketInfo,
    parentPath: string,
    continuationToken?: string,
    delimiter?: string | undefined,
  ): Promise<{
    list: FileInfo[];
    nextToken: string;
  }>;

  abstract getFilesRecursively(
    bucket: BucketInfo,
    parentPath: string,
    signal?: AbortSignal,
    progress?: (progress: number) => void,
  ): Promise<FileInfo[]>;

  abstract uploadFile(
    file: FileInfo,
    localFilePath: string,
    progress?: (progress: JobProgressInfo) => void,
  ): Promise<void>;

  //folder operation
  abstract createFolder(file: FileInfo): Promise<FileInfo>;

  /**
   * Delete files/folders recursively
   * @param file
   */
  async delete(file: FileInfo) {
    if (file.type.fileType === FileFormatType.Folder) {
      const allFiles = await this.getFilesRecursively(file.bucket, file.path);
      const jobs = allFiles.map((item) => {
        return this.deleteObject(item);
      });
      jobs.unshift(this.deleteObject(file));
      await promiseAllInBatches(jobs, 100);
    } else {
      await this.deleteObject(file);
    }
  }

  abstract deleteObject(file: FileInfo): Promise<void>;

  /**
   * Move files/folder recursively
   * @param file
   * @param destinationFile
   */
  async move(file: FileInfo, destinationFile: FileInfo) {
    if (file.type.fileType === FileFormatType.Folder) {
      const allFiles = await this.getFilesRecursively(file.bucket, file.path);
      const jobs = allFiles.map((item) => {
        const itemNewPath = item.path.replace(file.path, destinationFile.path);
        return this.moveObject(item, {
          ...item,
          path: itemNewPath,
          bucket: destinationFile.bucket,
          storage: destinationFile.storage,
        } as FileInfo);
      });
      // include folder
      jobs.unshift(this.moveObject(file, destinationFile));
      await promiseAllInBatches(jobs, 100);
    } else {
      await this.moveObject(file, destinationFile);
    }
  }

  abstract moveObject(file: FileInfo, destinationFile: FileInfo): Promise<void>;

  /**
   * Copy files/folders recursively
   * @param file
   * @param destinationFile
   */
  async copy(file: FileInfo, destinationFile: FileInfo): Promise<void> {
    if (file.type.fileType === FileFormatType.Folder) {
      const allFiles = await this.getFilesRecursively(file.bucket, file.path);
      const jobs = allFiles.map((item) => {
        const itemNewPath = item.path.replace(file.path, destinationFile.path);
        return this.copyObject(item, {
          ...item,
          path: itemNewPath,
          bucket: destinationFile.bucket,
          storage: destinationFile.storage,
        } as FileInfo);
      });
      if (allFiles.length === 0) {
        // include folder
        jobs.unshift(this.copyObject(file, destinationFile));
      }
      await promiseAllInBatches(jobs, 100);
    } else {
      await this.copyObject(file, destinationFile);
    }
  }

  abstract async copyObject(
    file: FileInfo,
    destinationFile: FileInfo,
  ): Promise<void>;

  abstract getFile(file: FileInfo): Promise<FileDetailInfo>;

  abstract downloadFile(file: FileInfo): Promise<FileDetailInfo>;

  abstract downloadFileInChunks(
    file: FileInfo,
    start: number,
    end: number,
  ): Promise<JobDownloadInfo>;

  async getFiles(
    bucket: BucketInfo,
    parentPath: string,
    signal?: AbortSignal | undefined,
    progress?: ((progress: number) => void) | undefined,
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
        } as FileInfo;
      });
      output.push(...currentRes);
      progress && progress(output.length);
    } while (nextContinuationToken && (!signal || !signal.aborted));
    return output;
  }

  abstract headObject(file: FileInfo): Promise<FileDetailInfo>;

  abstract hasObject(file: FileInfo): Promise<boolean>;
}
