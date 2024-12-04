import {
  AWSS3StorageInfo,
  GoogleStorageInfo,
  StorageInfo,
  StorageType,
} from "#types";
import { S3StorageClient } from "./S3StorageClient";
import { GoogleStorageClient } from "./GoogleStorageClient";
import { StorageClient } from "./StorageClient";

export class StorageClientFactory {
  static createClient(storage: StorageInfo) {
    switch (storage.type) {
      case StorageType.AWSS3:
      case StorageType.AWSS3COMPATIBLE:
        return new S3StorageClient(storage as AWSS3StorageInfo);
      case StorageType.GoogleCloudStorage:
        return new GoogleStorageClient(storage as GoogleStorageInfo);
    }
  }

  static cachedClient = new Map<string, StorageClient<StorageInfo>>();

  static createCachedClient(cacheKey: string, storage: StorageInfo) {
    if (this.cachedClient.has(cacheKey)) {
      return this.cachedClient.get(cacheKey);
    } else {
      const client = this.createClient(storage);
      this.cachedClient.set(cacheKey, client);
      return client;
    }
  }
}
