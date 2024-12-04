import { ipcMain } from "electron";
import { readLocalStorage, writeLocalStorage } from "../helpers";

ipcMain.handle("read-config", async (event, arg) => {
  return readLocalStorage();
});

ipcMain.handle("write-config", async (event, arg) => {
  writeLocalStorage(arg);
  return true;
});
