import { create } from "zustand/index";
import {
  FileInfo,
  JobInfo,
  JobProgressInfo,
  JobStatusInfo,
  JobTypeInfo,
} from "../types";
import { StorageClientFactory, deepClone, isIpcReady } from "../lib";
import { v4 } from "uuid";
import { enqueueSnackbar } from "notistack";

export interface JobStoreState {
  show: boolean;
  jobs: JobInfo[];
  setJobs: (jobs: JobInfo[]) => void;
  deleteJob: (job: JobInfo) => void;
  startJob: (job: JobInfo) => void;
  stopJob: (job: JobInfo) => void;
  downloadFile: (file: FileInfo) => void;
  openFile: (filePath: string) => void;
}
const oneMB = 1024 * 1024;

export const useJobStore = create<JobStoreState>((set, get) => {
  if (isIpcReady()) {
    setTimeout(() => {
      window.ipc.on("download-file-progress", (args: { job: JobInfo }) => {
        const { job } = args;
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
      window.ipc.on(
        "show-save-file-dialog-result",
        (args: { job: JobInfo }) => {
          const { job } = args;
          let jobs = get().jobs;
          const exist: JobInfo = jobs.find((j) => j.id === job.id);
          if (exist) {
            jobs = jobs.map((a) => {
              if (a.id === job.id) {
                return job;
              }
              return a;
            });
            set(() => ({
              jobs: jobs,
            }));
            console.log("show-save-file-dialog-result", job.status);
            if (job.status === JobStatusInfo.loading) {
              const start = job.progress.loaded + 1;
              let end = start + oneMB;
              // if (end > job.progress.total) {
              //   end = job.progress.total;
              // }
              StorageClientFactory.createCachedClient(job.id, job.file.storage)
                .downloadFileInChunks(job.file, start, end)
                .then((process) => {
                  window.ipc.send("save-file-bytes", { job, process });
                })
                .catch((e: any) => {
                  console.log(e);
                  enqueueSnackbar(e.message, { variant: "error" });
                });
            }
          } else {
            //start downloading
            jobs.push(job);
            set(() => ({
              jobs: jobs,
            }));
            const start = 0;
            const end = start + oneMB;
            StorageClientFactory.createCachedClient(job.id, job.file.storage)
              .downloadFileInChunks(job.file, start, end)
              .then((process) => {
                window.ipc.send("save-file-bytes", { job, process });
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
    startJob: (job: JobInfo) => {
      const jobs = get().jobs.map((a) => {
        if (a.id === job.id) {
          job.status = JobStatusInfo.loading;
          return job;
        }
        return a;
      });
      set({
        jobs: jobs,
      });
    },
    stopJob: (job: JobInfo) => {
      const jobs = get().jobs.map((a) => {
        if (a.id === job.id) {
          job.status = JobStatusInfo.pause;
          return job;
        }
        return a;
      });
      set({
        jobs: jobs,
      });
    },
    // downloadFile1: (file: FileInfo) => {
    //   const cloneFile = deepClone(file) as FileInfo;
    //   const job: JobInfo = {
    //     id: v4().toString(),
    //     name: cloneFile.name,
    //     file: cloneFile,
    //     status: JobStatusInfo.loading,
    //     progress: {
    //       loaded: 0,
    //       total: file.size,
    //       percentage: 0,
    //     } as JobProgressInfo,
    //     createdTime: new Date(),
    //     type: JobTypeInfo.download,
    //   };
    //   window.ipc.send("show-save-file-dialog", {
    //     job,
    //   });
    // },
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
      window.ipc.send("show-save-dialog", {
        job,
      });
    },
    openFile: (filePath: string) => {
      window.ipc.send("open-file", filePath);
    },
  };
});
