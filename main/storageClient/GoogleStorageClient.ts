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

  async createFolder(file: FileInfo): Promise<FileInfo> {
    if (!file.path.endsWith("/")) {
      file.path = file.path + "/";
    }
    await this.client.bucket(file.bucket.name).file(file.path).save(""); //.create();
    file.lastModify = new Date();
    return file;
  }

  async getFile(file: FileInfo): Promise<FileDetailInfo> {
    return await this.headObject(file);
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
    // @google-cloud/storage library will not return folder if that folder is not object
    let [files, res, apiResponse] = await this.client
      .bucket(bucket.name)
      .getFiles({
        delimiter,
        prefix: parentPath,
        // autoPaginate:false,
        // includeFoldersAsPrefixes: true,
        // //maxResults: 1000,
        includeTrailingDelimiter: true,
        //versions: true,
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
    apiResponse.prefixes?.forEach((folder) => {
      if (!list.some((file) => file.path === folder)) {
        list.push({
          name: getFileName(folder),
          storage: this.storage,
          bucket: bucket,
          path: folder,
          type: FolderFileType,
        } as FileInfo);
      }
    });
    return {
      list,
      nextToken: res?.pageToken,
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

  /**
   * Move a object
   * @param file
   * @param destinationFile
   */
  async moveObject(file: FileInfo, destinationFile: FileInfo) {
    const moveDestination = this.client
      .bucket(destinationFile.bucket.name)
      .file(destinationFile.path);
    await this.client
      .bucket(file.bucket.name)
      .file(file.path)
      .move(moveDestination);
  }

  /**
   * Copy a object
   * @param file
   * @param destinationFile
   */
  async copyObject(file: FileInfo, destinationFile: FileInfo) {
    const copyDestination = this.client
      .bucket(destinationFile.bucket.name)
      .file(destinationFile.path);
    await this.client
      .bucket(file.bucket.name)
      .file(file.path)
      .copy(copyDestination);
  }

  /**
   * Delete a object
   * @param file
   */
  async deleteObject(file: FileInfo) {
    await this.client.bucket(file.bucket.name).file(file.path).delete();
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
}
