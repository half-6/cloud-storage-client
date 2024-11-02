import { LocalStorageInfo } from "../../renderer/types";
import Store from "electron-store";
const StoreKey = "electron-cloud-storage-client-config";
const StoreFile = "electron-cloud-storage-client-config";
const store = new Store({ name: StoreFile });

export function writeLocalStorage(config: LocalStorageInfo) {
  console.log("writeLocalStorage", JSON.stringify(config));
  store.set(StoreKey, config);
}

export function readLocalStorage() {
  //store.delete(StoreKey);
  const config = store.get(StoreKey) as LocalStorageInfo;
  console.log("readLocalStorage", JSON.stringify(config));
  return config;
}
