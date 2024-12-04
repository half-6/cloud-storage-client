import { LocalStorageInfo } from "#types";
import Store from "electron-store";
import { log } from "#utility";
const StoreKey = "electron-cloud-storage-client-config";
const StoreFile = "electron-cloud-storage-client-config";
const store = new Store({ name: StoreFile });

export function writeLocalStorage(config: LocalStorageInfo) {
  log.info("writeLocalStorage", JSON.stringify(config));
  store.set(StoreKey, config);
}

export function readLocalStorage() {
  const config = store.get(StoreKey) as LocalStorageInfo;
  log.info("readLocalStorage", JSON.stringify(config));
  return config;
}
