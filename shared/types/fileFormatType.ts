import TextSnippetOutlinedIcon from "@mui/icons-material/TextSnippetOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import HtmlOutlinedIcon from "@mui/icons-material/HtmlOutlined";
import JavascriptOutlinedIcon from "@mui/icons-material/JavascriptOutlined";
import CssOutlinedIcon from "@mui/icons-material/CssOutlined";
import VideoFileOutlinedIcon from "@mui/icons-material/VideoFileOutlined";
import AudioFileOutlinedIcon from "@mui/icons-material/AudioFileOutlined";
import FolderZipOutlinedIcon from "@mui/icons-material/FolderZipOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import { getFileExtension } from "#utility";

export enum FileFormatType {
  Folder,
  PDF,
  Image,
  Font,
  Application,
  HTML,
  JS,
  CSS,
  Video,
  Audio,
  Compressed,
  Extension,
  Unknown,
}

export interface FileTypeInfo {
  name: string;
  extension: string[];
  fileType: FileFormatType;
}

export const UnknownFileType = {
  name: "Unknown File",
  extension: [],
  fileType: FileFormatType.Unknown,
} as FileTypeInfo;

export const PDFFileType = {
  name: "PDF File",
  extension: ["PDF"],
  fileType: FileFormatType.PDF,
};
export const FolderFileType = {
  name: "File Folder",
  extension: [],
  fileType: FileFormatType.Folder,
};
export const ImageFileType = {
  name: "Image File",
  extension: ["JPG", "JPEG", "PNG", "BMP", "GIF", "SVG"],
  fileType: FileFormatType.Image,
};
export const FontFileType = {
  name: "Font File",
  extension: ["TTF", "OTF", "EOT", "WOFF", "WOFF2"],
  fileType: FileFormatType.Font,
};
export const ApplicationFileType = {
  name: "Application",
  extension: ["EXE"],
  fileType: FileFormatType.Application,
};
export const HTMLFileType = {
  name: "HTML File",
  extension: ["html"],
  fileType: FileFormatType.HTML,
};
export const JSFileType = {
  name: "JS File",
  extension: ["JS", "TS"],
  fileType: FileFormatType.JS,
};
export const CSSFileType = {
  name: "CSS File",
  extension: ["CSS"],
  fileType: FileFormatType.CSS,
};
export const VideoFileType = {
  name: "VIDEO File",
  extension: ["MP4", "WMV", "AVI", "MOV", "MKV"],
  fileType: FileFormatType.Video,
};
export const AudioFileType = {
  name: "AUDIO File",
  extension: ["MP3", "WAV", "AAC", "FLAC", "OGG"],
  fileType: FileFormatType.Audio,
};

export const CompressedFileType = {
  name: "Compressed File",
  extension: ["zip", "7Z", "GZIP", "TAR"],
  fileType: FileFormatType.Compressed,
};

export const FileTypeIconMapping = {
  [FileFormatType.Folder]: FolderOutlinedIcon,
  [FileFormatType.PDF]: PictureAsPdfOutlinedIcon,
  [FileFormatType.Image]: ImageOutlinedIcon,
  [FileFormatType.Font]: TextSnippetOutlinedIcon,
  [FileFormatType.Application]: TextSnippetOutlinedIcon,
  [FileFormatType.HTML]: HtmlOutlinedIcon,
  [FileFormatType.JS]: JavascriptOutlinedIcon,
  [FileFormatType.CSS]: CssOutlinedIcon,
  [FileFormatType.Video]: VideoFileOutlinedIcon,
  [FileFormatType.Audio]: AudioFileOutlinedIcon,
  [FileFormatType.Compressed]: FolderZipOutlinedIcon,
  [FileFormatType.Unknown]: TextSnippetOutlinedIcon,
  [FileFormatType.Extension]: TextSnippetOutlinedIcon,
};
const FileTypeList = [
  PDFFileType,
  ImageFileType,
  FontFileType,
  ApplicationFileType,
  HTMLFileType,
  JSFileType,
  CSSFileType,
  VideoFileType,
  AudioFileType,
  CompressedFileType,
];

export function getFileTypeByFileName(fileName: string) {
  const extension: string = getFileExtension(fileName);
  if (!extension) {
    return UnknownFileType;
  }
  for (let fileType of Object.values(FileTypeList)) {
    if (fileType.extension.includes(extension)) {
      return fileType;
    }
  }
  return {
    name: `${extension.toUpperCase()} File`,
    extension: [extension],
    fileType: FileFormatType.Extension,
  } as FileTypeInfo;
}
