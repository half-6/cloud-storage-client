import React from "react";
import { Alert, AlertProps, Snackbar, SnackbarProps } from "@mui/material";
import { useToastStore } from "../store";

export const ToastMessage = () => {
  const { show, toastProps, hideToastMessage } = useToastStore();
  const handleClose = () => {
    hideToastMessage();
    toastProps.onClose?.();
  };
  return (
    <Snackbar
      open={show}
      autoHideDuration={toastProps.autoHideDuration}
      onClose={handleClose}
      //anchorOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <Alert severity={toastProps.severity} onClose={handleClose}>
        {toastProps.message}
      </Alert>
    </Snackbar>
  );
};
