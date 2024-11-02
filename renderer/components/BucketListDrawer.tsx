import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Paper,
  styled,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import React, { useEffect, useState } from "react";
import { useAlertStore, useSystemStore } from "../store";
import { AWSS3StorageInfo, BucketInfo, JobInfo, StorageInfo } from "../types";
import { SimpleTreeView, TreeItem2 } from "@mui/x-tree-view";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FileCopyOutlinedIcon from "@mui/icons-material/FileCopyOutlined";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import CreateNewFolderOutlinedIcon from "@mui/icons-material/CreateNewFolderOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { AWSS3StoragePanel } from "./AWSS3StoragePanel";
import { IconLabel } from "./IconLabel";
import { AWSS3BucketDialog } from "./AWSS3BucketDialog";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { AccountListNav, BucketListNav } from "./BucketListNav";
import { JobsPanel } from "./JobsPanel";
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
  const [selectedBucket, setSelectedBucket] = useState<BucketInfo>(null);

  const [newMenuAnchorEl, setNewMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);
  const openNewMenu = Boolean(newMenuAnchorEl);

  const forceUpdate: () => void = React.useState({})[1].bind(null, {});
  const handleBucketClick = async (
    treeItem: TreeItemInfo,
    bucket: BucketInfo,
  ) => {
    setSelectedTreeItem(treeItem);
    setSelectedBucket(bucket);
    await props?.onBucketClick(treeItem.storage, bucket);
  };
  const handleStorageClick = async (treeItem: TreeItemInfo) => {
    if (!treeItem.buckets) {
      await props?.onStorageClick(treeItem);
      forceUpdate();
    }
    setSelectedTreeItem(treeItem);
  };

  const handleDrawerClose = () => {
    setShowDrawer(false);
  };

  const handleCloseNewMenu = () => {
    setNewMenuAnchorEl(null);
  };

  const handleNewAccountMenu = async () => {
    setSelectedTreeItem(null);
    setNewMenuAnchorEl(null);
    setShowStorageDialog(true);
  };
  const handleNewBucketMenu = async () => {
    setNewMenuAnchorEl(null);
    setSelectedBucket(null);
    setShowBucketDialog(true);
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
          onClick={(event) => {
            setNewMenuAnchorEl(event.currentTarget);
          }}
          startIcon={<AddCircleOutlineOutlinedIcon />}
        >
          New
        </Button>
        <IconButton onClick={handleDrawerClose}>
          <ChevronLeftIcon />
        </IconButton>
      </DrawerHeader>
      <Divider />
      <AccountListNav
        treeItems={treeItems}
        onStorageClick={handleStorageClick}
        onBucketClick={handleBucketClick}
        onRefreshBucketList={handleStorageClick}
        onDeleteBucket={async (treeItem, bucket) => {
          await props.onDeleteBucket(treeItem.storage, bucket);
        }}
        onNewBucket={async (treeItem) => {
          setSelectedTreeItem(treeItem);
          await handleNewBucketMenu();
        }}
      />
      <Divider />
      <JobsPanel />

      <AWSS3BucketDialog
        bucket={null}
        show={showBucketDialog}
        onSave={async (bucket: BucketInfo) => {
          await props.onCreateBucket(selectedTreeItem.storage, bucket);
          setShowBucketDialog(false);
        }}
        onCancel={async () => {
          setShowBucketDialog(false);
        }}
      />
      <AWSS3StoragePanel
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
      <Menu
        id="new-menu"
        anchorEl={newMenuAnchorEl}
        open={openNewMenu}
        onClose={handleCloseNewMenu}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        <MenuItem onClick={handleNewAccountMenu}>
          <ListItemIcon>
            <CloudOutlinedIcon />
          </ListItemIcon>
          <ListItemText>New Account</ListItemText>
        </MenuItem>
        {selectedTreeItem && (
          <MenuItem onClick={handleNewBucketMenu}>
            <ListItemIcon>
              <CreateNewFolderOutlinedIcon />
            </ListItemIcon>
            <ListItemText>New Bucket</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Drawer>
  );
};
