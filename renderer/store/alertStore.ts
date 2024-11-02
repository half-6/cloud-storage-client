import { create } from "zustand";

export interface AlertProps {
  title?: string;
  body: string;
  OKText?: string;
  cancelText?: string;
  showOK?: boolean;
  showCancel?: boolean;
  onCancel?: () => Promise<void> | void;
  onOK?: () => Promise<boolean | void> | boolean | void;
  onClosed?: (res: AlertResult) => Promise<void> | void;
  closeOnFailed?: boolean;
}

interface AlertState {
  show: boolean;
  alertProps: AlertProps;
  openAlert: (props: AlertProps) => void;
  openConfirm: (props: AlertProps) => void;
  openConfirmAsync: (props: AlertProps) => Promise<boolean>;
  openAlertAsync: (props: AlertProps) => Promise<boolean>;
  closeAlert: () => void;
}

export const DefaultAlertProps = {
  title: "Information",
  body: "this is default alert body",
  OKText: "Ok",
  cancelText: "Cancel",
  showOK: true,
  showCancel: false,
  closeOnFailed: true,
};
export const DefaultConfirmProps = {
  title: "Confirmation",
  body: "this is default confirmation body",
  OKText: "Yes",
  cancelText: "No",
  showOK: true,
  showCancel: true,
  closeOnFailed: true,
};

export interface AlertResult {
  result: boolean;
  reason: string | Error;
}
export const useAlertStore = create<AlertState>((set, get) => {
  return {
    show: false,
    alertProps: DefaultAlertProps,
    openConfirm: (props: AlertProps) => {
      set((state) => ({
        show: true,
        alertProps: { ...DefaultConfirmProps, ...props },
      }));
    },
    openAlert: (props: AlertProps) => {
      set((state) => ({
        show: true,
        alertProps: { ...DefaultAlertProps, ...props },
      }));
    },
    closeAlert: () => {
      set((state) => ({ show: false }));
    },
    openConfirmAsync: (props: AlertProps) => {
      return new Promise((resolve, reject) => {
        get()?.openConfirm({
          ...props,
          onClosed: async (res) => {
            await props?.onClosed?.(res);
            if (res.result) {
              resolve(true);
              return;
            }
            if (res.reason === "cancel") {
              resolve(false);
              return;
            }
            reject(res.reason);
          },
        });
      });
    },
    openAlertAsync: (props: AlertProps) => {
      return new Promise((resolve, reject) => {
        get()?.openAlert({
          ...props,
          onClosed: async (res) => {
            await props?.onClosed?.(res);
            if (res.result) {
              resolve(true);
              return;
            }
            if (res.reason === "cancel") {
              resolve(false);
              return;
            }
            reject(res.reason);
          },
        });
      });
    },
  };
});
