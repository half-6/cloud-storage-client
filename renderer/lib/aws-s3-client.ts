import {
  BucketLocationConstraint,
  CopyObjectCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectAclCommand,
  GetObjectAttributesCommand,
  GetObjectCommand,
  GetObjectTaggingCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListBucketsCommand,
  ListBucketsCommandInput,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Progress, Upload } from "@aws-sdk/lib-storage";
import {
  AWSS3StorageInfo,
  BucketInfo,
  FileDetailInfo,
  FileInfo,
  FileTypeInfo,
  FolderFileType,
  RegionInfo,
  S3PermissionInfo,
  TagInfo,
} from "../types";
import {
  asyncFilter,
  chunkArray,
  convertFileToBuffer,
  getFileMime,
  getFileMimeByStream,
  getFileName,
  promiseAllInBatches,
} from "./utility";

function getClient(store: AWSS3StorageInfo) {
  return new S3Client({
    region: store.region,
    credentials: {
      accessKeyId: store.accessKeyId,
      secretAccessKey: store.secretAccessKey,
    },
  });
}

//region Buckets
export async function getAllBuckets(
  store: AWSS3StorageInfo,
  input: ListBucketsCommandInput = {},
  signal?: AbortSignal,
  progressor?: (progress: number) => void,
) {
  let output: BucketInfo[] = [];
  let nextContinuationToken: string | undefined = undefined;
  let index = 0;
  progressor && progressor(index);
  do {
    input.ContinuationToken = nextContinuationToken;
    const res = await getBuckets(store, input);
    nextContinuationToken = res.nextToken;
    output.push(...res.list);
  } while (nextContinuationToken);
  return output;
}

/**
 * getBuckets
 * only return top 1000
 * @param store
 * @param input
 */
export async function getBuckets(
  store: AWSS3StorageInfo,
  input: ListBucketsCommandInput = {},
) {
  const client = getClient(store);
  const command = new ListBucketsCommand(input);
  const res = await client.send(command);
  const availableBuckets = await asyncFilter(res?.Buckets, async (bucket) => {
    try {
      const head = await headBucket(store, bucket.Name);
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
      region: store.region,
    } as BucketInfo;
  }) as BucketInfo[];

  return {
    list: list,
    nextToken: res?.ContinuationToken,
  };
}

/**
 * head Bucket
 * You can use this operation to determine if a bucket exists and if you have permission to access it.
 * @param store
 * @param bucketName
 */
export async function headBucket(store: AWSS3StorageInfo, bucketName: string) {
  const client = getClient(store);
  const command = new HeadBucketCommand({ Bucket: bucketName });
  return await client.send(command);
}

export async function createBucket(
  store: AWSS3StorageInfo,
  bucket: BucketInfo,
) {
  const input = {
    Bucket: bucket.name,
    CreateBucketConfiguration: bucket.region
      ? {
          LocationConstraint: bucket.region as BucketLocationConstraint,
        }
      : undefined,
  };

  const command = new CreateBucketCommand(input);
  const client = getClient(store);
  return await client.send(command);
}

export async function deleteBucket(
  store: AWSS3StorageInfo,
  bucket: BucketInfo,
) {
  const input = {
    Bucket: bucket.name,
  };

  const command = new DeleteBucketCommand(input);
  const client = getClient(store);
  return await client.send(command);
}
//endregion

export async function getObject(
  store: AWSS3StorageInfo,
  bucketName: string,
  file: FileInfo,
) {
  const client = getClient(store);
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: file.path,
    ChecksumMode: "ENABLED",
  });
  return await client.send(command);
}
async function getObjectRange(
  store: AWSS3StorageInfo,
  bucketName: string,
  file: FileInfo,
  start: number,
  end: number,
) {
  const client = getClient(store);
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: file.path,
    Range: `bytes=${start}-${end}`,
  });
  return await client.send(command);
}
export async function downloadFileToStream(
  store: AWSS3StorageInfo,
  bucketName: string,
  file: FileInfo,
) {
  const res = await getObject(store, bucketName, file);
  return await res.Body.transformToWebStream();
}

export async function downloadObject(
  store: AWSS3StorageInfo,
  bucketName: string,
  file: FileInfo,
) {
  const res = await getObject(store, bucketName, file);
  const fileDetail = { ...file } as FileDetailInfo;
  fileDetail.size = res.ContentLength || fileDetail.size;
  fileDetail.eTag = JSON.parse(res.ETag);
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

export async function getFileDetail(
  store: AWSS3StorageInfo,
  file: FileInfo,
  bucketName: string,
) {
  const res = await headObject(store, bucketName, file);

  const permission = await getObjectAcl(store, bucketName, file);
  const fileDetail = { ...file } as FileDetailInfo;
  fileDetail.size = res.ContentLength || fileDetail.size;
  fileDetail.eTag = JSON.parse(res.ETag);
  fileDetail.serverSideEncryption = res.ServerSideEncryption;
  fileDetail.versionId = res.VersionId;
  fileDetail.acceptRanges = res.AcceptRanges;
  fileDetail.metadata = res.Metadata;
  fileDetail.contentType = res.ContentType;
  //transformToByteArray, transformToWebStream, transformToString
  // const byteArray = await res.Body.transformToByteArray();
  // const fileType = await getFileMime(byteArray);
  // fileDetail.isReadableContent = fileType.mime.includes("text");
  // fileDetail.isImageContent = fileType.mime.includes("image");
  // if (fileDetail.isReadableContent) {
  //   fileDetail.body = fileType.body;
  // }
  // if (fileDetail.isImageContent) {
  //   fileDetail.body =
  //     "data:" +
  //     fileType.mime +
  //     ";base64," +
  //     Buffer.from(byteArray).toString("base64");
  // }
  fileDetail.permission = permission;
  fileDetail.url = getUrlFromBucket(bucketName, store.region, file.path);
  //if (res?.TagCount > 0) {
  fileDetail.tags = await getObjectTags(store, bucketName, file);
  //}
  return fileDetail;
}

export async function headObject(
  store: AWSS3StorageInfo,
  bucketName: string,
  file: FileInfo,
) {
  const client = getClient(store);
  const command = new HeadObjectCommand({
    Bucket: bucketName,
    Key: file.path,
  });
  return await client.send(command);
}

export async function getObjectAttributes(
  store: AWSS3StorageInfo,
  bucketName: string,
  file: FileInfo,
) {
  const client = getClient(store);
  const command = new GetObjectAttributesCommand({
    Bucket: bucketName,
    Key: file.path,
    ObjectAttributes: [
      "Checksum",
      "ETag",
      "ObjectParts",
      "ObjectSize",
      "StorageClass",
    ],
  });
  return await client.send(command);
}

export async function getObjectTags(
  store: AWSS3StorageInfo,
  bucketName: string,
  file: FileInfo,
) {
  const client = getClient(store);
  const command = new GetObjectTaggingCommand({
    Bucket: bucketName,
    Key: file.path,
  });
  const res = await client.send(command);
  return res.TagSet.map((item) => {
    return {
      key: item.Key,
      value: item.Value,
    } as TagInfo;
  });
}

export async function getObjectAcl(
  store: AWSS3StorageInfo,
  bucketName: string,
  file: FileInfo,
) {
  const client = getClient(store);
  const command = new GetObjectAclCommand({
    Bucket: bucketName,
    Key: file.path,
  });
  const res = await client.send(command);
  return res as S3PermissionInfo;
}

/**
 * get top 1000 files under that folder
 * @param store
 * @param commandInput
 */
export async function getFiles(
  store: AWSS3StorageInfo,
  commandInput: ListObjectsV2CommandInput,
) {
  commandInput.Delimiter = "/";
  const client = getClient(store);
  const command = new ListObjectsV2Command(commandInput);
  const res = await client.send(command);
  const list: FileInfo[] = [];
  res?.CommonPrefixes?.forEach((folder) => {
    list.push({
      type: FolderFileType,
      name: getFileName(folder.Prefix),
      path: folder.Prefix,
    } as FileInfo);
  });
  res?.Contents?.forEach((file) => {
    if (commandInput?.Prefix?.toLowerCase() !== file.Key.toLowerCase()) {
      list.push({
        type: FileTypeInfo.getFileType(file.Key),
        name: getFileName(file.Key),
        lastModify: new Date(file.LastModified),
        size: file.Size,
        path: file.Key,
      } as FileInfo);
    }
  });
  return {
    list: list,
    nextToken: res?.NextContinuationToken,
  };
}

/**
 * get all files under that folder, NOT recursively
 * @param store
 * @param commandInput
 * @param signal
 * @param progressor
 */
export async function getAllFiles(
  store: AWSS3StorageInfo,
  commandInput: ListObjectsV2CommandInput,
  signal?: AbortSignal,
  progressor?: (progress: number) => void,
) {
  let output: FileInfo[] = [];
  let nextContinuationToken: string | undefined = undefined;
  let index = 0;
  progressor && progressor(index);
  do {
    commandInput.ContinuationToken = nextContinuationToken;
    const res = await getFiles(store, commandInput);
    nextContinuationToken = res.nextToken;
    const currentRes = res.list.map((r, i) => {
      return {
        ...r,
        id: ++index,
      };
    });
    output.push(...currentRes);
    progressor && progressor(output.length);
  } while (nextContinuationToken && (!signal || !signal.aborted));
  return output;
}

/**
 * get all files under that folder recursively
 * @param store
 * @param commandInput
 * @param signal
 * @param progressor
 */
export async function getAllFilesRecursively(
  store: AWSS3StorageInfo,
  commandInput: ListObjectsV2CommandInput,
  signal?: AbortSignal,
  progressor?: (progress: number) => void,
) {
  const allObjects = await getAllFiles(store, commandInput, signal, progressor);
  const jobs = [];
  for (let obj of allObjects) {
    if (obj.type === FolderFileType) {
      jobs.push(
        getAllFilesRecursively(
          store,
          {
            Bucket: commandInput.Bucket,
            Prefix: obj.path,
          },
          signal,
          progressor,
        ),
      );
    }
  }
  const resList = await Promise.all(jobs);
  for (let res of resList) {
    allObjects.push(...res);
  }
  return allObjects;
}

export async function createFile(
  store: AWSS3StorageInfo,
  file: FileDetailInfo,
  bucketName: string,
) {
  const client = getClient(store);
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: file.path,
    Body: file.body,
  });
  return await client.send(command);
}
export async function uploadFile(
  store: AWSS3StorageInfo,
  bucketName: string,
  uploadFilePath: string,
  file: File,
  progressor: (progress: Progress) => void,
) {
  // const fileStream = file.stream();
  // const fileType = await getFileMimeByStream(fileStream);
  const fileStream = await convertFileToBuffer(file);
  const fileType = await getFileMime(fileStream);
  const parallelUploads3 = new Upload({
    client: getClient(store),
    params: {
      Bucket: bucketName,
      Key: uploadFilePath,
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
  parallelUploads3.on("httpUploadProgress", (progress) => {
    console.log(progress);
    progressor(progress);
  });
  await parallelUploads3.done();
}

export async function createFolder(
  store: AWSS3StorageInfo,
  file: FileInfo,
  bucketName: string,
) {
  const client = getClient(store);
  if (!file.path.endsWith("/")) {
    file.path = file.path + "/";
  }
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: file.path,
  });
  return await client.send(command);
}

/**
 * cloneObject
 * clone folder need also copy all files under that folder recursively
 * @param store
 * @param bucketName
 * @param file
 * @param newPath
 */
export async function cloneObject(
  store: AWSS3StorageInfo,
  bucketName: string,
  file: FileInfo,
  newPath: string,
) {
  let newKey = newPath;
  if (file.type === FolderFileType && !newPath.endsWith("/")) {
    newKey = newKey + "/";
  }
  //clone folder need also rename all files under that folder recursively
  if (file.type === FolderFileType) {
    const allFiles = await getAllFilesRecursively(store, {
      Bucket: bucketName,
      Prefix: file.path,
    });
    const jobs = allFiles.map((item) => {
      const itemNewPath = item.path.replace(file.path, newKey);
      return copyObject(store, bucketName, item.path, bucketName, itemNewPath);
    });
    const res = await promiseAllInBatches(jobs, 100);
  } else {
    await copyObject(store, bucketName, file.path, bucketName, newKey);
  }
  return newKey;
}

/**
 * copy single object only
 * @param store
 * @param sourceBucket
 * @param sourcePath
 * @param newBucket
 * @param newPath
 */
async function copyObject(
  store: AWSS3StorageInfo,
  sourceBucket: string,
  sourcePath: string,
  newBucket: string,
  newPath: string,
) {
  const client = getClient(store);
  const command = new CopyObjectCommand({
    Bucket: newBucket,
    CopySource: sourceBucket + "/" + sourcePath,
    Key: newPath,
  });
  console.log("copyObject", sourcePath, "=>", newPath);
  return await client.send(command);
}

/**
 * deleteObject
 * delete folder need also delete all files under that folder recursively
 * @param store
 * @param bucketName
 * @param file
 */
export async function deleteObject(
  store: AWSS3StorageInfo,
  bucketName: string,
  file: FileInfo,
) {
  const client = getClient(store);
  if (file.type === FolderFileType) {
    const allFiles = await getAllFilesRecursively(store, {
      Bucket: bucketName,
      Prefix: file.path,
    });
    const keys = allFiles.map((item) => {
      return { Key: item.path };
    });
    keys.push({ Key: file.path });
    //The request can contain a list of up to 1000 keys that you want to delete
    const chunkedKeysList = chunkArray(keys, 1000);
    for (let chunkedKeys of chunkedKeysList) {
      const batchCommand = {
        Bucket: bucketName,
        Delete: {
          Objects: chunkedKeys,
          Quiet: false,
        },
      };
      const command = new DeleteObjectsCommand(batchCommand);
      await client.send(command);
    }
    return;
  } else {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: file.path,
    });
    return await client.send(command);
  }
}

/**
 * rename object
 * rename folder need also move all files under that folder recursively
 * @param store
 * @param bucketName
 * @param oldFile
 * @param newFilePath
 */
export async function renameObject(
  store: AWSS3StorageInfo,
  bucketName: string,
  oldFile: FileInfo,
  newFilePath: string,
) {
  const res = await cloneObject(store, bucketName, oldFile, newFilePath);
  await deleteObject(store, bucketName, oldFile);
}

function getUrlFromBucket(bucket, region, fileName) {
  const regionString = region.includes("us-east-1") ? "" : "-" + region;
  return `https://${bucket}.s3${regionString}.amazonaws.com/${fileName}`;
}
