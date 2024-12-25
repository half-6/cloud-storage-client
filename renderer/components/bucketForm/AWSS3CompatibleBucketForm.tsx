import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import React from "react";
import Typography from "@mui/material/Typography";
import { useForm } from "react-hook-form";
import { BucketInfo, StorageInfo } from "#types";

interface AWSS3CompatibleBucketFormProps {
  storage: StorageInfo;
  bucket: BucketInfo;
  onSave: (bucket: BucketInfo) => Promise<void>;
  onCancel: () => Promise<void>;
}

export const AWSS3CompatibleBucketForm = (
  props: AWSS3CompatibleBucketFormProps,
) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const handleOK = async (data) => {
    await props?.onSave(data);
    reset();
  };
  const handleCancel = async () => {
    await props?.onCancel();
    reset();
  };
  return (
    <form onSubmit={handleSubmit(handleOK)} noValidate>
      {props?.bucket && <DialogTitle>Edit Bucket</DialogTitle>}
      {!props?.bucket && <DialogTitle>Create Bucket</DialogTitle>}
      <DialogContent>
        <Typography>
          Specify AWS Compatible bucket name and optional parameters and click
          Save
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
          label="Region"
          defaultValue={props?.bucket?.region}
          type="string"
          fullWidth
          variant="standard"
          error={errors.region != null}
          {...register("region", { required: false })}
        ></TextField>
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
