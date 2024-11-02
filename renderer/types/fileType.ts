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
import { getFileExtension } from "../lib";

export class FileTypeInfo {
  protected _name: string;
  protected _extension: string[];
  protected _icon: any;
  constructor(name: string, extension: string[], icon: any) {
    this._name = name;
    this._extension = extension;
    this._icon = icon;
  }
  get name(): string {
    return this._name;
  }
  get extension(): string[] {
    return this._extension;
  }
  get icon(): any {
    return this._icon;
  }
  static getFileType(fileName: string) {
    const extension = getFileExtension(fileName);
    if (!extension) {
      return UnknownFileType;
    }
    for (let fileType of FileTypeList) {
      if (fileType.extension.includes(extension)) {
        return fileType;
      }
    }
    return new FileTypeInfo(
      `${extension.toUpperCase()} File`,
      [extension],
      TextSnippetOutlinedIcon,
    );
  }
  toString(): string {
    return this.name;
  }
}

export const UnknownFileType = new FileTypeInfo(
  "Unknown File",
  [],
  TextSnippetOutlinedIcon,
);
export const PDFFileType = new FileTypeInfo(
  "PDF File",
  ["PDF"],
  PictureAsPdfOutlinedIcon,
);
export const FolderFileType = new FileTypeInfo(
  "File Folder",
  [],
  FolderOutlinedIcon,
);
export const ImageFileType = new FileTypeInfo(
  "Image File",
  ["JPG", "JPEG", "PNG", "BMP", "GIF", "SVG"],
  ImageOutlinedIcon,
);
export const FontFileType = new FileTypeInfo(
  "Font File",
  ["TTF", "OTF", "EOT", "WOFF", "WOFF2"],
  TextSnippetOutlinedIcon,
);
export const ApplicationFileType = new FileTypeInfo(
  "Application",
  ["EXE"],
  TextSnippetOutlinedIcon,
);
export const HTMLFileType = new FileTypeInfo(
  "HTML File",
  ["html"],
  HtmlOutlinedIcon,
);
export const JSFileType = new FileTypeInfo(
  "JS File",
  ["JS", "TS"],
  JavascriptOutlinedIcon,
);
export const CSSFileType = new FileTypeInfo(
  "CSS File",
  ["css"],
  CssOutlinedIcon,
);
export const VideoFileType = new FileTypeInfo(
  "VIDEO File",
  ["MP4", "WMV", "AVI", "MOV", "MKV"],
  VideoFileOutlinedIcon,
);
export const AudioFileType = new FileTypeInfo(
  "AUDIO File",
  ["MP3", "WAV", "AAC", "FLAC", "OGG"],
  AudioFileOutlinedIcon,
);

export const ZipFileType = new FileTypeInfo(
  "AUDIO File",
  ["zip", "7Z", "GZIP", "TAR"],
  FolderZipOutlinedIcon,
);

// export enum FileType {
//   Folder = FolderFileType,
//   Image = ImageFileType,
//   Font = FontFileType,
//   Application = ApplicationFileType,
//   HTML = HTMLFileType,
//   JS = JSFileType,
//   CSS = CSSFileType,
//   Video = VideoFileType,
//   Audio = AudioFileType,
//   Zip = ZipFileType,
// }
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
  ZipFileType,
];
