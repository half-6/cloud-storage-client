import React, { useState } from "react";
import { styled } from "@mui/material";
import {
  getFileName,
  getNoneDuplicatedCloneFileName,
  useSWRAbort,
} from "../lib";
import { StorageClientFactory } from "#storageClient";
import {
  BucketInfo,
  FileFormatType,
  FileInfo,
  FolderFileType,
  JobInfo,
  JobProgressInfo,
  JobStatusInfo,
  JobTypeInfo,
  StorageInfo,
  UnknownFileType,
} from "#types";
import {
  BucketListDrawer,
  DrawerWidth,
  FileBrowser,
  FilePreview,
  Header,
  Layout,
  MenuInfo,
  TreeItemInfo,
} from "../components";
import { useAlertStore, useJobStore, useSystemStore } from "../store";
import useSWR from "swr";
import { useSnackbar } from "notistack";
import { v4 } from "uuid";

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
  const { openConfirmAsync } = useAlertStore();

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
    selectedFile?.path && selectedFile.type != FolderFileType && showFileDetail
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
    error: downloadFileError,
  } = useSWR(
    selectedFile?.path &&
      selectedFile.type != FolderFileType &&
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
    const newFile = await StorageClientFactory.createClient(
      selectedStorage,
    ).cloneObject(file, prefix ? `${prefix}${newFileName}` : newFileName);
    await reloadFiles();
    enqueueSnackbar(`Clone ${newFile.path} success`, {
      variant: "success",
    });
  }

  async function handleRefreshList() {
    await reloadFiles();
    enqueueSnackbar(`Refresh list success`, {
      variant: "success",
    });
  }

  async function handleRenameObject(file, newFileName) {
    await StorageClientFactory.createClient(selectedStorage).renameObject(
      file,
      newFileName,
    );
    await reloadFiles();
    enqueueSnackbar(`Rename ${newFileName} success`, {
      variant: "success",
    });
  }

  async function handleUploadFolder() {
    const filePaths = await window.dialog.showOpenDialog("", ["openDirectory"]);
    if (!filePaths) return;
    const filePath = filePaths[0];
    const fileName = getFileName(filePath);
    const uploadFilePath = prefix ? `${prefix}${fileName}/` : `${fileName}/`;
    const client = StorageClientFactory.createClient(selectedStorage);
    const exists = await client.hasObject({
      storage: selectedStorage,
      bucket: selectedBucket,
      name: fileName,
      path: uploadFilePath,
    } as FileInfo);
    if (exists) {
      const overwrite = await openConfirmAsync({
        body: `The destination already have a folder named ${fileName}, Do you want to replace it?`,
      });
      if (!overwrite) {
        return;
      }
    }
    await client.uploadFile(
      {
        storage: selectedStorage,
        bucket: selectedBucket,
        path: uploadFilePath,
        name: fileName,
        type: FolderFileType,
      } as FileInfo,
      filePath,
    );
    //it has delay on google cloud after upload
    setTimeout(async () => {
      await reloadFiles();
    }, 500);
  }

  async function handleUploadFile() {
    const filePaths = await window.dialog.showOpenDialog("", ["openFile"]);
    if (!filePaths) return;
    const filePath = filePaths[0];
    const fileName = getFileName(filePath);
    const uploadFilePath = prefix ? `${prefix}${fileName}` : fileName;
    const client = StorageClientFactory.createClient(selectedStorage);
    const exists = await client.hasObject({
      storage: selectedStorage,
      bucket: selectedBucket,
      name: fileName,
      path: uploadFilePath,
    } as FileInfo);
    if (exists) {
      const overwrite = await openConfirmAsync({
        body: `The destination already have a file named ${fileName}, Do you want to replace it?`,
      });
      if (!overwrite) {
        return;
      }
    }
    await client.uploadFile(
      {
        storage: selectedStorage,
        bucket: selectedBucket,
        path: uploadFilePath,
        name: fileName,
        type: UnknownFileType,
      } as FileInfo,
      filePath,
    );
    //it has delay on google cloud after upload
    setTimeout(async () => {
      await reloadFiles();
    }, 500);
  }

  async function handleDownloadFile(file: FileInfo) {
    const localFilePath = await window.dialog.showSaveDialog(file.name);
    if (localFilePath) {
      await StorageClientFactory.createClient(
        selectedStorage,
      ).downloadFileInChunks(file, localFilePath);
    }
  }

  async function handleDownloadFolder(file: FileInfo) {
    const localFilePath = await window.dialog.showSaveDialog(file.name, [
      "createDirectory",
      "showOverwriteConfirmation",
    ]);
    if (localFilePath) {
      await StorageClientFactory.createClient(
        selectedStorage,
      ).downloadFileInChunks(file, localFilePath);
    }
  }

  async function handleDeleteObject(file: FileInfo) {
    await StorageClientFactory.createClient(selectedStorage).deleteObject(file);
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
          onRenameFile={handleRenameObject}
          onUploadFile={handleUploadFile}
          onUploadFolder={handleUploadFolder}
          onDownloadFile={handleDownloadFile}
          onDownloadFolder={handleDownloadFolder}
        />
        <FilePreview
          file={fileDetail}
          show={showFileDetail}
          loading={fileDetailLoading}
          isDownloading={downloadLoading}
          downloadFile={downloadFile}
          onSave={async () => {
            setShowFileDetail(false);
            setIsDownloadFile(false);
          }}
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
