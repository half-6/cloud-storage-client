import { AWSS3StorageInfo, StorageInfo, StorageType } from "#types";
import { Dialog, Tab, Tabs, useMediaQuery, useTheme } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  AWSS3CompatibleStorageForm,
  AWSS3StorageForm,
  TabPanel,
  a11yProps,
} from "./";

export interface StoragePanelProps {
  open: boolean;
  storage: StorageInfo;
  onSave: (storage: StorageInfo) => void;
  onClose: () => void;
}

export const StoragePanel = (props: StoragePanelProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useState<boolean>(props.open || false);
  const [tab, setTab] = React.useState(0);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const handleTagChange = async (
    event: React.SyntheticEvent,
    newValue: number,
  ) => {
    setTab(newValue);
  };
  function handleOK(data) {
    setOpen(false);
    data.type = StorageType[StorageType[tab]];
    props?.onSave(data);
  }
  const handleClose = () => {
    setOpen(false);
    props?.onClose();
  };
  useEffect(() => {
    setTab(props.storage?.type || 0);
    setOpen(props.open);
  }, [props.open, props.storage?.type]);
  useEffect(() => {
    if (!props.storage) {
      reset({
        // name: "",
        // region: "",
        // accessKeyId: "",
        // secretAccessKey: "",
      });
    } else {
      reset({ ...props.storage });
    }
  }, [props.storage, reset, props.open]);
  return (
    <Dialog
      maxWidth={"md"}
      fullWidth={true}
      open={open}
      fullScreen={fullScreen}
      onClose={handleClose}
    >
      <Tabs
        // orientation="vertical"
        // variant="scrollable"
        value={tab}
        onChange={handleTagChange}
        aria-label="Vertical tabs example"
        sx={{ borderRight: 1, borderColor: "divider" }}
      >
        <Tab label="Amazon S3 Storage" {...a11yProps(0)} />
        <Tab label="S3 Compatible Storage" {...a11yProps(1)} />
      </Tabs>
      <TabPanel value={tab} index={0}>
        <AWSS3StorageForm
          storage={props.storage as AWSS3StorageInfo}
          onSave={handleOK}
          onClose={handleClose}
        />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <AWSS3CompatibleStorageForm
          storage={props.storage as AWSS3StorageInfo}
          onSave={handleOK}
          onClose={handleClose}
        />
      </TabPanel>
    </Dialog>
  );
};
