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

export enum FileType {
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

export class FileTypeInfo {
  protected _name: string;
  protected _extension: string[];
  protected _type: FileType;
  constructor(name: string, extension: string[], type: FileType) {
    this._name = name;
    this._extension = extension;
    this._type = type;
  }
  get name(): string {
    return this._name;
  }
  get extension(): string[] {
    return this._extension;
  }
  get fileType(): FileType {
    return this._type;
  }
  static getFileType(fileName: string) {
    const extension = getFileExtension(fileName);
    if (!extension) {
      return UnknownFileType;
    }
    for (let fileType of Object.values(FileTypeList)) {
      if (fileType.extension.includes(extension)) {
        return fileType;
      }
    }
    return new FileTypeInfo(
      `${extension.toUpperCase()} File`,
      [extension],
      FileType.Extension,
    );
  }
  static getFileTypeInfo(fileType: FileType) {}
  toString(): string {
    return this.name;
  }
}

export const UnknownFileType = new FileTypeInfo(
  "Unknown File",
  [],
  FileType.Unknown,
);
export const PDFFileType = new FileTypeInfo("PDF File", ["PDF"], FileType.PDF);
export const FolderFileType = new FileTypeInfo(
  "File Folder",
  [],
  FileType.Folder,
);
export const ImageFileType = new FileTypeInfo(
  "Image File",
  ["JPG", "JPEG", "PNG", "BMP", "GIF", "SVG"],
  FileType.Image,
);
export const FontFileType = new FileTypeInfo(
  "Font File",
  ["TTF", "OTF", "EOT", "WOFF", "WOFF2"],
  FileType.Font,
);
export const ApplicationFileType = new FileTypeInfo(
  "Application",
  ["EXE"],
  FileType.Application,
);
export const HTMLFileType = new FileTypeInfo(
  "HTML File",
  ["html"],
  FileType.HTML,
);
export const JSFileType = new FileTypeInfo(
  "JS File",
  ["JS", "TS"],
  FileType.JS,
);
export const CSSFileType = new FileTypeInfo("CSS File", ["CSS"], FileType.CSS);
export const VideoFileType = new FileTypeInfo(
  "VIDEO File",
  ["MP4", "WMV", "AVI", "MOV", "MKV"],
  FileType.Video,
);
export const AudioFileType = new FileTypeInfo(
  "AUDIO File",
  ["MP3", "WAV", "AAC", "FLAC", "OGG"],
  FileType.Audio,
);

export const CompressedFileType = new FileTypeInfo(
  "Compressed File",
  ["zip", "7Z", "GZIP", "TAR"],
  FileType.Compressed,
);

export const FileTypeIconMapping = {
  [FileType.Folder]: FolderOutlinedIcon,
  [FileType.PDF]: PictureAsPdfOutlinedIcon,
  [FileType.Image]: ImageOutlinedIcon,
  [FileType.Font]: TextSnippetOutlinedIcon,
  [FileType.Application]: TextSnippetOutlinedIcon,
  [FileType.HTML]: HtmlOutlinedIcon,
  [FileType.JS]: JavascriptOutlinedIcon,
  [FileType.CSS]: CssOutlinedIcon,
  [FileType.Video]: VideoFileOutlinedIcon,
  [FileType.Audio]: AudioFileOutlinedIcon,
  [FileType.Compressed]: FolderZipOutlinedIcon,
  [FileType.Unknown]: TextSnippetOutlinedIcon,
  [FileType.Extension]: TextSnippetOutlinedIcon,
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
