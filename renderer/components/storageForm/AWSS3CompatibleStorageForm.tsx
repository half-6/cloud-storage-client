import { AWSS3StorageInfo, StorageType } from "#types";
import {
  Box,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Link,
  TextField,
} from "@mui/material";
import Button from "@mui/material/Button";
import React from "react";
import { useForm } from "react-hook-form";
import Typography from "@mui/material/Typography";
import { HelpButton } from "../HelpButton";

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
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 0,
        }}
      >
        <Typography variant="h6">
          S3 Compatible Storage Account Setting
        </Typography>
        <HelpButton>
          <Box
            sx={{
              padding: 0,
              margin: 1,
              backgroundColor: "transparent",
            }}
          >
            <Typography variant="subtitle1">
              How to setup authentication
            </Typography>
            <Typography variant="body2">
              Access keys are long-term credentials for an IAM user or the AWS
              account root user. You can use access keys to sign programmatic
              requests to the AWS CLI or AWS API (directly or using the AWS SDK)
            </Typography>
            <Typography variant="body2" sx={{ paddingTop: 1 }}>
              Access keys consist of two parts: an <b>access key ID</b> and a{" "}
              <b>secret access key</b>. You must use both the access key ID and
              secret access key together to authenticate your requests.
            </Typography>
            <Typography variant="body2" sx={{ paddingTop: 1 }}>
              See more details at{" "}
              <Link
                sx={{ color: "white", textDecoration: "underline" }}
                href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html"
                target="_blank"
              >
                manage access keys
              </Link>
            </Typography>
          </Box>
        </HelpButton>
      </DialogTitle>
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
