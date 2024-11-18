import { FileInfo, FolderFileType } from "#types";
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

interface FileRenameProps {
  file: FileInfo;
  show: boolean;
  onSave: (file: FileInfo, newFileName: string) => Promise<void>;
  onCancel: () => Promise<void>;
}
export const FileRename = (props: FileRenameProps) => {
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const handleOK = async (data) => {
    const newFileName = data.name;
    if (props.file.name !== newFileName) {
      setSaving(true);
      await props?.onSave(props.file, newFileName);
      setSaving(false);
    } else {
      await props?.onCancel();
    }
  };
  const handleCancel = async () => {
    await props?.onCancel();
  };
  useEffect(() => {
    if (!props.file) {
      reset({
        name: "",
      });
    } else {
      reset({ ...props.file });
    }
  }, [props.file, reset]);

  return (
    <Dialog maxWidth={"md"} fullWidth={true} open={props.show}>
      <form onSubmit={handleSubmit(handleOK)} noValidate>
        s<DialogTitle>Rename File</DialogTitle>
        <DialogContent>
          <Typography>Enter new file name and click save</Typography>
          <TextField
            autoFocus
            required
            margin="dense"
            id="name"
            name="name"
            label="File name"
            type="string"
            defaultValue={props?.file?.name}
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
