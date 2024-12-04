import {
  AWSS3StorageInfo,
  GoogleStorageInfo,
  StorageInfo,
  StorageType,
} from "#types";
import { StorageClient } from "./StorageClient";

export class StorageClientFactory {
  static createClient(storage: StorageInfo) {
    return new StorageClient(storage);
  }
}
