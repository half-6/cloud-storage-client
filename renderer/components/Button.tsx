import React from "react";
import {
  CircularProgress,
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
} from "@mui/material";

export interface ButtonProps extends MuiButtonProps {
  loading?: boolean;
}

/**
 * Button component with loading,
 * The circular progress will be shown when loading is true, and overwrites the startIcon
 * @param children
 * @param loading
 * @param rest
 * @constructor
 */

export const Button = ({ children, loading, ...rest }: ButtonProps) => {
  if (loading) {
    return (
      <MuiButton
        {...rest}
        startIcon={<CircularProgress size="1rem" color="inherit" />}
        disabled
      >
        {children}
      </MuiButton>
    );
  }

  return <MuiButton {...rest}>{children}</MuiButton>;
};
