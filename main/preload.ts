import { IpcRendererEvent, contextBridge, ipcRenderer } from "electron";

const handler = {
  send(channel: string, value: unknown) {
    ipcRenderer.send(channel, value);
  },
  sendSync(channel: string, value: unknown): any {
    return ipcRenderer.sendSync(channel, value);
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

contextBridge.exposeInMainWorld("electron", {
  startDrag: (fileName) => ipcRenderer.send("ondragstart", fileName),
});

export type IpcHandler = typeof handler;
