import { create } from "zustand/index";
import {
  AWSS3StorageInfo,
  FileInfo,
  JobInfo,
  JobStatusInfo,
  JobTypeInfo,
} from "../types";
import { deepClone, isIpcReady } from "../lib";
import { useToastStore } from "./toastStore";

export interface JobStoreState {
  show: boolean;
  jobs: JobInfo[];
  setJobs: (jobs: JobInfo[]) => void;
  deleteJob: (job: JobInfo) => void;
  downloadFile: (
    store: AWSS3StorageInfo,
    bucketName: string,
    file: FileInfo,
  ) => void;
  openFile: (filePath: string) => void;
}

export const useJobStore = create<JobStoreState>((set, get) => {
  if (isIpcReady()) {
    setTimeout(() => {
      window.ipc.on(
        "download-file-progress",
        (args: {
          file: FileInfo;
          outputFilePath: string;
          progress: {
            percentage: number;
            transferred: number;
            length: number;
            speed: number;
          };
        }) => {
          const { file, outputFilePath, progress } = args;
          const jobs = get().jobs;
          const currentProgress = progress.percentage;
          const existJob = jobs.find((job) => job.id === file.path);
          if (existJob) {
            existJob.progress = currentProgress;
            set(() => ({
              jobs: jobs,
            }));
          } else {
            jobs.push({
              id: file.path,
              name: file.name,
              progress: currentProgress,
              createdTime: new Date(),
              status: JobStatusInfo.loading,
              type: JobTypeInfo.download,
              outputFilePath: outputFilePath,
            });
            set(() => ({
              jobs: jobs,
            }));
          }
        },
      );
      window.ipc.on(
        "download-file-completed",
        (args: { file: FileInfo; outputFilePath: string }) => {
          const { file, outputFilePath } = args;
          const jobs = get().jobs;
          const existJob = jobs.find((job) => job.id === file.path);
          if (existJob) {
            existJob.progress = 100;
            existJob.status = JobStatusInfo.completed;
            set(() => ({
              jobs: jobs,
            }));
            useToastStore.getState().showToastMessage({
              message: `Download file to ${outputFilePath} success`,
            });
          }
        },
      );
    });
  }
  return {
    show: false,
    jobs: [] as JobInfo[],
    setJobs: (jobs: JobInfo[]) => {
      set({
        jobs: jobs,
      });
    },
    deleteJob: (job: JobInfo) => {
      const newJobs = get().jobs.filter((s) => s !== job);
      get().setJobs(newJobs);
    },
    downloadFile: (
      store: AWSS3StorageInfo,
      bucketName: string,
      file: FileInfo,
    ) => {
      const cloneFile = deepClone(file);
      cloneFile.type = undefined;
      window.ipc.send("show-save-dialog", {
        store,
        bucketName,
        file: cloneFile,
      });
    },
    openFile: (filePath: string) => {
      window.ipc.send("open-file", filePath);
    },
  };
});
