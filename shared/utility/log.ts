import electronLog, { transports } from "electron-log";
import { isProd } from "./env";
//error, warn, info, verbose, debug, silly
if (electronLog.transports.file) {
  electronLog.transports.file.level = isProd ? "warn" : "silly";
}
if (electronLog.transports.console) {
  electronLog.transports.console.level = isProd ? "warn" : "silly";
}
export const log = electronLog;
