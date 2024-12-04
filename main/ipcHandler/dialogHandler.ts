import { IpcRendererEvent, contextBridge, ipcRenderer } from "electron";

const handler = {
  async showSaveDialog(
    defaultPath: string,
    properties?: Array<
      | "showHiddenFiles"
      | "createDirectory"
      | "treatPackageAsDirectory"
      | "showOverwriteConfirmation"
      | "dontAddToRecent"
    >,
  ) {
    return await ipcRenderer.invoke(
      "show-save-dialog",
      defaultPath,
      properties,
    );
  },
  openFile(localFilePath: string) {
    ipcRenderer.send("open-file", localFilePath);
  },
};
contextBridge.exposeInMainWorld("dialog", handler);
export type DialogHandler = typeof handler;
