import { FileInfo, FolderFileType } from "../types";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import { useForm } from "react-hook-form";

interface NewFolderDialogProps {
  show: boolean;
  onSave: (newFolderName: string) => Promise<void>;
  onCancel: () => Promise<void>;
}
export const NewFolderDialog = (props: NewFolderDialogProps) => {
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const handleOK = async (data) => {
    const newFolderName = data.name;
    setSaving(true);
    await props?.onSave(newFolderName);
    setSaving(false);
  };
  const handleCancel = async () => {
    await props?.onCancel();
  };
  useEffect(() => {
    if (!props.show) {
      reset({
        name: "",
      });
    }
  }, [props.show, reset]);

  return (
    <Dialog maxWidth={"md"} fullWidth={true} open={props.show}>
      <form onSubmit={handleSubmit(handleOK)} noValidate>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <Typography>Enter folder name and click save</Typography>
          <TextField
            autoFocus
            required
            margin="dense"
            id="name"
            name="name"
            label="Folder name"
            type="string"
            fullWidth
            variant="standard"
            error={errors.name != null}
            {...register("name", { required: true })}
          />
        </DialogContent>
        <DialogActions>
          <Button type="submit">Save</Button>
          <Button autoFocus onClick={handleCancel}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
