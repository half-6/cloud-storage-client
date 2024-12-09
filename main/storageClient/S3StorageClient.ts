import {
  AWSS3StorageInfo,
  BucketInfo,
  FileDetailInfo,
  FileFormatType,
  FileInfo,
  FolderFileType,
  JobDownloadInfo,
  JobProgressInfo,
  S3PermissionInfo,
  StorageType,
  TagInfo,
  getFileTypeByFileName,
} from "#types";

import { StorageClient } from "./StorageClient";

import {
  BucketLocationConstraint,
  CopyObjectCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectAclCommand,
  GetObjectCommand,
  GetObjectTaggingCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  asyncFilter,
  chunkArray,
  convertFileToBuffer,
  deepClone,
  getFileMime,
  getFileName,
  getPercentage,
  promiseAllInBatches,
  replaceFromEnd,
} from "#utility";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";

export class S3StorageClient extends StorageClient<AWSS3StorageInfo> {
  client: S3Client;

  constructor(storage: AWSS3StorageInfo) {
    super(storage);
    this.client = new S3Client({
      endpoint: this.storage.endpoint || null,
      region: this.storage.region,
      credentials: {
        accessKeyId: this.storage.accessKeyId,
        secretAccessKey: this.storage.secretAccessKey,
      },
    });
  }

  //region Bucket Operation
  /**
   * head Bucket
   * You can use this operation to determine if a bucket exists and if you have permission to access it.
   * @param store
   * @param bucketName
   */
  private async headBucket(bucketName: string) {
    const command = new HeadBucketCommand({ Bucket: bucketName });
    return await this.client.send(command);
  }

  private async getTop1000Buckets(input: { ContinuationToken?: string }) {
    const command = new ListBucketsCommand(input);
    const res = await this.client.send(command);
    const availableBuckets = await asyncFilter(res?.Buckets, async (bucket) => {
      try {
        const head = await this.headBucket(bucket.Name);
        return bucket;
      } catch (e) {
        return null;
      }
    });
    //const availableBuckets = res?.Buckets;
    const list = availableBuckets?.map((r) => {
      return {
        name: r.Name,
        createDate: r.CreateDate,
        region: this.storage.region,
      } as BucketInfo;
    }) as BucketInfo[];

    return {
      list: list,
      nextToken: res?.ContinuationToken,
    };
  }

  async getBuckets(
    signal?: AbortSignal,
    progress?: (progress: number) => void,
  ): Promise<BucketInfo[]> {
    let output: BucketInfo[] = [];
    let nextContinuationToken: string | undefined = undefined;
    let index = 0;
    progress && progress(index);
    const input: {
      ContinuationToken?: string;
    } = {};
    do {
      input.ContinuationToken = nextContinuationToken;
      const res = await this.getTop1000Buckets(input);
      nextContinuationToken = res.nextToken;
      output.push(...res.list);
      progress && progress(output.length);
    } while (nextContinuationToken);
    return output;
  }

  async createBucket(bucket: BucketInfo) {
    const input = {
      Bucket: bucket.name,
      CreateBucketConfiguration: bucket.region
        ? {
            LocationConstraint: bucket.region as BucketLocationConstraint,
          }
        : undefined,
    };

    const command = new CreateBucketCommand(input);
    await this.client.send(command);
  }

  async deleteBucket(bucket: BucketInfo) {
    const input = {
      Bucket: bucket.name,
    };

    const command = new DeleteBucketCommand(input);
    this.client.send(command);
  }

  //endregion

  //region Folder operation
  async createFolder(file: FileInfo) {
    if (!file.path.endsWith("/")) {
      file.path = file.path + "/";
    }
    const command = new PutObjectCommand({
      Bucket: file.bucket.name,
      Key: file.path,
    });
    await this.client.send(command);
    file.lastModify = new Date();
    return file;
  }

  //endregion

  //region File list operation
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

  private async getTop1000Files(
    bucket: BucketInfo,
    parentPath: string,
    continuationToken?: string,
    delimiter?: string | undefined,
  ) {
    if (delimiter === undefined) {
      delimiter = "/";
    }
    const commandInput = {
      Bucket: bucket.name,
      Prefix: parentPath,
      Delimiter: delimiter,
      ContinuationToken: continuationToken,
    };
    const command = new ListObjectsV2Command(commandInput);
    const res = await this.client.send(command);
    const list: FileInfo[] = [];
    res?.CommonPrefixes?.forEach((folder) => {
      list.push({
        type: FolderFileType,
        name: getFileName(folder.Prefix),
        path: folder.Prefix,
        storage: this.storage,
        bucket: bucket,
        size: 0,
      } as FileInfo);
    });
    res?.Contents?.forEach((file) => {
      if (commandInput?.Prefix?.toLowerCase() === file.Key.toLowerCase()) {
        return;
      }
      if (file.Key.endsWith("/")) {
        list.push({
          type: FolderFileType,
          name: getFileName(file.Key),
          path: file.Key,
          storage: this.storage,
          bucket: bucket,
          size: 0,
        } as FileInfo);
      } else {
        list.push({
          type: getFileTypeByFileName(file.Key),
          name: getFileName(file.Key),
          lastModify: new Date(file.LastModified),
          size: file.Size,
          path: file.Key,
          storage: this.storage,
          bucket: bucket,
        } as FileInfo);
      }
    });
    return {
      list: list,
      nextToken: res?.NextContinuationToken,
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

  //endregion

  //region Object operation
  async headObject(file: FileInfo): Promise<FileDetailInfo> {
    const command = new HeadObjectCommand({
      Bucket: file.bucket.name,
      Key: file.path,
    });
    const res = await this.client.send(command);
    const fileDetail = { ...file } as FileDetailInfo;
    fileDetail.size = res.ContentLength || fileDetail.size;
    fileDetail.eTag = res.ETag;
    fileDetail.serverSideEncryption = res.ServerSideEncryption;
    fileDetail.versionId = res.VersionId;
    fileDetail.acceptRanges = res.AcceptRanges;
    fileDetail.metadata = res.Metadata;
    fileDetail.contentType = res.ContentType;
    fileDetail.url = this.getFileUrl(file);
    return fileDetail;
  }

  async hasObject(file: FileInfo): Promise<boolean> {
    try {
      await this.headObject(file);
      return true;
    } catch (e) {
      return false;
    }
  }

  private async getObjectTags(file: FileInfo) {
    const command = new GetObjectTaggingCommand({
      Bucket: file.bucket.name,
      Key: file.path,
    });
    const res = await this.client.send(command);
    return res.TagSet.map((item) => {
      return {
        key: item.Key,
        value: item.Value,
      } as TagInfo;
    });
  }

  private async getObjectAcl(file: FileInfo) {
    const command = new GetObjectAclCommand({
      Bucket: file.bucket.name,
      Key: file.path,
    });
    const res = await this.client.send(command);
    return res as S3PermissionInfo;
  }

  async deleteObject(file: FileInfo): Promise<void> {
    if (file.type.fileType === FileFormatType.Folder) {
      const allFiles = await this.getFilesRecursively(file.bucket, file.path);
      const keys = allFiles.map((item) => {
        return { Key: item.path };
      });
      keys.push({ Key: file.path });
      //The request can contain a list of up to 1000 keys that you want to delete
      const chunkedKeysList = chunkArray(keys, 1000);
      for (let chunkedKeys of chunkedKeysList) {
        const batchCommand = {
          Bucket: file.bucket.name,
          Delete: {
            Objects: chunkedKeys,
            Quiet: false,
          },
        };
        const command = new DeleteObjectsCommand(batchCommand);
        await this.client.send(command);
      }
      return;
    } else {
      const command = new DeleteObjectCommand({
        Bucket: file.bucket.name,
        Key: file.path,
      });
      await this.client.send(command);
    }
  }

  async renameObject(file: FileInfo, newFileName: string) {
    const newFilePath = replaceFromEnd(file.path, file.name, newFileName);
    await this.cloneObject(file, newFilePath);
    await this.deleteObject(file);
    const newFile: FileInfo = deepClone(file);
    newFile.path = newFilePath;
    newFile.name = newFileName;
    return newFile;
  }

  async cloneObject(file: FileInfo, newPath: string) {
    let newKey = newPath;
    if (
      file.type.fileType === FileFormatType.Folder &&
      !newPath.endsWith("/")
    ) {
      newKey = newKey + "/";
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
      await promiseAllInBatches(jobs, 100);
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

  async copyObject(
    sourceBucket: string,
    sourcePath: string,
    newBucket: string,
    newPath: string,
  ) {
    const command = new CopyObjectCommand({
      Bucket: newBucket,
      CopySource: sourceBucket + "/" + sourcePath,
      Key: newPath,
    });
    return await this.client.send(command);
  }

  async getObject(file: FileInfo, start?: number, end?: number) {
    const range = start || end ? `bytes=${start}-${end}` : undefined;
    const command = new GetObjectCommand({
      Bucket: file.bucket.name,
      Key: file.path,
      Range: range,
      //ChecksumMode: "ENABLED",
    });
    return await this.client.send(command);
  }

  //endregion

  //region File operation
  async uploadFile(
    file: FileInfo,
    localFilePath: string,
    progress: ((progress: JobProgressInfo) => void) | undefined,
  ): Promise<void> {
    const fileStream = fs.readFileSync(localFilePath);
    const fileType = await getFileMime(fileStream);
    const parallelUploads3 = new Upload({
      client: this.client,
      params: {
        Bucket: file.bucket.name,
        Key: file.path,
        Body: fileStream,
        ContentType: fileType?.mime || undefined,
      },
      //tags:[],
      // (optional) concurrency configuration
      //queueSize: 4,
      // (optional) size of each part, in bytes, at least 5MB
      //partSize: 1024 * 1024 * 5,
      // (optional) when true, do not automatically call AbortMultipartUpload when
      // a multipart upload fails to complete. You should then manually handle
      // the leftover parts.
      //leavePartsOnError: false,
    });
    parallelUploads3.on("httpUploadProgress", (status) => {
      progress({
        loaded: status.loaded,
        total: status.total,
        percentage: getPercentage(status.loaded, status.total),
      } as JobProgressInfo);
    });
    await parallelUploads3.done();
  }

  async getFile(file: FileInfo): Promise<FileDetailInfo> {
    const fileDetail = await this.headObject(file);
    if (this.storage.type === StorageType.AWSS3) {
      fileDetail.permission = await this.getObjectAcl(file);
      fileDetail.tags = await this.getObjectTags(file);
    }
    return fileDetail;
  }

  /**
   * download file for preview, better less than 100M
   * @param file
   */
  async downloadFile(file: FileInfo) {
    const res = await this.getObject(file);
    const fileDetail = { ...file } as FileDetailInfo;
    fileDetail.size = res.ContentLength || fileDetail.size;
    fileDetail.eTag = res.ETag;
    fileDetail.serverSideEncryption = res.ServerSideEncryption;
    fileDetail.versionId = res.VersionId;
    fileDetail.acceptRanges = res.AcceptRanges;
    fileDetail.metadata = res.Metadata;
    fileDetail.contentType = res.ContentType;
    //transformToByteArray, transformToWebStream, transformToString
    const byteArray = await res.Body.transformToByteArray();
    const fileType = await getFileMime(byteArray);
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

  getRangeAndLength = (contentRange) => {
    const [range, length] = contentRange.split("/");
    const [start, end] = range.split("-");
    return {
      start: Number.parseInt(start),
      end: Number.parseInt(end),
      length: Number.parseInt(length),
    };
  };

  async downloadFileInChunks(file: FileInfo, start: number, end: number) {
    const { ContentRange, Body } = await this.getObject(file, start, end);
    const rangeAndLength = this.getRangeAndLength(ContentRange);
    return {
      content: await Body.transformToByteArray(),
      progress: {
        percentage: getPercentage(
          rangeAndLength.end,
          rangeAndLength.length - 1,
        ),
        loaded: rangeAndLength.end,
        total: rangeAndLength.length,
      },
    } as JobDownloadInfo;
  }

  //endregion

  getFileUrl(file: FileInfo) {
    if (this.storage.endpoint) {
      return `https://${file.bucket.name}.${this.storage.endpoint.substring(9)}/${file.path}`;
    }
    const regionString = this.storage.region.includes("us-east-1")
      ? ""
      : "-" + this.storage.region;
    return `https://${file.bucket.name}.s3${regionString}.amazonaws.com/${file.path}`;
  }
}
