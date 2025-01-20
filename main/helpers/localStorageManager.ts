import { LocalStorageInfo } from "#types";
import Store from "electron-store";
import { log } from "#utility";
import { safeStorage } from "electron";
import { app } from "electron";
const StoreKey = "accounts";
const StoreFile = `storage-config${app.isPackaged ? "" : "-dev"}`;
const store = new Store({ name: StoreFile });

export function writeLocalStorage(config: LocalStorageInfo) {
  store.set(StoreKey, encrypt(JSON.stringify(config)));
}

export function readLocalStorage() {
  const encryptedConfig = store.get(StoreKey) as string;
  try {
    return JSON.parse(decrypt(encryptedConfig)) as LocalStorageInfo;
  } catch (e) {
    log.error("readLocalStorage failed", e);
    return null;
  }
}

export function encrypt(plainText: string) {
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(plainText).toString("base64");
  }
}

export function decrypt(plainText: string) {
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.decryptString(Buffer.from(plainText, "base64"));
  }
  return plainText;
}
