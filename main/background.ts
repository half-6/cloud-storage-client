import path from "path";
import { app, dialog, ipcMain, shell } from "electron";
import serve from "electron-serve";
import { createWindow, readLocalStorage, writeLocalStorage } from "./helpers";
import { JobInfo, JobStatusInfo } from "#types";
import { StorageClientFactory } from "#storageClient";
import fs from "fs";

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
ipcMain.on("show-save-files-dialog", async (event, args: { job: JobInfo }) => {
  const { job } = args;
  const outputFolderPath = dialog.showSaveDialogSync({
    defaultPath: job.file.name,
    properties: ["createDirectory"],
  });
});
ipcMain.on("show-save-file-dialog", async (event, args: { job: JobInfo }) => {
  const { job } = args;
  const outputFilePath = dialog.showSaveDialogSync({
    defaultPath: job.file.name,
  });
  if (outputFilePath) {
    // can't use enum here, it will cause compile error
    job.status = JobStatusInfo.loading;
    job.outputFilePath = outputFilePath;
    job.progress.loaded = -1;
    job.progress.percentage = 0;
    job.progress.total = job.file.size;
    event.reply("download-file-progress", {
      job,
    });
    try {
      const writeStream = fs.createWriteStream(outputFilePath);
      const client = StorageClientFactory.createClient(job.file.storage);
      const oneMB = 1024 * 1024;
      while (job.progress.loaded !== job.progress.total - 1) {
        const start = job.progress.loaded + 1;
        const end = start + oneMB;
        const res = await client.downloadFileInChunks(job.file, start, end);
        job.progress.loaded = res.progress.loaded;
        job.progress.percentage = res.progress.percentage;
        job.progress.total = res.progress.total;
        writeStream.write(res.content);
        event.reply("download-file-progress", {
          job,
        });
      }
      job.status = JobStatusInfo.completed;
      event.reply("download-file-progress", {
        job,
      });
    } catch (e) {
      job.status = JobStatusInfo.Failed;
      event.reply("download-file-progress", {
        job,
      });
    }
  }
});

ipcMain.on("open-file", async (event, args) => {
  await shell.openPath(args);
});
