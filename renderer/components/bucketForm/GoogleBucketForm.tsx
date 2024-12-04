import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import { useForm } from "react-hook-form";
import {
  BucketInfo,
  GoogleBucketInfo,
  RegionInfoList,
  StorageInfo,
  StorageType,
} from "#types";

interface GoogleBucketFormProps {
  storage: StorageInfo;
  bucket: GoogleBucketInfo;
  onSave: (bucket: BucketInfo) => Promise<void>;
  onCancel: () => Promise<void>;
}

export const GoogleBucketForm = (props: GoogleBucketFormProps) => {
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const handleOK = async (data) => {
    setSaving(true);
    await props?.onSave(data);
    setSaving(false);
  };
  const handleCancel = async () => {
    await props?.onCancel();
  };
  useEffect(() => {
    if (!props.bucket) {
      reset();
    } else {
      reset({
        name: props.bucket.name,
        region: props.bucket.region,
      });
    }
  }, [props.bucket, reset]);

  return (
    <form onSubmit={handleSubmit(handleOK)} noValidate>
      {props?.bucket && <DialogTitle>Edit Bucket</DialogTitle>}
      {!props?.bucket && <DialogTitle>Create Bucket</DialogTitle>}
      <DialogContent>
        <Typography>
          Specify Google bucket name and optional parameters and click Save
        </Typography>
        <TextField
          autoFocus
          required
          margin="dense"
          id="name"
          name="name"
          label="Bucket name"
          defaultValue={props?.bucket?.name}
          type="string"
          fullWidth
          variant="standard"
          error={errors.name != null}
          {...register("name", { required: true })}
        />
        <TextField
          margin="dense"
          id="region"
          name="region"
          label="Region, i.e US"
          defaultValue={props?.bucket?.region}
          type="string"
          fullWidth
          variant="standard"
          error={errors.region != null}
          {...register("region", { required: false })}
        ></TextField>
        <TextField
          autoFocus
          margin="dense"
          id="storageClass"
          name="storageClass"
          label="Storage Class"
          defaultValue={props?.bucket?.storageClass}
          type="string"
          fullWidth
          variant="standard"
          error={errors.storageClass != null}
          {...register("storageClass", { required: false })}
        />
      </DialogContent>
      <DialogActions>
        <Button type="submit">Save</Button>
        <Button autoFocus onClick={handleCancel}>
          Cancel
        </Button>
      </DialogActions>
    </form>
  );
};
