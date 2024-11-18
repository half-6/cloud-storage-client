import {
  BucketInfo,
  FileDetailInfo,
  FileInfo,
  JobDownloadInfo,
  JobProgressInfo,
  StorageInfo,
} from "#types";

export abstract class StorageClient<T extends StorageInfo> {
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
  abstract getFiles(
    bucket: BucketInfo,
    parentPath: string,
    signal?: AbortSignal,
    progress?: (progress: number) => void,
    delimiter?: string,
  ): Promise<FileInfo[]>;
  abstract getFilesRecursively(
    bucket: BucketInfo,
    parentPath: string,
    signal?: AbortSignal,
    progress?: (progress: number) => void,
  ): Promise<FileInfo[]>;

  abstract uploadFile(
    bucket: BucketInfo,
    uploadFilePath: string,
    file: File,
    progress?: (progress: JobProgressInfo) => void,
  ): Promise<void>;

  //folder operation
  abstract createFolder(file: FileInfo): Promise<FileInfo>;

  abstract deleteObject(file: FileInfo): Promise<void>;

  abstract getFile(file: FileInfo): Promise<FileDetailInfo>;

  abstract downloadFile(file: FileInfo): Promise<FileDetailInfo>;
  abstract downloadFileInChunks(
    file: FileInfo,
    start: number,
    end: number,
  ): Promise<JobDownloadInfo>;

  abstract renameObject(file: FileInfo, newFileName: string): Promise<FileInfo>;
  abstract cloneObject(file: FileInfo, newPath: string): Promise<FileInfo>;

  abstract headObject(file: FileInfo): Promise<FileDetailInfo>;
  abstract hasObject(file: FileInfo): Promise<boolean>;
}
