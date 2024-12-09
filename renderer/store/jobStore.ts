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
}
export const useJobStore = create<JobStoreState>((set, get) => {
  if (isIpcReady()) {
    setTimeout(() => {
      window.ipc.on("file-progress", (args: { job: JobInfo }) => {
        const { job } = args;
        get().upsertJob(job);
        const jobType = job.type === JobTypeInfo.upload ? "Upload" : "Download";
        if (job.status === JobStatusInfo.completed) {
          const msg = job.error || `${jobType} ${job.file.name} success`;
          enqueueSnackbar(msg, {
            variant: "success",
          });
        }
        if (job.status === JobStatusInfo.failed) {
          enqueueSnackbar(`${jobType} ${job.file.name} failed`, {
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
      let newJobs = get().jobs.filter((s) => s !== job);
      newJobs = newJobs.map((a) => {
        return {
          ...a,
          subJobs: a.subJobs.filter((s) => s !== job),
        };
      });
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
  };
});
