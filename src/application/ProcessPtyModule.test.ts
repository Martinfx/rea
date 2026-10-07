import { describe, expect, it } from "vitest";

import { loadPtyModule } from "./ProcessPtyModule.js";

const ptyModule = (label: string) => ({ label, spawn: () => undefined });

describe("PTY backend selection", () => {
  it("prefers the prebuilt backend when it loads", async () => {
    const loaded = await loadPtyModule({
      prebuilt: () => Promise.resolve(ptyModule("prebuilt")),
      sourceBuilt: () => Promise.reject(new Error("must not be loaded")),
    });
    expect(loaded).toMatchObject({ label: "prebuilt" });
  });

  it("falls back to a source-built node-pty for hosts without prebuilts", async () => {
    const loaded = await loadPtyModule({
      prebuilt: () =>
        Promise.reject(
          new Error(
            "The @lydell/node-pty package currently does not support your platform: freebsd-x64",
          ),
        ),
      sourceBuilt: () => Promise.resolve(ptyModule("source")),
    });
    expect(loaded).toMatchObject({ label: "source" });
  });

  it("reports the prebuilt failure when no fallback is installed", async () => {
    const prebuiltFailure = new Error(
      "The @lydell/node-pty package currently does not support your platform: freebsd-x64",
    );
    await expect(
      loadPtyModule({
        prebuilt: () => Promise.reject(prebuiltFailure),
        sourceBuilt: () =>
          Promise.reject(
            Object.assign(new Error("Cannot find package 'node-pty'"), {
              code: "ERR_MODULE_NOT_FOUND",
            }),
          ),
      }),
    ).rejects.toBe(prebuiltFailure);
  });

  it("rejects a fallback module without a spawn function", async () => {
    const prebuiltFailure = new Error("no prebuilt binary");
    await expect(
      loadPtyModule({
        prebuilt: () => Promise.reject(prebuiltFailure),
        sourceBuilt: () => Promise.resolve({ spawn: "not a function" }),
      }),
    ).rejects.toBe(prebuiltFailure);
  });
});
