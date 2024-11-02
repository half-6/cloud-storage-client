import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useTheme,
} from "@mui/material";

import React, { useState } from "react";
import { useMediaQuery } from "@mui/system";
import { AlertResult, useAlertStore } from "../store";
import { Button } from "./";

export const Alert = () => {
  const { show, alertProps, closeAlert } = useAlertStore();
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const handleCancel = async () => {
    await alertProps.onCancel?.();
    await handleClosed({ reason: "cancel", result: false });
  };
  const handleOK = async () => {
    setLoading(true);
    try {
      await alertProps.onOK?.();
      await handleClosed({ reason: "ok", result: true });
    } catch (e) {
      if (alertProps.closeOnFailed) {
        await handleClosed({ reason: e, result: false });
      }
    } finally {
      setLoading(false);
    }
  };
  const handleClosed = async (reason: AlertResult) => {
    closeAlert();
    await alertProps.onClosed?.(reason);
  };
  return (
    <Dialog open={show} fullScreen={fullScreen}>
      <DialogTitle>{alertProps.title}</DialogTitle>
      <DialogContent sx={{ overflow: "hidden" }}>
        <DialogContentText>{alertProps.body}</DialogContentText>
      </DialogContent>
      <DialogActions>
        {alertProps.showOK && (
          <Button loading={loading} onClick={handleOK}>
            {alertProps.OKText}
          </Button>
        )}
        {alertProps.showCancel && (
          <Button disabled={loading} autoFocus onClick={handleCancel}>
            {alertProps.cancelText}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
