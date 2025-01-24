import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import packageJson from "../../package.json";
import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Link from "./Link";
import Typography from "@mui/material/Typography";

interface AboutProps {
  open: boolean;
  onClose: () => void;
}

export const About = (props: AboutProps) => {
  const [open, setOpen] = useState<boolean>(props.open || false);
  const handleClose = () => {
    setOpen(false);
    props.onClose();
  };
  useEffect(() => {
    setOpen(props.open);
  }, [props.open]);
  return (
    <Dialog open={open}>
      <DialogTitle>Cloud Storage Client v{packageJson.version}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Typography>
            Home:{" "}
            <Link
              href="https://github.com/half-6/cloud-storage-client"
              target="_blank"
            >
              https://github.com/half-6/cloud-storage-client
            </Link>
          </Typography>
          <Typography>
            Latest Version:{" "}
            <Link
              href="https://github.com/half-6/cloud-storage-client"
              target="_blank"
            >
              https://github.com/half-6/cloud-storage-client/releases
            </Link>
          </Typography>
          <Typography>
            Feedback:{" "}
            <Link
              href="https://github.com/half-6/cloud-storage-client/issues"
              target="_blank"
            >
              https://github.com/half-6/cloud-storage-client/releases
            </Link>
          </Typography>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>OK</Button>
      </DialogActions>
    </Dialog>
  );
};
