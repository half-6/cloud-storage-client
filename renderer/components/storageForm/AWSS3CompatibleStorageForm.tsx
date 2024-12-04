import { AWSS3StorageInfo, StorageType } from "#types";
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

interface AWSS3CompatibleStorageFormProps {
  storage: AWSS3StorageInfo;
  onSave: (storage: AWSS3StorageInfo) => void;
  onClose: () => void;
}

export const AWSS3CompatibleStorageForm = (
  props: AWSS3CompatibleStorageFormProps,
) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  function handleOK(data) {
    data.id = props.storage?.id;
    data.type = StorageType.AWSS3COMPATIBLE;
    props?.onSave(data);
  }
  const handleClose = () => {
    props?.onClose();
  };
  return (
    <form noValidate onSubmit={handleSubmit(handleOK)}>
      <DialogTitle>S3 Compatible Storage Account Setting</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Enter account details and click Save, it support Cloudflare R2
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
          id="endpoint"
          name="endpoint"
          label="Endpoint (https://<ACCOUNT_ID>.r2.cloudflarestorage.com)"
          type="string"
          defaultValue={props?.storage?.endpoint}
          fullWidth
          variant="standard"
          error={errors.endpoint != null}
          {...register("endpoint", { required: true })}
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
          label="Secret Access Key"
          type="string"
          fullWidth
          variant="standard"
          defaultValue={props?.storage?.secretAccessKey}
          error={errors.secretAccessKey != null}
          {...register("secretAccessKey", { required: true })}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogActions>
    </form>
  );
};
