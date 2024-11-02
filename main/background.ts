import path from "path";
import { app, dialog, ipcMain, shell } from "electron";
import serve from "electron-serve";
import { createWindow, readLocalStorage, writeLocalStorage } from "./helpers";
import {
  downloadFileInChunks,
  downloadFileToStream,
} from "./helpers/downloadManager";

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
ipcMain.on("show-save-dialog", async (event, args) => {
  const { store, bucketName, file } = args;
  const outputFilePath = dialog.showSaveDialogSync({
    defaultPath: file.name,
  });
  if (outputFilePath) {
    await downloadFileInChunks(
      store,
      bucketName,
      file,
      outputFilePath,
      (progress) => {
        event.reply("download-file-progress", {
          file,
          outputFilePath,
          progress,
        });
      },
    );
    event.reply("download-file-completed", {
      file,
      outputFilePath,
    });
  }
});

ipcMain.on("open-file", async (event, args) => {
  await shell.openPath(args);
});
