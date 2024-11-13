import { JobInfo, JobTypeInfo } from "../types";

export class JobManager {
  jobs: JobInfo[];
  constructor() {}
  add(job: JobInfo) {
    this.jobs.push(job);
    switch (job.type) {
      case JobTypeInfo.upload:
        break;
      case JobTypeInfo.download:
        break;
    }
  }
}
