import { FileInfo } from "#types";

export function getFileName(path: string) {
  const list =
    path.indexOf("/") >= 0 ? path.trim().split("/") : path.trim().split("\\");
  let fileName = list.pop();
  while (fileName.trim() === "" && list.length > 0) {
    fileName = list.pop();
  }
  return fileName;
}
export function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop().toUpperCase();
  if (extension === fileName.toUpperCase()) {
    return null;
  }
  return extension;
}

export function formatFileSize(bytes: number) {
  if (!bytes) return "";
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function convertFileToBuffer(file: File) {
  return new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result instanceof ArrayBuffer) {
        const byteArray = new Uint8Array(event.target.result);
        resolve(byteArray);
      } else {
        reject(new Error("FileReader did not return an ArrayBuffer"));
      }
    };
    reader.onerror = (event) => {
      reject(event.target?.error || new Error("FileReader error"));
    };
    reader.readAsArrayBuffer(file);
  });
}

export function getNoneDuplicatedFileName(
  fileList: FileInfo[],
  fileName: string,
) {
  let index = 1;
  fileName = getFileName(fileName);
  const extension = fileName.split(".").pop().toLowerCase();
  const fileNameWithoutExtension = fileName.substring(
    0,
    extension ? fileName.length - extension.length - 1 : fileName.length,
  );
  let output = extension
    ? `${fileNameWithoutExtension}.${extension}`
    : fileNameWithoutExtension;
  while (fileList.find((f) => f.name === output)) {
    output = `${fileNameWithoutExtension}-${index}`;
    output = extension ? `${output}.${extension}` : output;
    index++;
  }
  return output;
}
export function getNoneDuplicatedCloneFileName(
  fileList: FileInfo[],
  fileName: string,
) {
  fileName = getFileName(fileName);
  const extension = getFileExtension(fileName)?.toLowerCase();
  const fileNameWithoutExtension =
    fileName.substring(
      0,
      extension ? fileName.length - extension.length - 1 : fileName.length,
    ) + "-Copy";
  let output = extension
    ? `${fileNameWithoutExtension}.${extension}`
    : fileNameWithoutExtension;
  let index = 1;
  while (fileList.find((f) => f.name === output)) {
    output = `${fileNameWithoutExtension}(${index})`;
    output = extension ? `${output}.${extension}` : output;
    index++;
  }
  return output;
}

export async function streamToBase64(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream
      .on("data", (chunk) => chunks.push(chunk))
      .on("error", reject)
      .on("end", () => {
        const buffer = Buffer.concat(chunks);
        const base64 = buffer.toString("base64");
        resolve(base64);
      });
  });
}

export function getFileFullPath(file: FileInfo) {
  const path = [];
  path.push(file.storage.name);
  path.push(file.bucket.name);
  path.push(file.path);
  return path.join("/");
}
