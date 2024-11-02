import { Alert } from "./Alert";
import { ToastMessage } from "./ToastMessage";
import React from "react";
import Head from "next/head";
import { Box, Button } from "@mui/material";
import { useJobStore } from "../store";
import { SnackbarProvider } from "notistack";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = (props: LayoutProps) => {
  return (
    <SnackbarProvider>
      <Head>
        <title>Cloud Storage Client</title>
      </Head>
      <Box sx={{ display: "flex" }}>{props.children}</Box>
      <Alert />
      <ToastMessage />
    </SnackbarProvider>
  );
};
