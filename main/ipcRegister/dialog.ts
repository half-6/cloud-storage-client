import { dialog, ipcMain, shell } from "electron";

ipcMain.on("open-file", async (event, args) => {
  return await shell.openPath(args);
});

ipcMain.handle(
  "show-save-dialog",
  (
    event,
    defaultPath: string,
    properties?: Array<
      | "showHiddenFiles"
      | "createDirectory"
      | "treatPackageAsDirectory"
      | "showOverwriteConfirmation"
      | "dontAddToRecent"
    >,
  ) => {
    return dialog.showSaveDialogSync({
      defaultPath: defaultPath,
      properties: properties,
    });
  },
);

ipcMain.handle(
  "show-open-dialog",
  (
    event,
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
  ) => {
    return dialog.showOpenDialogSync({
      defaultPath: defaultPath,
      properties: properties,
    });
  },
);
