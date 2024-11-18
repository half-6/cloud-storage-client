//due to no main exports for file-type in package.js
//I have to copy whole library under ./file-type folder.
import { fileTypeFromBuffer, fileTypeFromStream } from "./file-type";

export async function getFileMime(byteArray: Uint8Array | ArrayBuffer) {
  const type = await fileTypeFromBuffer(byteArray);
  if (type) {
    return {
      body: null,
      mime: type.mime,
    };
  } else {
    const body = Buffer.from(byteArray).toString("utf-8");
    if (!body.includes("\ufffd")) {
      return {
        body,
        mime: "text/plain",
      };
    } else {
      return null;
    }
  }
}

export async function getFileMimeFromStream(stream: ReadableStream) {
  const type = await fileTypeFromStream(stream);
  if (type) {
    return {
      body: null,
      mime: type.mime,
    };
  } else {
    return {
      body: stream,
      mime: "text/plain",
    };
  }
}
