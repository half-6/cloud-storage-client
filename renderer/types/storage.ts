import { FileTypeInfo, S3PermissionInfo } from "./";

export interface StorageInfo {
  id: string;
  name: string; //display name
  icon: string; //display icon
}

export interface AWSS3StorageInfo extends StorageInfo {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}
export interface BucketInfo {
  name: string;
  region: RegionInfo;
  createDate: Date;
}
export interface FileInfo {
  name: string;
  lastModify: Date;
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

export const RegionInfoList = [
  "af-south-1",
  "ap-east-1",
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-northeast-3",
  "ap-south-1",
  "ap-south-2",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-southeast-3",
  "ca-central-1",
  "cn-north-1",
  "cn-northwest-1",
  "EU",
  "eu-central-1",
  "eu-north-1",
  "eu-south-1",
  "eu-south-2",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "me-south-1",
  "sa-east-1",
  "us-east-1",
  "us-east-2",
  "us-gov-east-1",
  "us-gov-west-1",
  "us-west-1",
  "us-west-2",
];
export type RegionInfo = (typeof RegionInfoList)[number];
