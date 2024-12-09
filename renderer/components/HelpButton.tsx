import React, { ReactNode } from "react";
import {
  IconButton,
  Tooltip,
  TooltipProps,
  styled,
  tooltipClasses,
} from "@mui/material";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";

interface HelpButtonProps {
  children: ReactNode;
}

const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    //backgroundColor: "#f5f5f9",
    //color: "rgba(0, 0, 0, 0.87)",
    maxWidth: 400,
    //fontSize: theme.typography.pxToRem(12),
    //border: "1px solid #dadde9",
  },
}));

export const HelpButton = (props: HelpButtonProps) => {
  return (
    <HtmlTooltip leaveDelay={1000} title={props.children}>
      <IconButton>
        <HelpOutlineOutlinedIcon />
      </IconButton>
    </HtmlTooltip>
  );
};
