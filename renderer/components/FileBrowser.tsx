import {
  FileFormatType,
  FileInfo,
  FileTypeIconMapping,
  StorageInfo,
} from "#types";
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridLoadingOverlayProps,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarProps,
  GridToolbarQuickFilter,
  useGridApiRef,
} from "@mui/x-data-grid";
import {
  Box,
  Button,
  CircularProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Tooltip,
  styled,
  useColorScheme,
} from "@mui/material";
import OpenIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import React, { useState } from "react";
import { formatFileSize, log, replaceFromEnd } from "../lib";
import { IconLabel } from "./IconLabel";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import { useAlertStore } from "../store";
import BlockIcon from "@mui/icons-material/Block";
import AddIcon from "@mui/icons-material/Add";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import { FileRename } from "./FileRename";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import ContentPasteOutlinedIcon from "@mui/icons-material/ContentPasteOutlined";
import ContentCutOutlinedIcon from "@mui/icons-material/ContentCutOutlined";
import { NewFolderDialog } from "./NewFolderDialog";

export interface ActionObject {
  action: "cut" | "copy";
  file: FileInfo;
}

interface CustomGridToolbarProps extends GridToolbarProps {
  onAbout: () => void;
  onRefresh: () => void;
  onNewFolder: () => void;
  onNewFile: () => void;
  onPasteObject: () => void;
  onUploadObjects: (
    filePaths: string[],
    parentFile?: FileInfo,
  ) => Promise<void>;
  fileList: FileInfo[];
  showPaste: boolean;
}
function CustomDataGridToolbar(props: CustomGridToolbarProps) {
  const [newMenuAnchorEl, setNewMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);
  const openMenu = Boolean(newMenuAnchorEl);

  const handleCloseMenu = () => {
    setNewMenuAnchorEl(null);
  };
  const handleNewClick = (event: React.MouseEvent<HTMLElement>) => {
    setNewMenuAnchorEl(event.currentTarget);
  };
  const handleNewFolder = () => {
    handleCloseMenu();
    props.onNewFolder();
  };
  const handleUploadFile = async () => {
    handleCloseMenu();
    const filePaths = await window.dialog.showOpenDialog("", [
      "openFile",
      "multiSelections",
    ]);
    if (!filePaths) return;
    await props.onUploadObjects(filePaths);
  };
  const handleUploadFolder = async () => {
    handleCloseMenu();
    const filePaths = await window.dialog.showOpenDialog("", ["openDirectory"]);
    if (!filePaths) return;
    await props.onUploadObjects(filePaths);
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
          onClick={handleNewClick}
          startIcon={<AddIcon />}
          // endIcon={<KeyboardArrowDownIcon />}
          disabled={!props.fileList}
        >
          New
        </Button>
        <Tooltip title="Refresh files">
          <span>
            <Button
              size="small"
              onClick={props.onRefresh}
              startIcon={<RefreshOutlinedIcon />}
              disabled={!props.fileList}
            >
              Refresh
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Paste file/folder to current bucket">
          <span>
            <Button
              size="small"
              onClick={props.onPasteObject}
              startIcon={<ContentPasteOutlinedIcon />}
              disabled={!props.showPaste}
            >
              Paste
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Cancel requests">
          <span>
            <Button
              size="small"
              onClick={props.onAbout}
              startIcon={<BlockIcon />}
            >
              Cancel
            </Button>
          </span>
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
        <MenuItem onClick={handleUploadFile}>
          <ListItemIcon>
            <UploadFileIcon />
          </ListItemIcon>
          <ListItemText>Upload File</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleUploadFolder}>
          <ListItemIcon>
            <UploadFileIcon />
          </ListItemIcon>
          <ListItemText>Upload Folder</ListItemText>
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
  onMoveFile: (file: FileInfo, newFile: FileInfo) => Promise<void>;
  onRenameFile: (file: FileInfo, newFile: FileInfo) => Promise<void>;
  hasObject: (file: FileInfo) => Promise<boolean>;
  onRefresh: () => void;
  onAbout: () => void;
  onUploadObjects: (
    filePaths: string[],
    parentFile?: FileInfo,
  ) => Promise<void>;
  onDownloadFile: (file: FileInfo) => Promise<void>;
  onDownloadFolder: (file: FileInfo) => Promise<void>;
  onPasteObject: (actionObject: ActionObject) => Promise<boolean>;
}

declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides {
    onAbout: () => void;
    onRefresh: () => void;
    onNewFolder: () => void;
    onNewFile: () => void;
    onUploadObjects: (
      filePaths: string[],
      parentFile?: FileInfo,
    ) => Promise<void>;
    fileList: FileInfo[];
    showPaste: boolean;
    onPasteObject: () => Promise<void>;
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
  const [actionObject, setActionObject] = useState<ActionObject>();
  const { openConfirmAsync, openAlertAsync } = useAlertStore();
  const [openRenameDialog, setOpenRenameDialog] = useState<boolean>(false);
  const { mode } = useColorScheme();
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
        const FileTypeIcon = FileTypeIconMapping[file.type.fileType];
        return (
          <IconLabel
            icon={<FileTypeIcon />}
            draggable={true}
            label={params.value}
            onDrop={async (event) => {
              event.currentTarget.parentElement.style.border = "none";
              event.currentTarget.parentElement.style.borderTop =
                "1px solid var(--rowBorderColor)";
              event.preventDefault();
              event.stopPropagation();
              if (event.dataTransfer.files.length > 0) {
                const filePaths = [];
                for (const file of event.dataTransfer.files) {
                  filePaths.push(file.path);
                }
                log.log("UPLOAD", filePaths);
                if (file.type.fileType === FileFormatType.Folder) {
                  await props.onUploadObjects(filePaths, file);
                } else {
                  await props.onUploadObjects(filePaths);
                }
                return;
              }
              const dataTransfer = event.dataTransfer.getData("file");
              if (dataTransfer) {
                const remoteFile = JSON.parse(dataTransfer) as FileInfo;
                if (remoteFile.path === file.path) {
                  //can't drag to himself
                  return;
                }
                const ok = await openConfirmAsync({
                  body: `Do want to move "${remoteFile.name}" to "${file.path}${remoteFile.name}"? it will be replaced if the same name in the destination`,
                });
                if (ok) {
                  const newFilePath = `${file.path}${remoteFile.name}${remoteFile.type.fileType === FileFormatType.Folder ? "/" : ""}`;
                  const newFile = {
                    ...remoteFile,
                    path: newFilePath,
                  } as FileInfo;
                  await props.onMoveFile(remoteFile, newFile);
                }
              }
            }}
            onDragOver={(event) => {
              if (file.type.fileType === FileFormatType.Folder) {
                if (mode === "dark") {
                  //dark
                  event.currentTarget.parentElement.style.border =
                    "solid #90caf9 1px";
                } else {
                  //light
                  event.currentTarget.parentElement.style.border =
                    "1px #1976d2 solid";
                }
                event.preventDefault();
                event.stopPropagation();
              }
            }}
            onDragLeave={(event) => {
              event.currentTarget.parentElement.style.border = "none";
              event.currentTarget.parentElement.style.borderTop =
                "1px solid var(--rowBorderColor)";
            }}
            onDragStart={async (event) => {
              event.dataTransfer.setData("file", JSON.stringify(file));
              event.dataTransfer.effectAllowed = "move";
              //event.dataTransfer.setDragImage()
              //event.preventDefault();
              //log.log("drag start 222222222222", iconPath);
              //window.ipc.startDrag(file, svg);
            }}
          />
        );
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
      valueGetter: (params: FileInfo) => params.name,
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
      //headerName: "Action",
      resizable: false,
      width: 50,
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
          <GridActionsCellItem
            label="Cut"
            key={3}
            icon={<ContentCutOutlinedIcon fontSize="small" />}
            onClick={() => handleCutObject(file)}
            showInMenu
          />,
          <GridActionsCellItem
            label="Copy"
            key={4}
            icon={<ContentCopyOutlinedIcon fontSize="small" />}
            onClick={() => handleCopyObject(file)}
            showInMenu
          />,
          <GridActionsCellItem
            label="Download"
            key={5}
            icon={<DownloadIcon fontSize="small" />}
            onClick={() =>
              file.type.fileType === FileFormatType.Folder
                ? handleDownloadFolder(file)
                : handleDownloadFile(file)
            }
            showInMenu
          />,
        ];
        if (file.type.fileType !== FileFormatType.Folder) {
          menu = [
            <GridActionsCellItem
              label="Preview"
              key={6}
              icon={<OpenIcon fontSize="small" />}
              onClick={() => handleEditFile(file)}
              showInMenu
            />,
            ...menu,
          ];
        }
        return menu;
      },
    },
  ];
  const handleNewFolder = async () => {
    setOpenNewFolderDialog(true);
  };
  const handlePasteObject = async () => {
    const success = await props.onPasteObject(actionObject);
    if (success) {
      setActionObject(null);
    }
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
  const handleDownloadFolder = async (file: FileInfo) => {
    await props.onDownloadFolder(file);
  };
  const handleCopyObject = async (file: FileInfo) => {
    setActionObject({ action: "copy", file });
  };
  const handleCutObject = async (file: FileInfo) => {
    setActionObject({ action: "cut", file });
  };
  const handleRefresh = async () => {
    await props.onRefresh();
  };
  return (
    <Paper
      sx={{ width: "100%", position: "relative" }}
      onDrop={async (event) => {
        event.currentTarget.parentElement.style.border = "none";
        event.preventDefault();
        if (event.dataTransfer.files.length > 0) {
          const filePaths = [];
          for (const file of event.dataTransfer.files) {
            filePaths.push(file.path);
          }
          log.log("UPLOAD", filePaths);
          await props.onUploadObjects(filePaths);
        }
      }}
      onDragOver={(event) => {
        if (
          event.dataTransfer.items.length > 0 &&
          event.dataTransfer.items[0].kind === "file"
        ) {
          if (mode === "dark") {
            //dark
            event.currentTarget.parentElement.style.border =
              "solid #90caf9 1px";
          } else {
            //light
            event.currentTarget.parentElement.style.border =
              "1px #1976d2 solid";
          }
          event.preventDefault();
        }
      }}
      onDragLeave={(event) => {
        event.currentTarget.parentElement.style.border = "none";
      }}
    >
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
            onRefresh: handleRefresh,
            onNewFolder: handleNewFolder,
            onUploadObjects: props.onUploadObjects,
            onPasteObject: handlePasteObject,
            showPaste:
              actionObject?.file &&
              actionObject?.file.storage.id === props.storage?.id,
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
          const newFilePath = replaceFromEnd(file.path, file.name, newFileName);
          const newFile = {
            ...file,
            name: newFileName,
            path: newFilePath,
          } as FileInfo;
          const exist = await props.hasObject(newFile);
          if (exist) {
            await openAlertAsync({
              body: `There is already a file/folder with the same name "${newFileName}" in this location`,
            });
          } else {
            setOpenRenameDialog(false);
            await props.onRenameFile?.(file, newFile);
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
          }
        }}
        onCancel={async () => {
          setOpenNewFolderDialog(false);
        }}
      />
    </Paper>
  );
};
