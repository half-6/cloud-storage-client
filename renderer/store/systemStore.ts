import { create } from "zustand";
import { v4 } from "uuid";
import {
  AWSS3StorageInfo,
  FileInfo,
  LocalStorageInfo,
  StorageInfo,
} from "../types";
import { isIpcReady } from "../lib";
export interface SystemStoreState {
  showDrawer: boolean;
  setShowDrawer: (show: boolean) => void;
  localStorage: LocalStorageInfo;
  setLocalStorage: (config: LocalStorageInfo) => void;
  addStorage: (storage: StorageInfo) => void;
  cloneStorage: (storage: StorageInfo) => void;
  updateStorage: (storage: StorageInfo) => void;
  deleteStorage: (storage: StorageInfo) => void;
}
export const useSystemStore = create<SystemStoreState>((set, get) => {
  if (isIpcReady()) {
    setTimeout(() => {
      window.ipc.send("read-config", "read-config");
      window.ipc.on("read-config", (message: LocalStorageInfo) => {
        if (!message) {
          message = {
            Storages: [] as StorageInfo[],
          };
        }
        //add id for edition
        message.Storages = message.Storages.map((store, index) => {
          return {
            ...store,
            id: store.id || v4().toString(),
          };
        });
        console.log("read-config", message);
        set(() => ({
          localStorage: message,
        }));
      });
    });
  }

  return {
    showDrawer: true,
    setShowDrawer: (show: boolean) => {
      set({ showDrawer: show });
    },
    //localstorage
    localStorage: {} as LocalStorageInfo,
    setLocalStorage: (config: LocalStorageInfo) => {
      config.Storages = config.Storages.map((store, index) => {
        return {
          ...store,
          id: store.id || v4().toString(),
        };
      });
      set({ localStorage: config });
      console.log("write-config", config);
      window.ipc.send("write-config", config);
    },
    //storage
    addStorage: (storage: StorageInfo) => {
      const newLocalStorage = { ...get().localStorage };
      newLocalStorage.Storages.push(storage);
      get().setLocalStorage(newLocalStorage);
    },
    cloneStorage: (storage: StorageInfo) => {
      const newStorage = { ...storage };
      newStorage.name = newStorage.name + " - Copy";
      get().addStorage(newStorage);
    },
    updateStorage: (storage: StorageInfo) => {
      const newLocalStorage = { ...get().localStorage };
      newLocalStorage.Storages = newLocalStorage.Storages.map((item) => {
        if (item.id === storage.id) {
          return { ...item, ...storage };
        } else {
          return item;
        }
      });
      get().setLocalStorage(newLocalStorage);
    },
    deleteStorage: (storage: StorageInfo) => {
      const newLocalStorage = { ...get().localStorage };
      newLocalStorage.Storages = newLocalStorage.Storages.filter(
        (s) => s !== storage,
      );
      get().setLocalStorage(newLocalStorage);
    },
  };
});
