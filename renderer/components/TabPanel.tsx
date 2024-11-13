import React from "react";
import { Box } from "@mui/material";

export interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: number;
  value: number;
}

export function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tab-panel-${index}`}
      aria-labelledby={`tab-panel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ padding: "20px 0" }}>{children}</Box>}
    </div>
  );
}
export function a11yProps(index: number) {
  return {
    id: `tab-panel-${index}`,
    "aria-controls": `tab-panel-${index}`,
  };
}
