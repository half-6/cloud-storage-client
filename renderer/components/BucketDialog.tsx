import { Dialog } from "@mui/material";
import React, { useState } from "react";
import { BucketInfo, StorageInfo, StorageType } from "#types";
import {
  AWSS3BucketForm,
  AWSS3CompatibleBucketForm,
  GoogleBucketForm,
} from "./";

interface BucketDialogProps {
  show: boolean;
  storage: StorageInfo;
  bucket: BucketInfo;
  onSave: (bucket: BucketInfo) => Promise<void>;
  onCancel: () => Promise<void>;
}

export const BucketDialog = (props: BucketDialogProps) => {
  const [saving, setSaving] = useState(false);
  const handleOK = async (data) => {
    setSaving(true);
    await props?.onSave(data);
    setSaving(false);
  };
  const handleCancel = async () => {
    await props?.onCancel();
  };
  return (
    <Dialog maxWidth={"md"} fullWidth={true} open={props.show}>
      {props.storage?.type === StorageType.AWSS3 && (
        <AWSS3BucketForm {...props} />
      )}
      {props.storage?.type === StorageType.AWSS3COMPATIBLE && (
        <AWSS3CompatibleBucketForm {...props} />
      )}
      {props.storage?.type === StorageType.GoogleCloudStorage && (
        <GoogleBucketForm {...props} />
      )}
    </Dialog>
  );
};
