import { ConfigHandler, DialogHandler, IpcHandler } from "../main/preload";

declare global {
  interface Window {
    ipc: IpcHandler;
    config: ConfigHandler;
    dialog: DialogHandler;
  }
}
