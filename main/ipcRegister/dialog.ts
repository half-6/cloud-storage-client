import { dialog, ipcMain, shell } from "electron";

ipcMain.on("open-file", async (event, args) => {
  await shell.openPath(args);
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
