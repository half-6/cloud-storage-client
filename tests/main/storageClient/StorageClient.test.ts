import { buildCloudPath } from "../../../main/storageClient/Util";
import { describe, expect, test } from "@jest/globals";

describe("StorageClient tests", () => {
  test("buildCloudPath tests", () => {
    let path = "";
    path = buildCloudPath("abc\\", "test\\b\\a.jpg");
    expect(path).toBe("abc/test/b/a.jpg");

    path = buildCloudPath("abc\\", "test\\b\\a\\");
    expect(path).toBe("abc/test/b/a/");

    path = buildCloudPath("abc/", "test/b/a.jpg");
    expect(path).toBe("abc/test/b/a.jpg");

    path = buildCloudPath("abc/", "test/b/a/");
    expect(path).toBe("abc/test/b/a/");

    path = buildCloudPath("abc/", "test\\b\\a.jpg");
    expect(path).toBe("abc/test/b/a.jpg");

    path = buildCloudPath("abc/", "test\\b\\a\\");
    expect(path).toBe("abc/test/b/a/");

    path = buildCloudPath("abc\\", "test/b/a.jpg");
    expect(path).toBe("abc/test/b/a.jpg");

    path = buildCloudPath("abc\\", "test/b/a/");
    expect(path).toBe("abc/test/b/a/");
  });
});
