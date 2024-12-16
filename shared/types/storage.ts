import { FileTypeInfo, S3PermissionInfo } from "./index";
import { BucketLocationConstraint } from "@aws-sdk/client-s3/";

export enum StorageType {
  AWSS3,
  AWSS3COMPATIBLE,
  GoogleCloudStorage,
}

export interface StorageInfo {
  id: string;
  name: string; //display name
  type: StorageType;
}

export interface AWSS3StorageInfo extends StorageInfo {
  region: string;
  accessKeyId: string;
  endpoint?: string;
  secretAccessKey: string;
}

export interface GoogleStorageInfo extends StorageInfo {
  //endpoint: string;
  projectId: string;
}

export interface BucketInfo {
  name: string;
  region?: string;
  createDate: Date;
}

export interface GoogleBucketInfo extends BucketInfo {
  storageClass?: string;
}

export interface FileInfo {
  name: string;
  storage: StorageInfo;
  bucket: BucketInfo;
  lastModify?: Date;
  size?: number;
  path: string;
  type: FileTypeInfo;
}

export interface FileDetailInfo extends FileInfo {
  contentType: string;
  body: string;
  eTag: string;
  serverSideEncryption: string;
  versionId: string;
  acceptRanges: string;
  url: string;
  isReadableContent: boolean;
  isImageContent: boolean;
  tags: TagInfo[];
  metadata: any;
  permission: S3PermissionInfo;
  buffer: Buffer | ReadableStream;
}
export interface TagInfo {
  key: string;
  value: string;
}

export const RegionInfoList = Object.values(BucketLocationConstraint);
