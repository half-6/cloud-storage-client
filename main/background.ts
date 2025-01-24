import path from "path";
import { app, shell } from "electron";
import serve from "electron-serve";
import { createWindow } from "./helpers";
import { autoUpdater } from "electron-updater";
import { isProd, log } from "#utility";
import "./ipcRegister";
if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

(async () => {
  await app.whenReady();
  log.initialize();
  log.info("init app success");
  const mainWindow = createWindow("main", {
    width: 1000,
    height: 600,
    autoHideMenuBar: app.isPackaged,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      devTools: !app.isPackaged,
    },
    icon: path.join(__dirname, "../resources/icon.png"),
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    if (details.url.startsWith("http")) {
      shell.openExternal(details.url);
    }
    return { action: "deny" };
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
app.on("ready", () => {
  autoUpdater.checkForUpdatesAndNotify().then(() => {
    //update success
  });
});
