import { IpcRendererEvent, contextBridge, ipcRenderer } from "electron";

const handler = {
  send(channel: string, value: unknown) {
    ipcRenderer.send(channel, value);
  },
  async invoke(channel: string, ...args: any[]): Promise<any> {
    return await ipcRenderer.invoke(channel, ...args);
  },
  on(channel: string, callback: (...args: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
};
contextBridge.exposeInMainWorld("ipc", handler);
export type IpcHandler = typeof handler;
