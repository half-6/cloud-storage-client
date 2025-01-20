import { ipcMain } from "electron";
import fs from "fs";

ipcMain.handle("is-directory", async (event, localFilePath: string) => {
  return fs.statSync(localFilePath).isDirectory();
});
