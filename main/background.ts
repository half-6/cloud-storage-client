import path from "path";
import fs from "fs";
import { app, dialog, ipcMain, shell } from "electron";
import serve from "electron-serve";
import { createWindow, readLocalStorage, writeLocalStorage } from "./helpers";
import { downloadFileInChunks } from "./helpers/downloadManager";
import { JobDownloadInfo, JobInfo, JobStatusInfo } from "../renderer/types";

const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

(async () => {
  await app.whenReady();
  const mainWindow = createWindow("main", {
    width: 1000,
    height: 600,
    autoHideMenuBar: app.isPackaged,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      devTools: !app.isPackaged,
    },
  });

  if (isProd) {
    await mainWindow.loadURL("app://./home");
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }
})();

app.on("window-all-closed", () => {
  app.quit();
});

ipcMain.on("read-config", async (event, arg) => {
  event.reply("read-config", readLocalStorage());
});

ipcMain.on("write-config", async (event, arg) => {
  writeLocalStorage(arg);
  event.reply("write-config", true);
});
ipcMain.on("show-save-dialog", async (event, args: { job: JobInfo }) => {
  const { job } = args;
  const outputFilePath = dialog.showSaveDialogSync({
    defaultPath: job.file.name,
  });
  if (outputFilePath) {
    // can't use enum here, it will cause compile error
    job.status = 0;
    job.outputFilePath = outputFilePath;
    job.progress.loaded = 0;
    job.progress.percentage = 0;
    job.progress.total = job.file.size;
    event.reply("download-file-progress", {
      job,
    });
    try {
      await downloadFileInChunks(job.file, outputFilePath, (progress) => {
        job.progress.loaded = progress.transferred;
        job.progress.percentage = progress.percentage;
        job.progress.total = progress.length;
        event.reply("download-file-progress", {
          job,
        });
      });
      job.status = 2;
      event.reply("download-file-progress", {
        job,
      });
    } catch (e) {
      job.status = 3;
      event.reply("download-file-progress", {
        job,
      });
    }
  }
});

ipcMain.on("open-file", async (event, args) => {
  await shell.openPath(args);
});
ipcMain.on(
  "save-file-bytes",
  async (event, args: { job: JobInfo; process: JobDownloadInfo }) => {
    const { job, process } = args;
    try {
      //job.status = 2;
      await fs.appendFileSync(job.outputFilePath, process.content, {});
      job.progress.loaded = process.progress.loaded;
      job.progress.percentage = process.progress.percentage;
      if (job.progress.loaded >= job.progress.total) {
        job.status = 2;
      }
    } catch (e) {
      job.status = 3;
    } finally {
      event.reply("show-save-file-dialog-result", { job });
    }
  },
);
ipcMain.on("show-save-file-dialog", async (event, args: { job: JobInfo }) => {
  const { job } = args;
  job.outputFilePath = dialog.showSaveDialogSync({
    defaultPath: job.file.name,
  });
  event.reply("show-save-file-dialog-result", {
    job,
  });
});
