import electronLog from "electron-log";
import { isProd } from "./env";
//error, warn, info, verbose, debug, silly
if (electronLog.transports.file) {
  const fileName = new Date().toISOString().split("T")[0].replaceAll("-", "");
  electronLog.transports.file.level = isProd ? "warn" : "silly";
  electronLog.transports.file.fileName = `${fileName}.log`;
}
if (electronLog.transports.console) {
  electronLog.transports.console.level = isProd ? "warn" : "silly";
}
export const log = electronLog;
