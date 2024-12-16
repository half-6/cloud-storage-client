import { StorageClient } from "./";

export function buildCloudPath(base: string, ...paths: string[]) {
  const list = splitPath(base).filter((a) => a !== "");
  for (const path of paths) {
    list.push(...splitPath(path));
  }
  return list.join(StorageClient.defaultDelimiter);
}

export function splitPath(path: string) {
  return path.trim().split(/[\\/]/);
}
