import { contextBridge, ipcRenderer } from "electron";
import { LocalStorageInfo } from "#types";

const handler = {
  async read() {
    return (await ipcRenderer.invoke("read-config")) as LocalStorageInfo;
  },
  async write(config: LocalStorageInfo) {
    return await ipcRenderer.invoke("write-config", config);
  },
};

contextBridge.exposeInMainWorld("config", handler);
export type ConfigHandler = typeof handler;
