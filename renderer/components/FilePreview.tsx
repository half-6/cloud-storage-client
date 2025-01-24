import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Tab,
  Tabs,
  TextField,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { FileDetailInfo, FileInfo } from "#types";
import React, { useEffect } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Typography from "@mui/material/Typography";
import { formatFileSize, obj2array } from "../lib";
import { TabPanel, a11yProps } from "./";

interface FilePreviewProps {
  show: boolean;
  file: FileDetailInfo;
  loading: boolean;
  downloadFile: FileDetailInfo;
  isDownloading: boolean;
  onDownload: (file: FileDetailInfo) => Promise<void>;
  onSave: (file: FileInfo, content: string) => Promise<void>;
  onCancel: () => Promise<void>;
}
const tagColumns: GridColDef[] = [
  { field: "key", headerName: "Key", width: 300 },
  { field: "value", headerName: "Value", width: 300 },
];

const MAX_PREVIEW_SIZE = 1024 * 1024 * 100; //100MB

export const FilePreview = (props: FilePreviewProps) => {
  const [tab, setTab] = React.useState(0);
  const [content, setContent] = React.useState(props.downloadFile?.body || "");
  const handleSave = async () => {
    await props?.onSave(props.downloadFile, content);
  };
  const handleCancel = async () => {
    await props?.onCancel();
  };
  const handleTagChange = async (
    event: React.SyntheticEvent,
    newValue: number,
  ) => {
    setTab(newValue);
    if (newValue === 1 && props.file.size < MAX_PREVIEW_SIZE) {
      await props.onDownload?.(props.file);
    }
  };
  useEffect(() => {
    if (props.show) {
      setTab(0);
    }
  }, [props.show]);
  return (
    <Dialog maxWidth={"lg"} fullWidth={true} open={props.show}>
      <DialogTitle>{props.file?.name}</DialogTitle>
      <DialogContent sx={{ minHeight: "400px" }}>
        <Tabs
          value={tab}
          onChange={handleTagChange}
          // indicatorColor="secondary"
          textColor="inherit"
          variant="fullWidth"
          aria-label="preview file"
        >
          <Tab label="Overview" {...a11yProps(0)} />
          <Tab label="Preview" {...a11yProps(1)} />
          {props.file?.tags?.length > 0 && (
            <Tab label="Tags" {...a11yProps(2)} />
          )}
          {obj2array(props.file?.metadata).length > 0 && (
            <Tab label="Tags" {...a11yProps(3)} />
          )}
          {/*<Tab label="Permissions" {...a11yProps(4)} />*/}
        </Tabs>
        <TabPanel value={tab} index={0}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <Box>
                <Typography variant="subtitle2">Owner</Typography>
                <Typography variant="body2">
                  {props.file?.permission?.Owner.DisplayName}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box>
                <Typography variant="subtitle2">Last modified</Typography>
                <Typography variant="body2">
                  {props?.file?.lastModify?.toString()}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="subtitle2">Size</Typography>
              <Typography variant="body2">
                {formatFileSize(props?.file?.size)}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="subtitle2">Content Type</Typography>
              <Typography variant="body2">
                {props?.file?.contentType}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="subtitle2">Entity tag (Etag)</Typography>
              <Typography variant="body2">{props?.file?.eTag}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="subtitle2">Object URL</Typography>
              <Typography variant="body2">
                <Link
                  sx={{ wordWrap: "break-word" }}
                  href={props?.file?.url}
                  target="_blank"
                >
                  {props?.file?.url}
                </Link>
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>
        <TabPanel value={tab} index={1}>
          {props.isDownloading && (
            <Box
              sx={{
                alignItems: "center",
                justifyContent: "center",
                display: "flex",
                minHeight: "300px",
                position: "relative",
              }}
            >
              <Backdrop sx={{ position: "absolute" }} open={true}>
                <CircularProgress color="inherit" />
              </Backdrop>
            </Box>
          )}
          {props.downloadFile?.isReadableContent && (
            <TextField
              id="file-detail"
              multiline
              minRows={10}
              defaultValue={props.downloadFile?.body}
              onChange={(e) => {
                setContent(e.currentTarget.value);
              }}
              variant="filled"
              sx={{ display: "flex" }}
            />
          )}
          {props.downloadFile?.isImageContent && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={props.downloadFile?.body}
              alt={props.downloadFile?.name}
              style={{ width: "100%", maxHeight: "500px" }}
            />
          )}
          {!props.downloadFile?.isReadableContent &&
            !props.downloadFile?.isImageContent &&
            !props.isDownloading && (
              <Box
                sx={{
                  alignItems: "center",
                  justifyContent: "center",
                  display: "flex",
                  minHeight: "300px",
                  position: "relative",
                  flexDirection: "column",
                }}
              >
                <Typography variant="h6">
                  Please download it to view the content
                </Typography>
                <Typography variant="body1">
                  It looks like we don&#39;t support this file format, or the
                  file size is too big (&gt;{formatFileSize(MAX_PREVIEW_SIZE)}).
                </Typography>
              </Box>
            )}
        </TabPanel>
        <TabPanel value={tab} index={2}>
          <DataGrid
            getRowId={(item) => item.key}
            rows={props.file?.tags}
            columns={tagColumns}
            hideFooter={true}
          />
        </TabPanel>
        <TabPanel value={tab} index={3}>
          <DataGrid
            getRowId={(item) => item.key}
            rows={obj2array(props.file?.metadata)}
            columns={tagColumns}
            hideFooter={true}
          />
        </TabPanel>
      </DialogContent>
      <DialogActions>
        {tab == 1 && props?.downloadFile?.isReadableContent && (
          <Button onClick={handleSave}>Save</Button>
        )}

        <Button autoFocus onClick={handleCancel}>
          Close
        </Button>
      </DialogActions>
      <Backdrop
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
        open={props.loading && props.show}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Dialog>
  );
};
