import { ipcMain, nativeImage } from "electron";
import { FileInfo } from "#types";
import { log } from "#utility";

ipcMain.on("ondragstart", async (event, file: FileInfo, svg: string) => {
  log.info("main ondragstart");
});
