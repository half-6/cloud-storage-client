import { AWSS3StorageInfo, StorageInfo } from "../types";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Button from "@mui/material/Button";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export interface StoragePanelProps {
  open: boolean;
  storage: AWSS3StorageInfo;
  onSave: (storage: StorageInfo) => void;
  onClose: () => void;
}

export const AWSS3StoragePanel = (props: StoragePanelProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useState<boolean>(props.open || false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  function handleOK(data) {
    setOpen(false);
    props?.onSave(data);
  }
  const handleClose = () => {
    setOpen(false);
    props?.onClose();
  };
  useEffect(() => {
    setOpen(props.open);
  }, [props.open]);
  useEffect(() => {
    if (!props.storage) {
      reset({
        name: "",
        region: "",
        accessKeyId: "",
        secretAccessKey: "",
      });
    } else {
      reset({ ...props.storage });
    }
  }, [props.storage, reset, props.open]);
  return (
    <Dialog open={open} fullScreen={fullScreen} onClose={handleClose}>
      <form onSubmit={handleSubmit(handleOK)} noValidate>
        <DialogTitle>AWS S3 Account Setting</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter AWS S3 account details and click Save
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
            id="region"
            name="region"
            label="Region"
            type="string"
            defaultValue={props?.storage?.region}
            fullWidth
            variant="standard"
            error={errors.region != null}
            {...register("region", { required: true })}
          />
          <TextField
            required
            margin="dense"
            id="accessKeyId"
            name="accessKeyId"
            label="Access Key Id"
            type="string"
            fullWidth
            variant="standard"
            defaultValue={props?.storage?.accessKeyId}
            error={errors.accessKeyId != null}
            {...register("accessKeyId", { required: true })}
          />
          <TextField
            required
            margin="dense"
            id="secretAccessKey"
            name="secretAccessKey"
            label="SecretAccessKey"
            type="string"
            fullWidth
            variant="standard"
            defaultValue={props?.storage?.secretAccessKey}
            error={errors.SecretAccessKey != null}
            {...register("secretAccessKey", { required: true })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
