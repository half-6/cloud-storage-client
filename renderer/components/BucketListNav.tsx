import { AWSS3StorageInfo, BucketInfo, StorageInfo } from "#types";
import { MouseEvent } from "react";
import {
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { TreeItemInfo } from "./BucketListDrawer";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import FileCopyOutlinedIcon from "@mui/icons-material/FileCopyOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import { AWSS3BucketDialog } from "./AWSS3BucketDialog";
import { StoragePanel } from "./StoragePanel";
import { useAlertStore, useSystemStore } from "../store";
import CreateNewFolderOutlinedIcon from "@mui/icons-material/CreateNewFolderOutlined";

interface AccountListNavProps {
  treeItems: TreeItemInfo[];
  onStorageClick: (treeItem: TreeItemInfo) => Promise<void>;
  onBucketClick: (treeItem: TreeItemInfo, bucket: BucketInfo) => Promise<void>;
  onRefreshBucketList: (treeItem: TreeItemInfo) => Promise<void>;
  onDeleteBucket: (treeItem: TreeItemInfo, bucket: BucketInfo) => Promise<void>;
  onNewBucket: (treeItem: TreeItemInfo) => Promise<void>;
}
interface BucketListNavProps {
  treeItem: TreeItemInfo;
  selectedListIndex: string;
  onStorageClick: (treeItem: TreeItemInfo) => Promise<void>;
  onBucketClick: (treeItem: TreeItemInfo, bucket: BucketInfo) => Promise<void>;
  onStorageActions: (
    event: MouseEvent,
    treeItem: TreeItemInfo,
  ) => Promise<void>;
  onBucketActions: (
    event: MouseEvent,
    treeItem: TreeItemInfo,
    bucket: BucketInfo,
  ) => Promise<void>;
}

const LoadingIcon = () => {
  return <CircularProgress size="16px" />;
};

export const BucketListNav = (props: BucketListNavProps) => {
  const [openStorageMenu, setOpenStorageMenu] = useState<boolean>(false);

  const handleOnStorageClick = async (treeItem: TreeItemInfo) => {
    setOpenStorageMenu(!openStorageMenu);
    await props.onStorageClick?.(treeItem);
  };
  const handleOnBucketClick = async (
    treeItem: TreeItemInfo,
    bucket: BucketInfo,
  ) => {
    await props.onBucketClick?.(treeItem, bucket);
  };

  if (props.treeItem.storage) {
    return (
      <>
        <ListItemButton
          key={props.treeItem.storage.id}
          selected={props.treeItem.storage.id === props.selectedListIndex}
          onClick={async (event) => {
            event.preventDefault();
            await handleOnStorageClick(props.treeItem);
          }}
          //sx={{ padding: "0 10px" }}
        >
          <ListItemIcon sx={{ minWidth: "auto", paddingRight: "10px" }}>
            <CloudOutlinedIcon />
          </ListItemIcon>
          <ListItemText
            primary={props.treeItem.storage.name}
            sx={{ textWrap: "nowrap" }}
            primaryTypographyProps={{
              sx: {
                textWrap: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
              },
            }}
          />
          <IconButton
            sx={{ minWidth: "auto", paddingRight: "5px" }}
            onClick={async (event) => {
              event.stopPropagation();
              await props.onStorageActions(event, props.treeItem);
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <IconButton>
            {openStorageMenu ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </ListItemButton>
        <Collapse in={openStorageMenu} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {props.treeItem.buckets &&
              props.treeItem.buckets.map((bucket, index) => (
                <ListItemButton
                  key={props.treeItem.storage.id + "_" + bucket.name}
                  selected={
                    props.treeItem.storage.id + "_" + bucket.name ===
                    props.selectedListIndex
                  }
                  sx={{ padding: "3px 10px 3px 50px" }}
                  onClick={async (event) => {
                    event.stopPropagation();
                    await handleOnBucketClick(props.treeItem, bucket);
                  }}
                >
                  <ListItemText
                    primary={bucket.name}
                    primaryTypographyProps={{
                      fontSize: 14,
                      sx: {
                        textWrap: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                      },
                    }}
                  />
                  <IconButton
                    onClick={async (event) => {
                      event.stopPropagation();
                      await props.onBucketActions(
                        event,
                        props.treeItem,
                        bucket,
                      );
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </ListItemButton>
              ))}
            {!props.treeItem.buckets && (
              <ListItemButton sx={{ padding: "3px 10px 3px 50px" }}>
                <ListItemIcon sx={{ minWidth: "auto", paddingRight: "10px" }}>
                  <LoadingIcon />
                </ListItemIcon>
                <ListItemText
                  primary={"Loading ..."}
                  primaryTypographyProps={{
                    fontSize: 14,
                  }}
                />
              </ListItemButton>
            )}
          </List>
        </Collapse>
      </>
    );
  }
  return <></>;
};

export const AccountListNav = (props: AccountListNavProps) => {
  const { deleteStorage, updateStorage } = useSystemStore();
  const [selectedListIndex, setSelectedListIndex] = useState<string>(null);
  const [showStorageDialog, setShowStorageDialog] = useState(false);

  const [selectedStorageMenu, setSelectedStorageMenu] =
    useState<TreeItemInfo>();
  const [selectedBucketMenu, setSelectedBucketMenu] = useState<BucketInfo>();

  const { openConfirmAsync } = useAlertStore();
  const [accountMenuAnchorEl, setAccountMenuAnchorEl] =
    React.useState<null | Element>(null);
  const openAccountMenu = Boolean(accountMenuAnchorEl);
  const [bucketMenuAnchorEl, setBucketMenuAnchorEl] =
    React.useState<null | Element>(null);
  const openBucketMenu = Boolean(bucketMenuAnchorEl);

  const handleOnStorageClick = async (treeItem: TreeItemInfo) => {
    //setSelectedListIndex(treeItem.storage.id);
    await props.onStorageClick?.(treeItem);
  };
  const handleOnBucketClick = async (
    treeItem: TreeItemInfo,
    bucket: BucketInfo,
  ) => {
    setSelectedListIndex(treeItem.storage.id + "_" + bucket.name);
    await props.onBucketClick?.(treeItem, bucket);
  };
  const handleCloseMenu = () => {
    setAccountMenuAnchorEl(null);
    setBucketMenuAnchorEl(null);
  };
  const handleEditAccountMenu = () => {
    setShowStorageDialog(true);
    handleCloseMenu();
  };
  const handleRefreshAccountMenu = async () => {
    handleCloseMenu();
    await props.onRefreshBucketList(selectedStorageMenu);
  };
  const handleDeleteAccountMenu = async () => {
    handleCloseMenu();
    const res = await openConfirmAsync({
      body: `Are you sure you want to delete '${selectedStorageMenu.storage.name}'?`,
    });
    if (res) {
      deleteStorage(selectedStorageMenu.storage);
    }
  };

  const handleNewBucketMenu = async () => {
    handleCloseMenu();
    await props.onNewBucket(selectedStorageMenu);
  };
  const handleDeleteBucketMenu = async () => {
    handleCloseMenu();
    const res = await openConfirmAsync({
      body: `Are you sure you want to delete '${selectedBucketMenu.name}'?`,
    });
    if (res) {
      await props.onDeleteBucket(selectedStorageMenu, selectedBucketMenu);
    }
  };

  return (
    <>
      <List
        sx={{
          width: "100%",
          maxWidth: 360,
          bgcolor: "background.paper",
          overflowY: "auto",
        }}
        component="nav"
        subheader={
          <ListSubheader component="div">CLOUD STORAGES</ListSubheader>
        }
      >
        {props.treeItems?.map((treeItem, index) => (
          <BucketListNav
            key={index}
            selectedListIndex={selectedListIndex}
            treeItem={treeItem}
            onStorageClick={handleOnStorageClick}
            onBucketClick={handleOnBucketClick}
            onStorageActions={async (event, item) => {
              setSelectedStorageMenu(item);
              setAccountMenuAnchorEl(event.currentTarget);
            }}
            onBucketActions={async (event, item, bucket) => {
              setSelectedStorageMenu(item);
              setSelectedBucketMenu(bucket);
              setBucketMenuAnchorEl(event.currentTarget);
            }}
          />
        ))}
      </List>
      <Menu
        id="account-menu"
        anchorEl={accountMenuAnchorEl}
        open={openAccountMenu}
        onClose={handleCloseMenu}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={handleEditAccountMenu}>
          <ListItemIcon>
            <EditOutlinedIcon />
          </ListItemIcon>
          <ListItemText>Edit Account</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteAccountMenu}>
          <ListItemIcon>
            <DeleteOutlinedIcon />
          </ListItemIcon>
          <ListItemText>Delete Account</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleRefreshAccountMenu}>
          <ListItemIcon>
            <RefreshOutlinedIcon />
          </ListItemIcon>
          <ListItemText>Refresh</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleNewBucketMenu}>
          <ListItemIcon>
            <CreateNewFolderOutlinedIcon />
          </ListItemIcon>
          <ListItemText>New Bucket</ListItemText>
        </MenuItem>
      </Menu>
      <Menu
        id="bucket-menu"
        anchorEl={bucketMenuAnchorEl}
        open={openBucketMenu}
        onClose={handleCloseMenu}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={handleDeleteBucketMenu}>
          <ListItemIcon>
            <DeleteOutlinedIcon />
          </ListItemIcon>
          <ListItemText>Delete Bucket</ListItemText>
        </MenuItem>
      </Menu>
      <StoragePanel
        open={showStorageDialog}
        storage={selectedStorageMenu?.storage as AWSS3StorageInfo}
        onSave={(storage) => {
          setShowStorageDialog(false);
          updateStorage(storage);
        }}
        onClose={() => {
          setShowStorageDialog(false);
        }}
      />
    </>
  );
};
