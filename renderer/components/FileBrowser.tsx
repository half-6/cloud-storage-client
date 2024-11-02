import { FileInfo, FolderFileType, StorageInfo } from "../types";
import {
  DataGrid,
  GridActionsCellItem,
  GridCellModes,
  GridColDef,
  GridLoadingOverlayProps,
  GridRowModes,
  GridSlotsComponentsProps,
  GridToolbar,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarProps,
  GridToolbarQuickFilter,
  useGridApiContext,
  useGridApiRef,
} from "@mui/x-data-grid";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Tooltip,
  Typography,
  styled,
} from "@mui/material";
import OpenIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import React, { useMemo, useRef, useState } from "react";
import { convertFileToBuffer, formatFileSize, getFileName } from "../lib";
import { IconLabel } from "./IconLabel";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import FileCopyOutlinedIcon from "@mui/icons-material/FileCopyOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import { useAlertStore } from "../store";
import BlockIcon from "@mui/icons-material/Block";
import AddIcon from "@mui/icons-material/Add";
import FolderIcon from "@mui/icons-material/Folder";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import { FileRename } from "./FileRename";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import { NewFolderDialog } from "./NewFolderDialog";

interface CustomGridToolbarProps extends GridToolbarProps {
  onAbout: () => void;
  onRefresh: () => void;
  onNewFolder: () => void;
  onNewFile: () => void;
  onUploadFile: (file: File) => Promise<void>;
  fileList: FileInfo[];
}
//NonNullable<GridSlotsComponentsProps["toolbar"]>
function CustomDataGridToolbar(props: CustomGridToolbarProps) {
  const [newMenuAnchorEl, setNewMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);

  const openMenu = Boolean(newMenuAnchorEl);
  const fileInputRef = useRef(null);

  const handleCloseMenu = () => {
    setNewMenuAnchorEl(null);
  };
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setNewMenuAnchorEl(event.currentTarget);
  };
  const handleNewFolder = () => {
    props.onNewFolder();
    handleCloseMenu();
  };
  const handleNewFile = () => {
    props.onNewFile();
    handleCloseMenu();
  };
  const handleUploadFile = (event) => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files[0];
    props.onUploadFile(file);
    handleCloseMenu();
  };
  return (
    <GridToolbarContainer
      sx={{
        display: "flex",
        justifyContent: "space-between",
        padding: "20px 10px",
      }}
    >
      <GridToolbarQuickFilter size="small" />
      <Box sx={{ display: "flex", gap: "10px" }}>
        <Button
          size="small"
          onClick={handleClick}
          startIcon={<AddIcon />}
          // endIcon={<KeyboardArrowDownIcon />}
          disabled={!props.fileList}
        >
          New
        </Button>
        <Tooltip title="Refresh files">
          <Button
            size="small"
            onClick={props.onRefresh}
            startIcon={<RefreshOutlinedIcon />}
            disabled={!props.fileList}
          >
            Refresh
          </Button>
        </Tooltip>
        <Tooltip title="Cancel requests">
          <Button
            size="small"
            onClick={props.onAbout}
            startIcon={<BlockIcon />}
          >
            Cancel
          </Button>
        </Tooltip>
        <GridToolbarExport disabled={!props.fileList} />
      </Box>
      <Menu
        id="new-menu"
        anchorEl={newMenuAnchorEl}
        open={openMenu}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        <MenuItem onClick={handleNewFolder}>
          <ListItemIcon>
            <FolderOutlinedIcon />
          </ListItemIcon>
          <ListItemText>New Folder</ListItemText>
        </MenuItem>
        {/*<MenuItem onClick={handleNewFile}>*/}
        {/*  <ListItemIcon>*/}
        {/*    <InsertDriveFileOutlinedIcon />*/}
        {/*  </ListItemIcon>*/}
        {/*  <ListItemText>New Text File</ListItemText>*/}
        {/*</MenuItem>*/}
        <MenuItem onClick={handleUploadFile}>
          <ListItemIcon>
            <UploadFileIcon />
          </ListItemIcon>
          <ListItemText>Upload File</ListItemText>
          <input
            type="file"
            ref={fileInputRef}
            hidden
            onChange={handleFileSelect}
          />
        </MenuItem>
      </Menu>
    </GridToolbarContainer>
  );
}

export interface FileBrowserProps {
  storage: StorageInfo;
  fileList: FileInfo[];
  loading: boolean;
  numberOfLoaded: number;
  onFileClick: (file: FileInfo) => void;
  onNewFolder: (newFolderName: string) => void;
  onEditFile: (file: FileInfo) => void;
  onDeleteFile: (file: FileInfo) => void;
  onCloneFile: (file: FileInfo) => void;
  onRenameFile: (file: FileInfo, newFileName: string) => Promise<void>;
  onRefresh: () => void;
  onAbout: () => void;
  onUploadFile: (file: File) => Promise<void>;
  onDownloadFile: (file: FileInfo) => Promise<void>;
}

declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides {
    onAbout: () => void;
    onRefresh: () => void;
    onNewFolder: () => void;
    onNewFile: () => void;
    onUploadFile: (file: File) => Promise<void>;
    fileList: FileInfo[];
  }
  interface LoadingOverlayPropsOverrides {
    numberOfLoaded: number;
  }
}

interface CustomLoadingOverlayProps extends GridLoadingOverlayProps {
  numberOfLoaded?: number;
}
function CustomDataGridLoadingOverlay(props: CustomLoadingOverlayProps) {
  return (
    <StyledGridOverlay>
      <CircularProgress color="primary" />
      {props?.numberOfLoaded >= 1000 && (
        <Box sx={{ mt: 2 }}>Loading {props?.numberOfLoaded} rows…</Box>
      )}
    </StyledGridOverlay>
  );
}
const StyledGridOverlay = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  backgroundColor: "rgba(18, 18, 18, 0.9)",
  ...theme.applyStyles("light", {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  }),
}));

export const FileBrowser = (props: FileBrowserProps) => {
  const [selectedFile, setSelectedFile] = useState<FileInfo>(null);
  const { openConfirmAsync, openAlertAsync } = useAlertStore();
  const [openRenameDialog, setOpenRenameDialog] = useState<boolean>(false);
  const [openNewFolderDialog, setOpenNewFolderDialog] =
    useState<boolean>(false);
  const apiRef = useGridApiRef();
  const columns: GridColDef[] = [
    // { field: "id", headerName: "ID", width: 70 },
    {
      field: "name",
      headerName: "Name",
      width: 400,
      //editable: true,
      renderCell: (params) => {
        const file = params.row as FileInfo;
        return <IconLabel icon={<file.type.icon />} label={params.value} />;
      },
    },
    {
      field: "lastModify",
      headerName: "Date modified",
      width: 200,
      type: "dateTime",
    },
    {
      field: "type",
      headerName: "Type",
      width: 120,
    },
    {
      field: "size",
      headerName: "Size",
      type: "number",
      width: 120,
      renderCell: (params) => {
        return <>{formatFileSize(params.value)}</>;
      },
    },
    {
      type: "actions",
      field: "actions",
      resizable: false,
      width: 100,
      getActions: (params) => {
        const file = params.row as FileInfo;
        let menu = [
          <GridActionsCellItem
            label="Rename"
            key={0}
            icon={<EditIcon fontSize="small" />}
            onClick={() => {
              setSelectedFile(file);
              setOpenRenameDialog(true);
            }}
            showInMenu
          />,
          <GridActionsCellItem
            label="Delete"
            key={1}
            icon={<DeleteIcon fontSize="small" />}
            onClick={() => handleDeleteFile(file)}
            showInMenu
          />,
          <GridActionsCellItem
            label="Clone"
            key={2}
            icon={<FileCopyIcon fontSize="small" />}
            onClick={() => handleCloneFile(file)}
            showInMenu
          />,
        ];
        if (file.type !== FolderFileType) {
          menu = [
            <GridActionsCellItem
              label="Preview"
              key={3}
              icon={<OpenIcon fontSize="small" />}
              onClick={() => handleEditFile(file)}
              showInMenu
            />,
            ...menu,
            <GridActionsCellItem
              label="Download"
              key={3}
              icon={<DownloadIcon fontSize="small" />}
              onClick={() => handleDownloadFile(file)}
              showInMenu
            />,
          ];
        }
        return menu;
      },
    },
  ];
  const handleNewFolder = async () => {
    setOpenNewFolderDialog(true);
  };
  const handleEditFile = async (file: FileInfo) => {
    await props.onEditFile(file);
  };
  const handleDeleteFile = async (file: FileInfo) => {
    const res = await openConfirmAsync({
      body: `Are you sure you want to delete '${file.name}'?`,
    });
    if (res) {
      await props.onDeleteFile(file);
    }
  };
  const handleCloneFile = async (file: FileInfo) => {
    await props.onCloneFile(file);
  };
  const handleDownloadFile = async (file: FileInfo) => {
    await props.onDownloadFile(file);
  };
  const handleRefresh = async () => {
    await props.onRefresh();
  };
  return (
    <Paper sx={{ width: "100%", position: "relative" }}>
      <DataGrid
        apiRef={apiRef}
        autoHeight={true}
        disableMultipleRowSelection={true}
        disableRowSelectionOnClick={true}
        disableVirtualization={true}
        rows={props.fileList}
        columns={columns}
        loading={props.loading}
        disableColumnFilter
        disableColumnSelector
        disableDensitySelector
        slots={{
          toolbar: CustomDataGridToolbar,
          loadingOverlay: CustomDataGridLoadingOverlay,
        }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            onAbout: props.onAbout,
            onRefresh: props.onRefresh,
            onNewFolder: handleNewFolder,
            onUploadFile: props.onUploadFile,
            fileList: props.fileList,
          },
          loadingOverlay: {
            numberOfLoaded: props.numberOfLoaded,
          },
        }}
        onRowDoubleClick={async (params, event, details) => {
          const file = params.row as FileInfo;
          await props?.onFileClick(file);
        }}
        // processRowUpdate={async (updatedRow, originalRow) => {
        //   console.log("processRowUpdate", updatedRow);
        //   return updatedRow;
        // }}
        sx={{ border: 0 }}
      />

      <FileRename
        file={selectedFile}
        show={openRenameDialog}
        onSave={async (file, newFileName) => {
          const exist = props.fileList.find((f) => f.name === newFileName);
          if (exist) {
            await openAlertAsync({
              body: `There is already a file/folder with the same name in this location`,
            });
          } else {
            setOpenRenameDialog(false);
            await props.onRenameFile?.(file, newFileName);
            await handleRefresh();
          }
        }}
        onCancel={async () => {
          setOpenRenameDialog(false);
        }}
      />
      <NewFolderDialog
        show={openNewFolderDialog}
        onSave={async (newFileName) => {
          const exist = props.fileList.find((f) => f.name === newFileName);
          if (exist) {
            await openAlertAsync({
              body: `There is already a file/folder with the same name in this location`,
            });
          } else {
            setOpenNewFolderDialog(false);
            await props.onNewFolder?.(newFileName);
            await handleRefresh();
          }
        }}
        onCancel={async () => {
          setOpenNewFolderDialog(false);
        }}
      />
    </Paper>
  );
};
