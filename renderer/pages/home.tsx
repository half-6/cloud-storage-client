"use client";
import React, { useState } from "react";
import { Box, Button, styled } from "@mui/material";
import {
  StorageClientFactory,
  getNoneDuplicatedCloneFileName,
  getNoneDuplicatedFileName,
  useSWRAbort,
} from "../lib";
import {
  AWSS3StorageInfo,
  BucketInfo,
  FileDetailInfo,
  FileInfo,
  FolderFileType,
  JobInfo,
  JobProgressInfo,
  JobStatusInfo,
  JobTypeInfo,
  StorageInfo,
} from "../types";
import {
  Alert,
  BucketListDrawer,
  DrawerWidth,
  FileBrowser,
  FilePreview,
  Header,
  Layout,
  MenuInfo,
  ToastMessage,
  TreeItemInfo,
} from "../components";
import { useJobStore, useSystemStore, useToastStore } from "../store";
import useSWR from "swr";
import { SnackbarProvider, enqueueSnackbar, useSnackbar } from "notistack";
import { v4 } from "uuid";

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })<{
  open?: boolean;
}>(({ theme }) => ({
  width: `calc(100% - ${DrawerWidth}px)`,
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
      },
    },
  ],
}));

export default function HomePage() {
  const { showDrawer } = useSystemStore();
  const { downloadFile: downloadFileJob, jobs, setJobs } = useJobStore();
  const [selectedStorage, setSelectedStorage] = useState<StorageInfo>();
  const [selectedBucket, setSelectedBucket] = useState<BucketInfo>();
  const [prefix, setPrefix] = useState<string>(null);
  const [selectedFile, setSelectedFile] = useState<FileInfo>();

  const { enqueueSnackbar } = useSnackbar();

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

  const fileListAborter = () => {
    fileListAbort();
    enqueueSnackbar("The request has been aborted", { variant: "info" });
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
      const output = await StorageClientFactory.createClient(
        selectedStorage,
      ).getFiles(selectedBucket, px, signal, (progress) => {
        setLoadedFileNumber(progress);
      });
      setLoadedFileNumber(0);
      return output;
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

  async function handleUploadFile(file: File) {
    const fileName = getNoneDuplicatedFileName(fileList, file.name);
    const uploadFilePath = prefix ? `${prefix}${fileName}` : fileName;
    const newJob = {
      id: v4().toString(),
      name: file.name,
      status: JobStatusInfo.loading,
      progress: {
        loaded: 0,
        total: file.size,
        percentage: 0,
      } as JobProgressInfo,
      createdTime: new Date(),
      type: JobTypeInfo.download,
    } as JobInfo;
    jobs.push(newJob);
    setJobs(jobs);
    await StorageClientFactory.createClient(selectedStorage).uploadFile(
      selectedBucket,
      uploadFilePath,
      file,
      (progress) => {
        const existJob = jobs.find((job) => job.id === newJob.id);
        if (existJob) {
          existJob.progress.percentage = progress.percentage;
          existJob.progress.loaded = progress.loaded;
          existJob.progress.total = progress.total;
          setJobs(jobs);
        }
      },
    );
    await reloadFiles();
    const existJob = jobs.find((job) => job.id === file.path);
    if (existJob) {
      existJob.progress.percentage = 100;
      existJob.status = JobStatusInfo.completed;
      setJobs(jobs);
      enqueueSnackbar(`Upload ${file.name} success`, {
        variant: "success",
      });
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
    fileListAborter();
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
          onAbout={fileListAborter}
          onFileClick={(file) => {
            setSelectedFile(file);
            if (file.type === FolderFileType) {
              fileListAborter();
              setPrefix(file.path);
            } else {
              setShowFileDetail(true);
            }
          }}
          onEditFile={(file) => {
            setSelectedFile(file);
            if (file.type === FolderFileType) {
              fileListAborter();
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
          onDownloadFile={async (file: FileInfo) => {
            downloadFileJob(file);
          }}
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
