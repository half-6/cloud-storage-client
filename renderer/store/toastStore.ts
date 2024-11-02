import { create } from "zustand/index";
import { AlertColor } from "@mui/material/Alert/Alert";

export interface ToastStoreProps {
  message: string;
  autoHideDuration?: number;
  severity?: AlertColor;
  onClose?: () => void;
}
export interface ToastStoreState {
  show: boolean;
  toastProps: ToastStoreProps;
  showToastMessage: (props: ToastStoreProps) => void;
  hideToastMessage: () => void;
}

export const DefaultToastStoreProps = {
  autoHideDuration: 2000,
  severity: "success" as AlertColor,
};

export const useToastStore = create<ToastStoreState>((set, get) => {
  return {
    show: false,
    toastProps: {} as ToastStoreProps,
    hideToastMessage: () => {
      set({
        show: false,
      });
    },
    showToastMessage: (props: ToastStoreProps) => {
      set({
        show: true,
        toastProps: { ...DefaultToastStoreProps, ...props },
      });
    },
  };
});
