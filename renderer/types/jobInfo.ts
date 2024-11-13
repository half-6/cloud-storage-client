import { FileInfo } from "./storage";

export interface JobInfo {
  id: string;
  name: string;
  status: JobStatusInfo;
  file: FileInfo;
  progress?: JobProgressInfo;
  cancel?: () => void;
  createdTime: Date;
  type: JobTypeInfo;
  outputFilePath?: string;
}

export enum JobStatusInfo {
  loading,
  pause,
  completed,
  Failed,
}
export enum JobTypeInfo {
  upload,
  download,
}

export interface JobProgressInfo {
  loaded: number;
  total: number;
  percentage: number;
}

export interface JobDownloadInfo {
  content: Uint8Array | string;
  progress?: JobProgressInfo;
}
