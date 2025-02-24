import React, { useState } from "react";
import { styled } from "@mui/material";
import {
  getFileFullPath,
  getFileName,
  getNoneDuplicatedCloneFileName,
  log,
  promiseAllInBatches,
  replaceFromEnd,
  useSWRAbort,
} from "../lib";
import { StorageClient, StorageClientFactory } from "#storageClient";
import {
  BucketInfo,
  FileFormatType,
  FileInfo,
  FolderFileType,
  JobInfo,
  StorageInfo,
  UploadInfo,
} from "#types";
import {
  ActionObject,
  BucketListDrawer,
  DrawerWidth,
  FileBrowser,
  FilePreview,
  Header,
  Layout,
  MenuInfo,
  TreeItemInfo,
} from "../components";
import { useAlertStore, useSystemStore } from "../store";
import useSWR from "swr";
import { useSnackbar } from "notistack";

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })<{
  open?: boolean;
}>(({ theme }) => ({
  width: `100%`,
  // flexGrow: 1,
  padding: theme.spacing(3),
  marginTop: theme.spacing(8),
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${DrawerWidth}px`,
  variants: [
    {
      props: ({ open }) => open,
      style: {
        transition: theme.transitions.create("margin", {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen,
        }),
        marginLeft: 0,
        width: `calc(100% - ${DrawerWidth}px)`,
      },
    },
  ],
}));

export default function HomePage() {
  const { showDrawer } = useSystemStore();
  const [selectedStorage, setSelectedStorage] = useState<StorageInfo>();
  const [selectedBucket, setSelectedBucket] = useState<BucketInfo>();
  const [prefix, setPrefix] = useState<string>(null);
  const [selectedFile, setSelectedFile] = useState<FileInfo>();

  const { enqueueSnackbar } = useSnackbar();
  const { openConfirmAsync, openAlertAsync } = useAlertStore();

  const [loadedFileNumber, setLoadedFileNumber] = useState(0);
  const [showFileDetail, setShowFileDetail] = useState<boolean>(false);
  const [isDownloadFile, setIsDownloadFile] = useState<boolean>(false);
  const [backgroundJobs, setBackgroundJobs] = useState<JobInfo[]>();
  const {
    data: fileList,
    isLoading: fileListLoading,
    isValidating: fileListValidating,
    error: bucketError,
    mutate: reloadFiles,
    abort: fileListAbort,
  } = useSWRAbort([selectedBucket?.name, prefix], getFilesFromStorage, {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  const {
    data: fileDetail,
    isLoading: fileDetailLoading,
    error: fileDetailError,
  } = useSWR(
    selectedFile?.path &&
      selectedFile.type.fileType !== FileFormatType.Folder &&
      showFileDetail
      ? [selectedFile?.path, showFileDetail.toString()]
      : null,
    async (params) => {
      return StorageClientFactory.createClient(selectedStorage).getFile(
        selectedFile,
      );
    },
  );
  const {
    data: downloadFile,
    isLoading: downloadLoading,
    mutate: reloadDownloadFile,
    error: downloadFileError,
  } = useSWR(
    selectedFile?.path &&
      selectedFile.type.fileType !== FileFormatType.Folder &&
      showFileDetail &&
      isDownloadFile
      ? [
          selectedFile?.path,
          showFileDetail.toString(),
          isDownloadFile.toString(),
        ]
      : null,
    async (params) => {
      return StorageClientFactory.createClient(selectedStorage).downloadFile(
        selectedFile,
      );
    },
  );

  const handleFileListAbout = () => {
    fileListAbort();
    enqueueSnackbar("The request has been aborted", { variant: "success" });
  };

  async function getFilesFromStorage(signal, params) {
    const bucketName = params[0];
    const px = params[1];
    setLoadedFileNumber(0);
    if (bucketName) {
      const command = {
        Bucket: bucketName,
        Prefix: px,
      };
      return await StorageClientFactory.createClient(selectedStorage).getFiles(
        selectedBucket,
        px,
        signal,
        (progress) => {
          setLoadedFileNumber(progress);
        },
      );
    }
    return null;
  }

  async function handleBucketClick(storage: StorageInfo, bucket: BucketInfo) {
    setSelectedStorage(storage);
    setSelectedBucket(bucket);
    setPrefix(null);
  }

  async function handleCreateBucket(storage: StorageInfo, bucket: BucketInfo) {
    await StorageClientFactory.createClient(storage).createBucket(bucket);
  }

  async function handleDeleteBucket(storage: StorageInfo, bucket: BucketInfo) {
    await StorageClientFactory.createClient(storage).deleteBucket(bucket);
  }

  async function handleNewFolder(newFolderName: string) {
    await StorageClientFactory.createClient(selectedStorage).createFolder({
      name: newFolderName,
      path: prefix ? `${prefix}${newFolderName}` : newFolderName,
      bucket: selectedBucket,
      storage: selectedStorage,
      type: FolderFileType,
    } as FileInfo);
    await reloadFiles();
    enqueueSnackbar(`Create new folder ${newFolderName} success`, {
      variant: "success",
    });
  }

  async function handleCloneObject(file: FileInfo) {
    const newFileName = getNoneDuplicatedCloneFileName(fileList, file.name);
    const newFilePath = replaceFromEnd(file.path, file.name, newFileName);
    await StorageClientFactory.createClient(selectedStorage).copy(file, {
      ...file,
      name: newFileName,
      path: newFilePath,
    });
    await reloadFiles();
    enqueueSnackbar(`Clone ${newFilePath} success`, {
      variant: "success",
    });
  }

  async function handleRefreshList() {
    await reloadFiles();
    enqueueSnackbar(`Refresh list success`, {
      variant: "success",
    });
  }

  async function handleMoveObject(file: FileInfo, newFile: FileInfo) {
    await StorageClientFactory.createClient(selectedStorage).move(
      file,
      newFile,
    );
    await reloadFiles();
    enqueueSnackbar(`Move ${newFile.name} success`, {
      variant: "success",
    });
  }

  async function handleRenameObject(file: FileInfo, newFile: FileInfo) {
    await StorageClientFactory.createClient(selectedStorage).move(
      file,
      newFile,
    );
    await reloadFiles();
    enqueueSnackbar(`Rename ${newFile.name} success`, {
      variant: "success",
    });
  }

  async function handleHasObject(file: FileInfo) {
    return await StorageClientFactory.createClient(selectedStorage).hasObject(
      file,
    );
  }

  async function handlePasteObject(actionObject: ActionObject) {
    const delimiter =
      actionObject.file.type.fileType === FileFormatType.Folder ? "/" : "";
    const newFilePath = prefix
      ? `${prefix}${actionObject.file.name}${delimiter}`
      : `${actionObject.file.name}${delimiter}`;
    const destinationFile = {
      ...actionObject.file,
      path: newFilePath,
      bucket: selectedBucket,
    };

    const type =
      actionObject.file.type.fileType === FileFormatType.Folder
        ? "file"
        : "folder";
    const title = `${actionObject.action === "cut" ? "Move" : "Copy"} ${type}`;
    const action = `${actionObject.action === "cut" ? "move" : "Copy"}`;
    const exists =
      await StorageClientFactory.createClient(selectedStorage).hasObject(
        destinationFile,
      );
    if (exists) {
      const message =
        actionObject.file.type.fileType === FileFormatType.Folder
          ? `The destination already has a folder named "${actionObject.file.name}", do you want to replace all files in the destination from ${getFileFullPath(actionObject.file)}??`
          : `The destination already has a file named "${actionObject.file.name}", do you want to replace it in the destination from ${getFileFullPath(actionObject.file)}?`;
      const overwrite = await openConfirmAsync({
        body: message,
        title: title,
      });
      if (!overwrite) {
        return false;
      }
    } else {
      const overwrite = await openConfirmAsync({
        body: `Do you want to ${action} ${type} from ${getFileFullPath(actionObject.file)} in the destination?`,
        title: title,
      });
      if (!overwrite) {
        return false;
      }
    }
    if (actionObject.action === "cut") {
      await StorageClientFactory.createClient(selectedStorage).move(
        actionObject.file,
        destinationFile,
      );
    } else {
      await StorageClientFactory.createClient(selectedStorage).copy(
        actionObject.file,
        destinationFile,
      );
    }
    await reloadFiles();
    enqueueSnackbar(`${action} ${destinationFile.name} success`, {
      variant: "success",
    });
    return true;
  }

  async function handleSaveFile(file: FileInfo, content: string) {
    const client = StorageClientFactory.createClient(file.storage);
    await client.uploadString(file, content);
    setTimeout(async () => {
      await reloadFiles();
      await reloadDownloadFile();
    }, 500);
    enqueueSnackbar(`Save ${file.name} success`, {
      variant: "success",
    });
  }

  async function handleUploadObjects(
    localFilePaths: string[],
    parentFile?: FileInfo,
  ) {
    const uploadFileList: UploadInfo[] = [];
    for (const localFilePath of localFilePaths) {
      const isDir = await window.localFile.isDirectory(localFilePath);
      const fileName = getFileName(localFilePath);
      const delimiter = isDir ? StorageClient.defaultDelimiter : "";
      if (!parentFile) {
        const uploadFilePath = prefix
          ? `${prefix}${fileName}${delimiter}`
          : `${fileName}${delimiter}`;
        uploadFileList.push({
          file: {
            storage: selectedStorage,
            bucket: selectedBucket,
            name: fileName,
            path: uploadFilePath,
            type: isDir ? FolderFileType : undefined,
          } as FileInfo,
          localFilePath,
        });
      } else {
        const uploadFilePath = `${parentFile.path}${fileName}${delimiter}`;
        uploadFileList.push({
          file: {
            storage: parentFile.storage,
            bucket: parentFile.bucket,
            name: fileName,
            path: uploadFilePath,
            type: isDir ? FolderFileType : undefined,
          } as FileInfo,
          localFilePath,
        });
      }
    }
    await upload(uploadFileList);
  }

  async function upload(uploadFileList: UploadInfo[]) {
    const client = StorageClientFactory.createClient(selectedStorage);
    const existsRequest = uploadFileList.map(async (m) => {
      const hasObject = await client.hasObject(m.file);
      log.log("hasObject", m.file.path, hasObject);
      return {
        hasObject,
        file: m.file,
      };
    });
    const exists = (await promiseAllInBatches(existsRequest)).filter(
      (m) => m.value.hasObject,
    );
    if (exists.length > 0) {
      const warningMessage =
        exists.length === 1
          ? `The destination already have a file/folder named "${exists[0].value.file.name}", Do you want to replace it?`
          : `The destination already have ${exists.length} files/folders with same names, Do you want to replace it?`;
      const overwrite = await openConfirmAsync({
        body: warningMessage,
      });
      if (!overwrite) {
        return;
      }
    }
    await client.uploadObjects(uploadFileList);
    //it has delay on google cloud after upload
    setTimeout(async () => {
      await reloadFiles();
    }, 500);
  }

  async function handleDownloadFile(file: FileInfo) {
    const localFilePath = await window.dialog.showSaveDialog(file.name);
    if (localFilePath) {
      await StorageClientFactory.createClient(selectedStorage).downloadObject(
        file,
        localFilePath,
      );
    }
  }

  async function handleDownloadFolder(file: FileInfo) {
    const localFilePath = await window.dialog.showSaveDialog(file.name, [
      "createDirectory",
      "showOverwriteConfirmation",
    ]);
    if (localFilePath) {
      await StorageClientFactory.createClient(selectedStorage).downloadObject(
        file,
        localFilePath,
      );
    }
  }

  async function handleDeleteObject(file: FileInfo) {
    await StorageClientFactory.createClient(selectedStorage).delete(file);
    await reloadFiles();
    enqueueSnackbar(`Delete ${file.name} success`, {
      variant: "success",
    });
  }

  async function handleStorageClick(treeItem: TreeItemInfo) {
    setSelectedStorage(treeItem.storage);
    treeItem.buckets = await StorageClientFactory.createClient(
      treeItem.storage,
    ).getBuckets();
  }
  const getMenuList = function () {
    if (!selectedBucket) return [];
    const list: MenuInfo[] = [];
    list.push({ name: selectedStorage.name, link: "" });
    list.push({ name: selectedBucket.name, link: "" });
    let history = "";
    prefix?.split("/").forEach((item) => {
      if (!item) return;
      history += item + "/";
      list.push({ name: item, link: history });
    });
    return list;
  };

  const handleMenuClick = function (menu: MenuInfo) {
    fileListAbort();
    setPrefix(menu.link);
  };
  return (
    <Layout>
      <Header menus={getMenuList()} onMenuClick={handleMenuClick} />
      <BucketListDrawer
        onBucketClick={handleBucketClick}
        onStorageClick={handleStorageClick}
        onCreateBucket={handleCreateBucket}
        onDeleteBucket={handleDeleteBucket}
        jobs={backgroundJobs}
      />

      <Main open={showDrawer}>
        {bucketError && <>{bucketError.message}</>}
        <FileBrowser
          storage={selectedStorage}
          fileList={fileList}
          loading={fileListLoading}
          numberOfLoaded={loadedFileNumber}
          onAbout={handleFileListAbout}
          onFileClick={(file) => {
            setSelectedFile(file);
            if (file.type.fileType === FileFormatType.Folder) {
              fileListAbort();
              setPrefix(file.path);
            } else {
              setShowFileDetail(true);
            }
          }}
          onEditFile={(file) => {
            setSelectedFile(file);
            if (file.type.fileType === FileFormatType.Folder) {
              fileListAbort();
              setPrefix(file.path);
            } else {
              setShowFileDetail(true);
            }
          }}
          onNewFolder={handleNewFolder}
          onDeleteFile={handleDeleteObject}
          onCloneFile={handleCloneObject}
          onRefresh={handleRefreshList}
          onMoveFile={handleMoveObject}
          onRenameFile={handleRenameObject}
          hasObject={handleHasObject}
          onUploadObjects={handleUploadObjects}
          onPasteObject={handlePasteObject}
          onDownloadFile={handleDownloadFile}
          onDownloadFolder={handleDownloadFolder}
        />
        <FilePreview
          file={fileDetail}
          show={showFileDetail}
          loading={fileDetailLoading}
          isDownloading={downloadLoading}
          downloadFile={downloadFile}
          onSave={handleSaveFile}
          onCancel={async () => {
            setShowFileDetail(false);
            setIsDownloadFile(false);
          }}
          onDownload={async (file) => {
            setIsDownloadFile(true);
          }}
        />
      </Main>
    </Layout>
  );
}
