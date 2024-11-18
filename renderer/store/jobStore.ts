import { create } from "zustand/index";
import {
  FileInfo,
  JobInfo,
  JobProgressInfo,
  JobStatusInfo,
  JobTypeInfo,
} from "#types";
import { deepClone, isIpcReady } from "../lib";
import { v4 } from "uuid";
import { enqueueSnackbar } from "notistack";

export interface JobStoreState {
  show: boolean;
  jobs: JobInfo[];
  setJobs: (jobs: JobInfo[]) => void;
  upsertJob: (job: JobInfo) => void;
  deleteJob: (job: JobInfo) => void;
  downloadFile: (file: FileInfo) => void;
  downloadFolder: (file: FileInfo) => void;
  openFile: (filePath: string) => void;
}
export const useJobStore = create<JobStoreState>((set, get) => {
  if (isIpcReady()) {
    setTimeout(() => {
      window.ipc.on("download-file-progress", (args: { job: JobInfo }) => {
        const { job } = args;
        get().upsertJob(job);
        if (job.status === JobStatusInfo.completed) {
          enqueueSnackbar(`Download ${job.file.name} completed`, {
            variant: "success",
          });
        }
        if (job.status === JobStatusInfo.Failed) {
          enqueueSnackbar(`Download ${job.file.name} failed`, {
            variant: "error",
          });
        }
      });
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
    upsertJob: (job: JobInfo) => {
      let jobs = get().jobs;
      const existJob = jobs.find((c) => c.id === job.id);
      if (existJob) {
        jobs = jobs.map((a) => {
          if (a.id === job.id) {
            return job;
          }
          return a;
        });
        set(() => ({
          jobs: jobs,
        }));
      } else {
        jobs.push(job);
        set(() => ({
          jobs: jobs,
        }));
      }
    },
    downloadFile: (file: FileInfo) => {
      const cloneFile = deepClone(file) as FileInfo;
      const job: JobInfo = {
        id: v4().toString(),
        name: cloneFile.name,
        file: cloneFile,
        status: JobStatusInfo.loading,
        progress: {
          loaded: 0,
          total: file.size,
          percentage: 0,
        } as JobProgressInfo,
        createdTime: new Date(),
        type: JobTypeInfo.download,
      };
      window.ipc.send("show-save-file-dialog", {
        job,
      });
    },
    downloadFolder: (file: FileInfo) => {
      const cloneFile = deepClone(file) as FileInfo;
      const job: JobInfo = {
        id: v4().toString(),
        name: cloneFile.name,
        file: cloneFile,
        status: JobStatusInfo.loading,
        progress: {
          loaded: 0,
          total: file.size,
          percentage: 0,
        } as JobProgressInfo,
        createdTime: new Date(),
        type: JobTypeInfo.download,
      };
      window.ipc.send("show-save-files-dialog", {
        job,
      });
    },
    openFile: (filePath: string) => {
      window.ipc.send("open-file", filePath);
    },
  };
});
