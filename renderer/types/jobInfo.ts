export interface JobInfo {
  id: string;
  name: string;
  status: JobStatusInfo;
  progress?: number;
  cancel?: () => void;
  createdTime: Date;
  type: JobTypeInfo;
  outputFilePath: string;
}

export enum JobStatusInfo {
  loading,
  completed,
}
export enum JobTypeInfo {
  upload,
  download,
}
