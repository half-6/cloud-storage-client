import { StorageInfo } from "#types";
import { StorageClient } from "./StorageClient";

export class StorageClientFactory {
  static createClient(storage: StorageInfo) {
    return new StorageClient(storage);
  }
}
