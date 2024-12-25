import { JobInfo, JobStatusInfo, JobTypeInfo } from "#types";
import {
  Box,
  CircularProgress,
  CircularProgressProps,
  Collapse,
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
import React, { MouseEvent, useState } from "react";
import { useJobStore } from "../store";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import UploadOutlinedIcon from "@mui/icons-material/UploadOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import PauseCircleOutlineOutlinedIcon from "@mui/icons-material/PauseCircleOutlineOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { getFileFullPath } from "#utility";
import { ExpandLess, ExpandMore } from "@mui/icons-material";

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
  const { jobs, deleteJob } = useJobStore();
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
    window.dialog.openFile(selectedJob.localFilePath);
    handleCloseMenu();
  };
  const handleOnJobMoreClick = (event: MouseEvent, job: JobInfo) => {
    setSelectedJob(job);
    setJobMenuAnchorEl(event.currentTarget);
  };
  return (
    <>
      <List
        sx={{
          width: "100%",
          maxWidth: 360,
          bgcolor: "background.paper",
        }}
        component="nav"
        subheader={
          <ListSubheader component="div" id="nested-list-subheader">
            TASKS
          </ListSubheader>
        }
      >
        {jobs?.map((job, index) => (
          <JobPanel
            job={job}
            onMoreAction={handleOnJobMoreClick}
            key={job.id}
          />
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
        {selectedJob && selectedJob.status === JobStatusInfo.completed && (
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

interface JobPanelProps {
  job: JobInfo;
  onMoreAction: (event: MouseEvent, job: JobInfo) => void;
}

export const JobPanel = (props: JobPanelProps) => {
  const [openSubJobs, setOpenSubJobs] = useState<boolean>(false);
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
      <ListItem>
        <ListItemIcon sx={{ minWidth: "auto", paddingRight: "10px" }}>
          {props.job.status === JobStatusInfo.loading && (
            <CircularProgressWithLabel
              size="20px"
              value={props.job.progress?.percentage || 0}
            />
          )}
          {props.job.status === JobStatusInfo.completed &&
            props.job.type === JobTypeInfo.download && <DownloadOutlinedIcon />}
          {props.job.status === JobStatusInfo.completed &&
            props.job.type === JobTypeInfo.upload && <UploadOutlinedIcon />}
          {props.job.status === JobStatusInfo.failed && (
            <Tooltip title={props.job.error}>
              <CancelOutlinedIcon />
            </Tooltip>
          )}
          {props.job.status === JobStatusInfo.pause && (
            <PauseCircleOutlineOutlinedIcon />
          )}
        </ListItemIcon>
        <Tooltip title={getTitle(props.job)}>
          <ListItemText
            primary={props.job.name}
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
        <IconButton
          onClick={(event) => {
            event.stopPropagation();
            props.onMoreAction(event, props.job);
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
        {props.job?.subJobs?.length > 0 && (
          <IconButton
            onClick={() => {
              setOpenSubJobs(!openSubJobs);
            }}
          >
            {openSubJobs ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        )}
      </ListItem>
      <Collapse in={openSubJobs} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {props.job.subJobs?.map((subjob, index) => (
            <ListItem key={subjob.id} sx={{ padding: "3px 10px 3px 50px" }}>
              <ListItemIcon sx={{ minWidth: "auto", paddingRight: "10px" }}>
                {subjob.status === JobStatusInfo.loading && (
                  <CircularProgressWithLabel
                    size="20px"
                    value={subjob.progress?.percentage || 0}
                  />
                )}
                {subjob.status === JobStatusInfo.completed && (
                  <CheckCircleOutlinedIcon />
                )}
                {subjob.status === JobStatusInfo.failed && (
                  <Tooltip title={subjob.error}>
                    <CancelOutlinedIcon />
                  </Tooltip>
                )}
                {subjob.status === JobStatusInfo.pause && (
                  <PauseCircleOutlineOutlinedIcon />
                )}
              </ListItemIcon>
              <Tooltip title={getTitle(subjob)}>
                <ListItemText
                  primary={subjob.name}
                  sx={{ textWrap: "nowrap" }}
                  primaryTypographyProps={{
                    fontSize: 14,
                    sx: {
                      textWrap: "nowrap",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                    },
                  }}
                />
              </Tooltip>
              <IconButton
                onClick={async (event) => {
                  event.stopPropagation();
                  props.onMoreAction(event, subjob);
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </ListItem>
          ))}
        </List>
      </Collapse>
    </>
  );
};
