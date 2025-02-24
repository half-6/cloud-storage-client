import { Alert } from "./Alert";
import React from "react";
import Head from "next/head";
import { Box } from "@mui/material";
import { useAlertStore } from "../store";
import { log } from "#utility";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = (props: LayoutProps) => {
  const { openAlertAsync } = useAlertStore();
  if (typeof window !== "undefined") {
    //it will show popup in DEV model
    window.addEventListener("error", (event) => {
      event.preventDefault();
      log.error("Global Error", event.message);
      openAlertAsync({ body: event.message });
    });
    // if will work and show popup dialog after compile only
    window.addEventListener("unhandledrejection", (event) => {
      event.preventDefault();
      log.error("Global Error", event.reason);
      openAlertAsync({ body: event.reason });
    });
  }
  return (
    <>
      <Head>
        <title>Cloud Storage Client</title>
      </Head>
      <Box sx={{ display: "flex" }}>{props.children}</Box>
      <Alert />
    </>
  );
};
