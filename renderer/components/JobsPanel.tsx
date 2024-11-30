import { JobInfo, JobStatusInfo, JobTypeInfo } from "#types";
import {
  Box,
  CircularProgress,
  CircularProgressProps,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import React, { useState } from "react";
import { useJobStore } from "../store";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import UploadOutlinedIcon from "@mui/icons-material/UploadOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import StopIcon from "@mui/icons-material/Stop";
import PlayIcon from "@mui/icons-material/PlayArrow";
import { getFileFullPath } from "#utility";

function CircularProgressWithLabel(
  props: CircularProgressProps & { value: number },
) {
  if (!props.value) {
    return <CircularProgress {...props} />;
  }
  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <CircularProgress variant="determinate" {...props} />
      {/*<Box*/}
      {/*  sx={{*/}
      {/*    top: 0,*/}
      {/*    left: 0,*/}
      {/*    bottom: 0,*/}
      {/*    right: 0,*/}
      {/*    position: "absolute",*/}
      {/*    display: "flex",*/}
      {/*    alignItems: "center",*/}
      {/*    justifyContent: "center",*/}
      {/*  }}*/}
      {/*>*/}
      {/*  <Typography*/}
      {/*    variant="caption"*/}
      {/*    component="div"*/}
      {/*    sx={{ color: "text.secondary", fontSize: "8px" }}*/}
      {/*  >{`${Math.round(props.value)}%`}</Typography>*/}
      {/*</Box>*/}
    </Box>
  );
}

export const JobsPanel = () => {
  const { jobs, deleteJob, openFile } = useJobStore();
  const [selectedJob, setSelectedJob] = useState<JobInfo>(null);
  const [jobMenuAnchorEl, setJobMenuAnchorEl] = React.useState<null | Element>(
    null,
  );
  const openJobMenu = Boolean(jobMenuAnchorEl);
  const handleCloseMenu = () => {
    setJobMenuAnchorEl(null);
  };
  const handleStopJobMenu = () => {
    handleCloseMenu();
  };
  const handlePlayJobMenu = () => {
    handleCloseMenu();
  };
  const handleDeleteJobMenu = () => {
    handleStopJobMenu();
    handleCloseMenu();
    setSelectedJob(null);
    deleteJob(selectedJob);
  };
  const handleOpenFileMenu = () => {
    openFile(selectedJob.localFilePath);
    handleCloseMenu();
  };
  const getTitle = (job: JobInfo) => {
    if (job.type === JobTypeInfo.download) {
      return `Download file from ${getFileFullPath(job.file)} to ${job.localFilePath}`;
    }
    if (job.type === JobTypeInfo.upload) {
      return `Upload file from ${job.localFilePath} to ${getFileFullPath(job.file)}`;
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
          <ListSubheader component="div" id="nested-list-subheader">
            TASKS
          </ListSubheader>
        }
      >
        {jobs?.map((job, index) => (
          <ListItem key={index}>
            <ListItemIcon sx={{ minWidth: "auto", paddingRight: "10px" }}>
              {job.type === JobTypeInfo.download && <DownloadOutlinedIcon />}
              {job.type === JobTypeInfo.upload && <UploadOutlinedIcon />}
            </ListItemIcon>
            <Tooltip title={getTitle(job)}>
              <ListItemText
                primary={job.name}
                sx={{ textWrap: "nowrap" }}
                primaryTypographyProps={{
                  sx: {
                    textWrap: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                  },
                }}
              />
            </Tooltip>
            <ListItemIcon sx={{ minWidth: "auto", paddingRight: "5px" }}>
              {job.status === JobStatusInfo.loading && (
                <CircularProgressWithLabel
                  size="20px"
                  value={job.progress?.percentage || 0}
                />
              )}
              {job.status === JobStatusInfo.completed && (
                <CheckCircleOutlinedIcon />
              )}
            </ListItemIcon>
            <IconButton
              onClick={async (event) => {
                event.stopPropagation();
                setSelectedJob(job);
                setJobMenuAnchorEl(event.currentTarget);
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </ListItem>
        ))}
      </List>
      <Menu
        id="job-menu"
        anchorEl={jobMenuAnchorEl}
        open={openJobMenu}
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
        {/*{selectedJob && selectedJob.status === JobStatusInfo.loading && (*/}
        {/*  <MenuItem onClick={handleStopJobMenu}>*/}
        {/*    <ListItemIcon>*/}
        {/*      <StopIcon />*/}
        {/*    </ListItemIcon>*/}
        {/*    <ListItemText>Stop Job</ListItemText>*/}
        {/*  </MenuItem>*/}
        {/*)}*/}
        {/*{selectedJob && selectedJob.status === JobStatusInfo.pause && (*/}
        {/*  <MenuItem onClick={handlePlayJobMenu}>*/}
        {/*    <ListItemIcon>*/}
        {/*      <PlayIcon />*/}
        {/*    </ListItemIcon>*/}
        {/*    <ListItemText>Play Job</ListItemText>*/}
        {/*  </MenuItem>*/}
        {/*)}*/}
        {selectedJob &&
          selectedJob.type === JobTypeInfo.download &&
          selectedJob.status === JobStatusInfo.completed && (
            <MenuItem onClick={handleOpenFileMenu}>
              <ListItemIcon>
                <EditIcon />
              </ListItemIcon>
              <ListItemText>Open Local File</ListItemText>
            </MenuItem>
          )}
        {selectedJob && selectedJob.status === JobStatusInfo.completed && (
          <MenuItem onClick={handleDeleteJobMenu}>
            <ListItemIcon>
              <DeleteIcon />
            </ListItemIcon>
            <ListItemText>Delete Job</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};
