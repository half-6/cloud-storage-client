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

export class FileTypeInfo {
  protected _name: string;
  protected _extension: string[];
  protected _type: FileFormatType;
  constructor(name: string, extension: string[], type: FileFormatType) {
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
  get fileType(): FileFormatType {
    return this._type;
  }
  static getFileType(fileName: string) {
    const extension: string = getFileExtension(fileName);

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
      FileFormatType.Extension,
    );
  }
  static getFileTypeInfo(fileType: FileFormatType) {}
  toString(): string {
    return this.name;
  }
}

export const UnknownFileType = new FileTypeInfo(
  "Unknown File",
  [],
  FileFormatType.Unknown,
);
export const PDFFileType = new FileTypeInfo(
  "PDF File",
  ["PDF"],
  FileFormatType.PDF,
);
export const FolderFileType = new FileTypeInfo(
  "File Folder",
  [],
  FileFormatType.Folder,
);
export const ImageFileType = new FileTypeInfo(
  "Image File",
  ["JPG", "JPEG", "PNG", "BMP", "GIF", "SVG"],
  FileFormatType.Image,
);
export const FontFileType = new FileTypeInfo(
  "Font File",
  ["TTF", "OTF", "EOT", "WOFF", "WOFF2"],
  FileFormatType.Font,
);
export const ApplicationFileType = new FileTypeInfo(
  "Application",
  ["EXE"],
  FileFormatType.Application,
);
export const HTMLFileType = new FileTypeInfo(
  "HTML File",
  ["html"],
  FileFormatType.HTML,
);
export const JSFileType = new FileTypeInfo(
  "JS File",
  ["JS", "TS"],
  FileFormatType.JS,
);
export const CSSFileType = new FileTypeInfo(
  "CSS File",
  ["CSS"],
  FileFormatType.CSS,
);
export const VideoFileType = new FileTypeInfo(
  "VIDEO File",
  ["MP4", "WMV", "AVI", "MOV", "MKV"],
  FileFormatType.Video,
);
export const AudioFileType = new FileTypeInfo(
  "AUDIO File",
  ["MP3", "WAV", "AAC", "FLAC", "OGG"],
  FileFormatType.Audio,
);

export const CompressedFileType = new FileTypeInfo(
  "Compressed File",
  ["zip", "7Z", "GZIP", "TAR"],
  FileFormatType.Compressed,
);

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
