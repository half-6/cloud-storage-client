import {
  BucketInfo,
  FileDetailInfo,
  FileInfo,
  GoogleCloudStorageInfo,
  JobDownloadInfo,
  JobProgressInfo,
} from "#types";
import { StorageClient } from "./StorageClient";

export class GoogleStorageClient extends StorageClient<GoogleCloudStorageInfo> {
  constructor(storage: GoogleCloudStorageInfo) {
    super(storage);
  }

  cloneObject(file: FileInfo, newPath: string): Promise<FileInfo> {
    return Promise.resolve(undefined);
  }

  createBucket(bucket: BucketInfo): Promise<void> {
    return Promise.resolve(undefined);
  }

  createFolder(file: FileInfo): Promise<FileInfo> {
    return Promise.resolve(undefined);
  }

  deleteBucket(bucket: BucketInfo): Promise<void> {
    return Promise.resolve(undefined);
  }

  deleteObject(file: FileInfo): Promise<void> {
    return Promise.resolve(undefined);
  }

  downloadFile(file: FileInfo): Promise<FileDetailInfo> {
    return Promise.resolve(undefined);
  }

  getBuckets(
    signal?: AbortSignal | undefined,
    progress?: ((progress: number) => void) | undefined,
  ): Promise<BucketInfo[]> {
    return Promise.resolve([]);
  }

  getFile(file: FileInfo): Promise<FileDetailInfo> {
    return Promise.resolve(undefined);
  }

  getFiles(
    bucket: BucketInfo,
    parentPath: string,
    signal?: AbortSignal | undefined,
    progress?: ((progress: number) => void) | undefined,
    delimiter?: string | undefined,
  ): Promise<FileInfo[]> {
    return Promise.resolve([]);
  }

  getFilesRecursively(
    bucket: BucketInfo,
    parentPath: string,
    signal: AbortSignal | undefined,
    progress: ((progress: number) => void) | undefined,
  ): Promise<FileInfo[]> {
    return Promise.resolve([]);
  }

  renameObject(file: FileInfo, newFileName: string): Promise<FileInfo> {
    return Promise.resolve(undefined);
  }

  uploadFile(
    bucket: BucketInfo,
    uploadFilePath: string,
    file: File,
    progress: ((progress: JobProgressInfo) => void) | undefined,
  ): Promise<void> {
    return Promise.resolve(undefined);
  }

  downloadFileInChunks(
    file: FileInfo,
    start: number,
    end: number,
  ): Promise<JobDownloadInfo> {
    return Promise.resolve(undefined);
  }

  headObject(file: FileInfo): Promise<FileDetailInfo> {
    return Promise.resolve(undefined);
  }

  hasObject(file: FileInfo): Promise<boolean> {
    return Promise.resolve(false);
  }
}
