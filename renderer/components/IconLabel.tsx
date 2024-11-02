import React, { ReactNode } from "react";
import { Box } from "@mui/material";
import { BoxProps } from "@mui/material/Box/Box";

interface IconLabelProps extends BoxProps {
  icon: ReactNode;
  label: string;
}

export const IconLabel = (props: IconLabelProps) => {
  return (
    <Box {...props} sx={{ display: "flex", alignItems: "center" }}>
      {props.icon}
      {props.label && (
        <Box sx={{ marginLeft: "4px", minWidth: "1px" }}>{props.label}</Box>
      )}
      {!props.label && (
        <Box sx={{ marginLeft: "4px", minWidth: "1px" }}>&nbsp;</Box>
      )}
    </Box>
  );
};
