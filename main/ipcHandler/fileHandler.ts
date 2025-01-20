import { contextBridge, ipcRenderer } from "electron";

const handler = {
  async isDirectory(localFilePath: string): Promise<boolean> {
    return await ipcRenderer.invoke("is-directory", localFilePath);
  },
};
contextBridge.exposeInMainWorld("localFile", handler);
export type FileHandler = typeof handler;
