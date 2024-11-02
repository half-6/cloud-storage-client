import React, { useState } from "react";
import Head from "next/head";
import { Box, Button, styled } from "@mui/material";
import {
  cloneObject,
  convertFileToBuffer,
  createBucket,
  createFile,
  createFolder,
  deleteBucket,
  deleteObject,
  downloadFileToStream,
  downloadObject,
  getAllBuckets,
  getAllFiles,
  getFileDetail,
  getNoneDuplicatedCloneFileName,
  getNoneDuplicatedFileName,
  getPercentage,
  renameObject,
  uploadFile,
  useSWRAbort,
} from "../lib";
import {
  AWSS3StorageInfo,
  BucketInfo,
  FileDetailInfo,
  FileInfo,
  FolderFileType,
  JobInfo,
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
  const { downloadFile: downloadFileJob, jobs, setJobs } = useJobStore();
  const [bucketName, setBucketName] = useState<string>("");
  const [prefix, setPrefix] = useState<string>(null);
  const { showDrawer } = useSystemStore();
  const { showToastMessage } = useToastStore();
  const [loadedFileNumber, setLoadedFileNumber] = useState(0);
  const [showFileDetail, setShowFileDetail] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<FileInfo>();
  const [isDownloadFile, setIsDownloadFile] = useState<boolean>(false);
  const [backgroundJobs, setBackgroundJobs] = useState<JobInfo[]>();
  const {
    data: fileList,
    isLoading: fileListLoading,
    isValidating: fileListValidating,
    error: bucketError,
    mutate: reloadFiles,
    abort: fileListAbort,
  } = useSWRAbort([bucketName, prefix], getFilesFromStorage, {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  const {
    data: fileDetail,
    isLoading: fileDetailLoading,
    error: fileDetailError,
    abort: fileDetailAbort,
  } = useSWRAbort(
    selectedFile?.path && selectedFile.type != FolderFileType && showFileDetail
      ? [selectedFile?.path, showFileDetail.toString()]
      : null,
    async (signal, params) => {
      return await getFileDetail(
        selectedStorage as AWSS3StorageInfo,
        selectedFile,
        bucketName,
      );
    },
  );
  const {
    data: downloadFile,
    isLoading: downloadLoading,
    error: downloadFileError,
    abort: downloadFileAbort,
  } = useSWRAbort(
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
    async (signal, params) => {
      return await downloadObject(
        selectedStorage as AWSS3StorageInfo,
        bucketName,
        selectedFile,
      );
    },
  );

  const [selectedStorage, setSelectedStorage] = useState<StorageInfo>();

  const fileListAborter = () => {
    fileListAbort();
    showToastMessage({ message: "The request has been aborted" });
  };

  async function getFilesFromStorage(signal, params) {
    const name = params[0];
    const px = params[1];
    setLoadedFileNumber(0);
    if (name) {
      const command = {
        Bucket: name,
        Prefix: px,
      };
      const output = await getAllFiles(
        selectedStorage as AWSS3StorageInfo,
        command,
        signal,
        (progress) => {
          setLoadedFileNumber(progress);
        },
      );
      setLoadedFileNumber(0);
      showToastMessage({ message: "Load file list completed" });
      return output;
    }
    return null;
  }
  async function handleBucketClick(storage: StorageInfo, bucket: BucketInfo) {
    setSelectedStorage(storage);
    setBucketName(bucket.name);
    setPrefix(null);
  }

  async function handleCreateBucket(storage: StorageInfo, bucket: BucketInfo) {
    await createBucket(storage as AWSS3StorageInfo, bucket);
  }

  async function handleDeleteBucket(storage: StorageInfo, bucket: BucketInfo) {
    await deleteBucket(storage as AWSS3StorageInfo, bucket);
  }

  async function handleStorageClick(treeItem: TreeItemInfo) {
    setSelectedStorage(treeItem.storage);
    treeItem.buckets = await getAllBuckets(
      treeItem.storage as AWSS3StorageInfo,
    );
  }
  const getMenuList = function () {
    if (!bucketName) return [];
    const list: MenuInfo[] = [];
    list.push({ name: selectedStorage.name, link: "" });
    list.push({ name: bucketName, link: "" });
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
          // onNewFile={async (file) => {
          //   await createFile(
          //     selectedStorage as AWSS3StorageInfo,
          //     {
          //       name: "new Folder",
          //       path: "test.txt",
          //       body: "DDDDDDDDD",
          //       contentType: "plain/text",
          //     } as FileDetailInfo,
          //     bucketName,
          //   );
          //   await reloadFiles();
          // }}
          onNewFolder={async (newFolderName) => {
            await createFolder(
              selectedStorage as AWSS3StorageInfo,
              {
                name: newFolderName,
                path: prefix ? `${prefix}${newFolderName}` : newFolderName,
              } as FileInfo,
              bucketName,
            );
            await reloadFiles();
            showToastMessage({
              message: `Create new folder ${newFolderName} completed`,
            });
          }}
          onDeleteFile={async (file) => {
            await deleteObject(
              selectedStorage as AWSS3StorageInfo,
              bucketName,
              file,
            );
            await reloadFiles();
            showToastMessage({
              message: `Delete ${file.path} completed`,
            });
          }}
          onCloneFile={async (file) => {
            const newFileName = getNoneDuplicatedCloneFileName(
              fileList,
              file.name,
            );
            const newKey = await cloneObject(
              selectedStorage as AWSS3StorageInfo,
              bucketName,
              file,
              prefix ? `${prefix}${newFileName}` : newFileName,
            );
            await reloadFiles();
            showToastMessage({
              message: `Clone ${newKey} completed`,
            });
          }}
          onRefresh={async () => {
            await reloadFiles();
          }}
          onRenameFile={async (file, newFileName) => {
            await renameObject(
              selectedStorage as AWSS3StorageInfo,
              bucketName,
              file,
              newFileName,
            );
            showToastMessage({
              message: `Rename ${newFileName} completed`,
            });
          }}
          onUploadFile={async (file: File) => {
            //const buffer = await convertFileToBuffer(file);
            const fileName = getNoneDuplicatedFileName(fileList, file.name);
            const uploadFilePath = prefix ? `${prefix}${fileName}` : fileName;
            await uploadFile(
              selectedStorage as AWSS3StorageInfo,
              bucketName,
              uploadFilePath,
              file,
              (progress) => {
                const currentProgress = getPercentage(
                  progress.loaded,
                  progress.total,
                );
                const existJob = jobs.find((job) => job.id === file.path);
                if (existJob) {
                  existJob.progress = currentProgress;
                  setJobs(jobs);
                } else {
                  jobs.push({
                    id: file.path,
                    name: file.name,
                    progress: currentProgress,
                    createdTime: new Date(),
                    status: JobStatusInfo.loading,
                    type: JobTypeInfo.upload,
                  } as JobInfo);
                  setJobs(jobs);
                }
              },
            );
            await reloadFiles();
            const existJob = jobs.find((job) => job.id === file.path);
            if (existJob) {
              existJob.progress = 100;
              existJob.status = JobStatusInfo.completed;
              setJobs(jobs);
              useToastStore.getState().showToastMessage({
                message: `Upload ${file.name} to S3 success`,
              });
            }
          }}
          onDownloadFile={async (file: FileInfo) => {
            downloadFileJob(
              selectedStorage as AWSS3StorageInfo,
              bucketName,
              file,
            );
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
