import { GoogleStorageInfo, StorageType } from "#types";
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
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 0,
        }}
      >
        <Typography variant="h6">Google Storage Account Setting</Typography>
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
              To authenticate calls to Google Cloud APIs, client libraries
              support{" "}
              <Link
                target="_blank"
                sx={{ color: "white", textDecoration: "underline" }}
                href="https://cloud.google.com/docs/authentication/application-default-credentials"
              >
                Application Default Credentials (ADC)
              </Link>
              ; the libraries look for credentials in a set of defined locations
              and use those credentials to authenticate requests to the API.
              With ADC, you can make credentials available to your application
              in a variety of environments, such as local development or
              production, without needing to modify your application code.
            </Typography>
            <Typography variant="body2" sx={{ paddingTop: 1 }}>
              1.Install the Google Cloud CLI, then initialize it by running the
              following command.
            </Typography>
            <Typography variant="body2" sx={{ paddingTop: 1 }}>
              gcloud init
            </Typography>
            <Typography variant="body2" sx={{ paddingTop: 1 }}>
              2.If you are using a local shell, then create local authentication
              credentials for your user account.
            </Typography>
            <Typography variant="body2" sx={{ paddingTop: 1 }}>
              gcloud auth application-default login
            </Typography>
            <Typography variant="body2" sx={{ paddingTop: 1 }}>
              A sign-in screen appears. After you sign in, your credentials are
              stored in the local credential file used by ADC.
            </Typography>
            <Typography variant="body2" sx={{ paddingTop: 1 }}>
              See more details at{" "}
              <Link
                sx={{ color: "white", textDecoration: "underline" }}
                href="https://cloud.google.com/storage/docs/reference/libraries"
                target="_blank"
              >
                Cloud Storage client libraries
              </Link>
            </Typography>
          </Box>
        </HelpButton>
      </DialogTitle>
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
