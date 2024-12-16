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
  ): Promise<string> {
    return await ipcRenderer.invoke(
      "show-save-dialog",
      defaultPath,
      properties,
    );
  },
  async showOpenDialog(
    defaultPath: string,
    properties?: Array<
      | "openFile"
      | "openDirectory"
      | "multiSelections"
      | "showHiddenFiles"
      | "createDirectory"
      | "promptToCreate"
      | "noResolveAliases"
      | "treatPackageAsDirectory"
      | "dontAddToRecent"
    >,
  ): Promise<string[]> {
    return await ipcRenderer.invoke(
      "show-open-dialog",
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
