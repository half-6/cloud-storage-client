import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  styled,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import React, { useEffect, useState } from "react";
import { useAlertStore, useSystemStore } from "../store";
import { BucketInfo, JobInfo, StorageInfo } from "#types";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import { StoragePanel } from "./StoragePanel";
import { BucketDialog } from "./BucketDialog";
import { AccountListNav } from "./BucketListNav";
import { JobsPanel } from "./JobsPanel";
import { useSnackbar } from "notistack";
export interface TreeItemInfo {
  storage: StorageInfo;
  buckets: BucketInfo[];
}

export interface BucketListDrawerProps {
  jobs: JobInfo[];
  onBucketClick: (storage: StorageInfo, bucket: BucketInfo) => Promise<void>;
  onStorageClick: (treeNode: TreeItemInfo) => Promise<void>;
  onCreateBucket: (storage: StorageInfo, bucket: BucketInfo) => Promise<void>;
  onDeleteBucket: (storage: StorageInfo, bucket: BucketInfo) => Promise<void>;
}

export const DrawerWidth = 300;

export const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: "space-between",
  boxShadow:
    "0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12);",
}));

export const BucketListDrawer = (props: BucketListDrawerProps) => {
  const {
    showDrawer,
    setShowDrawer,
    localStorage,
    setLocalStorage,
    cloneStorage,
    addStorage,
    deleteStorage,
    updateStorage,
  } = useSystemStore();
  const [treeItems, setTreeItems] = useState<TreeItemInfo[]>();
  const [showStorageDialog, setShowStorageDialog] = useState(false);
  const [showBucketDialog, setShowBucketDialog] = useState(false);
  const [selectedTreeItem, setSelectedTreeItem] = useState<TreeItemInfo>(null);
  const { enqueueSnackbar } = useSnackbar();
  const { openAlertAsync } = useAlertStore();

  const forceUpdate: () => void = React.useState({})[1].bind(null, {});
  const handleBucketClick = async (
    treeItem: TreeItemInfo,
    bucket: BucketInfo,
  ) => {
    setSelectedTreeItem(treeItem);
    await props?.onBucketClick(treeItem.storage, bucket);
  };
  const handleDeleteBucket = async (treeItem, bucket) => {
    await props.onDeleteBucket(treeItem.storage, bucket);
    setTimeout(async () => {
      await handleRefreshBucketList(selectedTreeItem);
      enqueueSnackbar(`Delete bucket ${bucket.name} success`, {
        variant: "success",
      });
    }, 500);
  };

  const handleStorageClick = async (treeItem: TreeItemInfo) => {
    if (!treeItem.buckets) {
      await props?.onStorageClick(treeItem);
      setTreeItems(treeItems);
    }
    setSelectedTreeItem(treeItem);
  };
  const handleRefreshBucketList = async (treeItem: TreeItemInfo) => {
    await props?.onStorageClick(treeItem);
    setTreeItems(treeItems);
    setSelectedTreeItem(treeItem);
    forceUpdate();
  };

  const handleDrawerClose = () => {
    setShowDrawer(false);
  };

  const handleNewAccountMenu = async () => {
    setSelectedTreeItem(null);
    setShowStorageDialog(true);
  };
  const handleNewBucketMenu = async () => {
    setShowBucketDialog(true);
  };
  const handleNewBucket = async (bucket: BucketInfo) => {
    const exist = selectedTreeItem.buckets.find((f) => f.name === bucket.name);
    if (exist) {
      await openAlertAsync({
        body: `There is already a bucket with the same name in this account`,
      });
    } else {
      await props.onCreateBucket(selectedTreeItem.storage, bucket);
      setShowBucketDialog(false);
      await handleRefreshBucketList(selectedTreeItem);
      enqueueSnackbar(`Create bucket ${bucket.name} success`, {
        variant: "success",
      });
    }
  };
  useEffect(() => {
    setTreeItems(
      localStorage?.Storages?.map((storage) => {
        return {
          storage,
        } as TreeItemInfo;
      }) as TreeItemInfo[],
    );
    if (localStorage?.Storages?.length === 0) {
      setShowStorageDialog(true);
    }
  }, [localStorage, localStorage?.Storages]);
  return (
    <Drawer
      open={showDrawer}
      sx={{
        width: DrawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DrawerWidth,
          boxSizing: "border-box",
          overflowY: "hidden",
        },
      }}
      variant="persistent"
      anchor="left"
    >
      <DrawerHeader>
        <Button
          variant="text"
          color="inherit"
          onClick={handleNewAccountMenu}
          startIcon={<AddCircleOutlineOutlinedIcon />}
        >
          New
        </Button>
        <IconButton onClick={handleDrawerClose}>
          <ChevronLeftIcon />
        </IconButton>
      </DrawerHeader>
      <Divider />
      <Box
        sx={{
          overflowY: "auto",
        }}
      >
        <AccountListNav
          treeItems={treeItems}
          onStorageClick={handleStorageClick}
          onBucketClick={handleBucketClick}
          onRefreshBucketList={handleRefreshBucketList}
          onDeleteBucket={handleDeleteBucket}
          onNewBucket={async (treeItem) => {
            setSelectedTreeItem(treeItem);
            await handleNewBucketMenu();
          }}
        />
        <Divider />
        <JobsPanel />
      </Box>

      <BucketDialog
        bucket={null}
        storage={selectedTreeItem?.storage}
        show={showBucketDialog}
        onSave={handleNewBucket}
        onCancel={async () => {
          setShowBucketDialog(false);
        }}
      />
      <StoragePanel
        open={showStorageDialog}
        storage={null}
        onSave={(storage) => {
          setShowStorageDialog(false);
          addStorage(storage);
        }}
        onClose={() => {
          setShowStorageDialog(false);
        }}
      />
    </Drawer>
  );
};
