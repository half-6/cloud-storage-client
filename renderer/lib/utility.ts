import { useRef } from "react";
import useSWR from "swr";
import exp from "node:constants";
import { FileDetailInfo, FileInfo } from "../types";
import { fileTypeFromBuffer, fileTypeFromStream } from "file-type";
import type { AnyWebReadableStream } from "file-type/core";

export function getFileName(path: string) {
  const list = path.trim().split("/");
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
export function getCloneObjectPath(objectPath: string) {
  if (objectPath.endsWith("/")) {
    //folder type
    return;
  }
}
export function deepClone(objectToCopy: any) {
  return JSON.parse(JSON.stringify(objectToCopy));
}

/**
 * Convert object to array
 * Example: { a: 1, b: 2, c: 3 }
 * To: [{key:"a",value:1},{key:"b",value:2},{key:"c",value:3}]
 * @param obj
 */
export function obj2array(obj: any) {
  if (!obj) return [];
  const keys = Object.keys(obj);
  return keys.map((key) => ({
    key,
    value: obj[key],
  }));
}
export async function asyncFilter(array, predicate) {
  const results = await Promise.all(array.map(predicate));
  return array.filter((_, index) => results[index]);
}

export function useSWRAbort<Data = any, Error = any>(
  key: string[],
  fn?: (signal: AbortSignal, ...params) => Promise<Data>,
  options?: any,
) {
  const aborter = useRef<AbortController>();
  const abort = () => aborter.current?.abort();

  const res = useSWR<Data, Error>(
    key,
    (...args) => {
      aborter.current = new AbortController();
      return fn?.(aborter.current.signal, ...args);
    },
    options,
  );

  return { ...res, abort };
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
    output = `${fileNameWithoutExtension}(${index})`;
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

export function getPercentage(partialValue, totalValue) {
  return Math.round((100 * partialValue) / totalValue);
}

export function chunkArray(a: any[], n: number) {
  return Array.from({ length: Math.ceil(a.length / n) }, (_, i) =>
    a.slice(i * n, i * n + n),
  );
}

export async function promiseAllInBatches(promises, batchSize) {
  const res = [];
  for (let i = 0; i < promises.length; i += batchSize) {
    const batch = promises.slice(i, i + batchSize);
    const results = await Promise.all(batch);
    // Process the results of this batch
    res.push(...results);
  }
  return res;
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

export async function getFileMime(byteArray: Uint8Array | ArrayBuffer) {
  const type = await fileTypeFromBuffer(byteArray);
  console.log("TTT", type);
  if (type) {
    return {
      body: null,
      mime: type.mime,
    };
  } else {
    const body = Buffer.from(byteArray).toString("utf-8");
    if (!body.includes("\ufffd")) {
      return {
        body,
        mime: "text/plain",
      };
    } else {
      return null;
    }
  }
}
export async function getFileMimeByStream(
  stream: AnyWebReadableStream<Uint8Array>,
) {
  const type = await fileTypeFromStream(stream);
  if (type) {
    return {
      body: stream,
      mime: type.mime,
    };
  } else {
    return {
      body: stream,
      mime: "text/plain",
    };
  }
}

export function isIpcReady() {
  return typeof window !== "undefined" && window.ipc;
}
