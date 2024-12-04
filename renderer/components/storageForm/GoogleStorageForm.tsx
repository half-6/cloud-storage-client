import { GoogleStorageInfo, StorageType } from "#types";
import {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";
import Button from "@mui/material/Button";
import React from "react";
import { useForm } from "react-hook-form";

interface GoogleStorageFormProps {
  storage: GoogleStorageInfo;
  onSave: (storage: GoogleStorageInfo) => void;
  onClose: () => void;
}

export const GoogleStorageForm = (props: GoogleStorageFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  function handleOK(data) {
    data.id = props.storage?.id;
    data.type = StorageType.GoogleCloudStorage;
    props?.onSave(data);
  }

  const handleClose = () => {
    props?.onClose();
  };
  return (
    <form noValidate onSubmit={handleSubmit(handleOK)}>
      <DialogTitle>Amazon S3 Storage Account Setting</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Enter account details and click Save
        </DialogContentText>
        <TextField
          autoFocus
          required
          margin="dense"
          id="name"
          name="name"
          label="Display name"
          type="string"
          defaultValue={props?.storage?.name}
          fullWidth
          variant="standard"
          error={errors.name != null}
          {...register("name", { required: true })}
        />
        <TextField
          required
          margin="dense"
          id="projectId"
          name="projectId"
          label="Project Id"
          type="string"
          defaultValue={props?.storage?.projectId}
          fullWidth
          variant="standard"
          error={errors.projectId != null}
          {...register("projectId", { required: true })}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogActions>
    </form>
  );
};
