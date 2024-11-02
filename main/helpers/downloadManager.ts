import { AWSS3StorageInfo, FileInfo } from "../../renderer/types";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

const fs = require("fs");
const progress = require("progress-stream");

function getClient(store: AWSS3StorageInfo) {
  return new S3Client({
    region: store.region,
    credentials: {
      accessKeyId: store.accessKeyId,
      secretAccessKey: store.secretAccessKey,
    },
  });
}

//region downloadFileToStream
function saveStreamToFileWithProgress(stream, filePath, onProgress) {
  const writeStream = fs.createWriteStream(filePath);

  // Create a progress stream to track download progress
  const progressStream = progress(
    {
      length: stream?.headers["content-length"] || 0, // Set total length if known
      time: 1000, // Report progress every 1 second
    },
    onProgress,
  );

  // Pipe the stream through the progress stream and then to the write stream
  stream.pipe(progressStream).pipe(writeStream);

  return new Promise((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });
}

export async function downloadFileToStream(
  store: AWSS3StorageInfo,
  bucketName: string,
  file: FileInfo,
  outputFilePath: string,
  onProgress: (progress) => void,
) {
  const client = getClient(store);
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: file.path,
    ChecksumMode: "ENABLED",
  });
  const res = await client.send(command);
  //return await res.Body.transformToWebStream();
  const fileStream = await res.Body;
  await saveStreamToFileWithProgress(fileStream, outputFilePath, onProgress);
}
//endregion

//region downloadInChunks
//reference https://docs.aws.amazon.com/AmazonS3/latest/API/s3_example_s3_Scenario_UsingLargeFiles_section.html
const isComplete = ({ end, length }) => end === length - 1;
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
const oneMB = 1024 * 1024;
const getRangeAndLength = (contentRange) => {
  const [range, length] = contentRange.split("/");
  const [start, end] = range.split("-");
  return {
    start: Number.parseInt(start),
    end: Number.parseInt(end),
    length: Number.parseInt(length),
  };
};
export async function downloadFileInChunks(
  store: AWSS3StorageInfo,
  bucketName: string,
  file: FileInfo,
  outputFilePath: string,
  onProgress: (progress) => void,
) {
  const writeStream = fs.createWriteStream(outputFilePath);
  writeStream.on("error", (err) => console.error(err));

  let rangeAndLength = { start: -1, end: -1, length: -1 };

  while (!isComplete(rangeAndLength)) {
    const { end } = rangeAndLength;
    const nextRange = { start: end + 1, end: end + oneMB };

    const { ContentRange, Body } = await getObjectRange(
      store,
      bucketName,
      file,
      nextRange.start,
      nextRange.end,
    );
    writeStream.write(await Body.transformToByteArray());
    rangeAndLength = getRangeAndLength(ContentRange);
    onProgress({
      percentage: Math.round(
        (rangeAndLength.end / rangeAndLength.length) * 100,
      ),
      transferred: rangeAndLength.end,
      length: rangeAndLength.length,
      speed: oneMB,
    });
  }
  writeStream.close();
}
//endregion
