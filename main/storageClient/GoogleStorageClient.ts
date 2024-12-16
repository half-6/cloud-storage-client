import {
  BucketInfo,
  FileDetailInfo,
  FileFormatType,
  FileInfo,
  FileTypeInfo,
  FolderFileType,
  GoogleBucketInfo,
  GoogleStorageInfo,
  JobDownloadInfo,
  JobProgressInfo,
  S3PermissionInfo,
  getFileTypeByFileName,
} from "#types";
import { StorageClient } from "./StorageClient";
import { Storage, TransferManager } from "@google-cloud/storage";
import {
  deepClone,
  getFileMime,
  getFileName,
  getPercentage,
  promiseAllInBatches,
  replaceFromEnd,
} from "#utility";
import fs from "fs";

export class GoogleStorageClient extends StorageClient<GoogleStorageInfo> {
  client: Storage;

  constructor(option: GoogleStorageInfo) {
    super(option);
    this.client = new Storage(option as any);
  }

  // region bucket
  async getBuckets(
    signal?: AbortSignal | undefined,
    progress?: ((progress: number) => void) | undefined,
  ): Promise<BucketInfo[]> {
    const [buckets] = await this.client.getBuckets();
    return buckets.map((bucket) => {
      return {
        name: bucket.name,
      } as BucketInfo;
    });
  }

  async createBucket(bucketInfo: GoogleBucketInfo): Promise<void> {
    if (!bucketInfo.region) {
      bucketInfo.region = "US";
    }
    const meta = {
      location: bucketInfo.region,
    };
    if (bucketInfo.storageClass) {
      meta[bucketInfo.storageClass] = true;
    }
    const [bucket] = await this.client.createBucket(bucketInfo.name, meta);
  }

  async deleteBucket(bucket: BucketInfo): Promise<void> {
    await this.client.bucket(bucket.name).delete();
  }

  //endregion

  async cloneObject(file: FileInfo, newPath: string): Promise<FileInfo> {
    let newKey = newPath;
    if (
      file.type.fileType === FileFormatType.Folder &&
      !newPath.endsWith(StorageClient.defaultDelimiter)
    ) {
      newKey = newKey + StorageClient.defaultDelimiter;
    }
    if (file.type.fileType === FileFormatType.Folder) {
      const allFiles = await this.getFilesRecursively(file.bucket, file.path);
      // clone folder first for empty folder case
      await this.copyObject(
        file.bucket.name,
        file.path,
        file.bucket.name,
        newKey,
      );
      const jobs = allFiles.map((item) => {
        const itemNewPath = item.path.replace(file.path, newKey);
        return this.copyObject(
          file.bucket.name,
          item.path,
          file.bucket.name,
          itemNewPath,
        );
      });
      await promiseAllInBatches(jobs, 10);
    } else {
      await this.copyObject(
        file.bucket.name,
        file.path,
        file.bucket.name,
        newKey,
      );
    }
    const newFile: FileInfo = deepClone(file);
    newFile.path = newKey;
    return newFile;
  }

  async createFolder(file: FileInfo): Promise<FileInfo> {
    if (!file.path.endsWith("/")) {
      file.path = file.path + "/";
    }
    await this.client.bucket(file.bucket.name).file(file.path).save(""); //.create();
    file.lastModify = new Date();
    return file;
  }

  async deleteObject(file: FileInfo): Promise<void> {
    await this.client.bucket(file.bucket.name).file(file.path).delete();
  }

  /**
   * download file for preview, better less than 100M
   * @param file
   */
  async downloadFile(file: FileInfo): Promise<FileDetailInfo> {
    const [byteArray] = await this.client
      .bucket(file.bucket.name)
      .file(file.path)
      .download();
    const fileType = await getFileMime(byteArray);
    const fileDetail = { ...file } as FileDetailInfo;
    fileDetail.isReadableContent = fileType.mime.includes("text");
    fileDetail.isImageContent = fileType.mime.includes("image");
    if (fileDetail.isReadableContent) {
      fileDetail.body = fileType.body;
    }
    if (fileDetail.isImageContent) {
      fileDetail.body =
        "data:" +
        fileType.mime +
        ";base64," +
        Buffer.from(byteArray).toString("base64");
    }
    return fileDetail;
  }

  async getFile(file: FileInfo): Promise<FileDetailInfo> {
    return await this.headObject(file);
  }

  async headObject(file: FileInfo): Promise<FileDetailInfo> {
    const [res] = await this.client
      .bucket(file.bucket.name)
      .file(file.path)
      .getMetadata();
    const fileDetail = { ...file } as FileDetailInfo;
    fileDetail.eTag = res.etag;
    fileDetail.serverSideEncryption =
      res.customerEncryption?.encryptionAlgorithm;
    fileDetail.versionId = res.generation.toString();
    fileDetail.acceptRanges = "";
    fileDetail.metadata = res.metadata;
    fileDetail.contentType = res.contentType;
    fileDetail.url = res.mediaLink;
    return fileDetail;
  }

  async hasObject(file: FileInfo): Promise<boolean> {
    const [res] = await this.client
      .bucket(file.bucket.name)
      .file(file.path)
      .exists();
    return res;
  }

  async copyObject(
    sourceBucket: string,
    sourcePath: string,
    newBucket: string,
    newPath: string,
  ) {
    const copyDestination = this.client.bucket(newBucket).file(newPath);
    return await this.client
      .bucket(sourceBucket)
      .file(sourcePath)
      .copy(copyDestination);
  }

  async getFiles(
    bucket: BucketInfo,
    parentPath: string,
    signal?: AbortSignal | undefined,
    progress?: ((progress: number) => void) | undefined,
    delimiter?: string | undefined,
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

  async getTop1000Files(
    bucket: BucketInfo,
    parentPath: string,
    continuationToken?: string,
    delimiter?: string | undefined,
  ): Promise<{ list: FileInfo[]; nextToken: string }> {
    if (delimiter === undefined) {
      delimiter = "/";
    }
    let [files, res] = await this.client.bucket(bucket.name).getFiles({
      delimiter,
      prefix: parentPath,
      //includeFoldersAsPrefixes: true,
      //maxResults: 1000,
      includeTrailingDelimiter: true,
    });
    if (parentPath) {
      files = files.filter((f) => f.name !== parentPath);
    }
    const list = files.map((file) => {
      if (file.name.endsWith("/")) {
        return {
          name: getFileName(file.name),
          storage: this.storage,
          bucket: bucket,
          path: file.name,
          type: FolderFileType,
          lastModify: new Date(file.metadata.updated),
        } as FileInfo;
      }
      return {
        name: getFileName(file.name),
        storage: this.storage,
        bucket: bucket,
        path: file.name,
        type: getFileTypeByFileName(file.name), // file.metadata.contentType
        size: Number(file.metadata.size),
        lastModify: new Date(file.metadata.updated),
      } as FileInfo;
    });
    return {
      list,
      nextToken: res.pageToken,
    };
  }

  async getFilesRecursively(
    bucket: BucketInfo,
    parentPath: string,
    signal?: AbortSignal | undefined,
    progress?: ((progress: number) => void) | undefined,
  ): Promise<FileInfo[]> {
    return this.getFiles(bucket, parentPath, signal, progress, "");
  }

  async renameObject(file: FileInfo, newFileName: string): Promise<FileInfo> {
    const newFilePath = replaceFromEnd(file.path, file.name, newFileName);
    await this.cloneObject(file, newFilePath);
    await this.deleteObject(file);
    const newFile: FileInfo = deepClone(file);
    newFile.path = newFilePath;
    newFile.name = newFileName;
    return newFile;
  }

  uploadFile(
    file: FileInfo,
    localFilePath: string,
    progress: ((progress: JobProgressInfo) => void) | undefined,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const cloudFile = this.client.bucket(file.bucket.name).file(file.path);
      const readStream = fs.createReadStream(localFilePath);
      let uploadedBytes = 0;
      const stat = fs.statSync(localFilePath);
      const total = stat.size;
      let percentage = 0;
      readStream.on("data", (chunk) => {
        uploadedBytes += chunk.length;
        const currentPercentage = getPercentage(uploadedBytes, total);
        if (currentPercentage > percentage) {
          percentage = currentPercentage;
          progress({
            loaded: uploadedBytes,
            total: total,
            percentage: percentage,
          } as JobProgressInfo);
        }
      });
      readStream.on("end", () => {
        readStream.close();
        resolve();
      });
      readStream.pipe(cloudFile.createWriteStream());
    });
  }

  async downloadFileInChunks(
    file: FileInfo,
    start: number,
    end: number,
  ): Promise<JobDownloadInfo> {
    const options = {
      start: start,
      end: end,
    };
    const [content] = await this.client
      .bucket(file.bucket.name)
      .file(file.path)
      .download(options);
    return {
      content: content,
      progress: {
        percentage: getPercentage(start + content.length, file.size),
        loaded: start + content.length,
        total: file.size,
      },
    } as JobDownloadInfo;
  }
}
