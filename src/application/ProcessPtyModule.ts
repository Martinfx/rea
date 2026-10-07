/** Native PTY module surface shared by the prebuilt and source-built backends. */
export type PtyModule = typeof import("@lydell/node-pty");

/**
 * Source-built upstream package with the same API. It covers hosts such as
 * FreeBSD for which `@lydell/node-pty` publishes no prebuilt binary.
 */
const SOURCE_BUILT_PTY_MODULE = "node-pty";

const isPtyModule = (value: unknown): value is PtyModule =>
  typeof value === "object" &&
  value !== null &&
  "spawn" in value &&
  typeof value.spawn === "function";

/** Dependencies that make PTY backend selection testable without native code. */
export interface PtyModuleLoaders {
  readonly prebuilt?: () => Promise<unknown>;
  readonly sourceBuilt?: () => Promise<unknown>;
}

/**
 * Load the prebuilt PTY backend, falling back to a source-built `node-pty`
 * installation when no prebuilt binary matches this host.
 *
 * The prebuilt loader's failure is preserved when the fallback is absent, so
 * callers still report the original missing-binary diagnostic.
 */
export const loadPtyModule = async (
  loaders: PtyModuleLoaders = {},
): Promise<PtyModule> => {
  const prebuilt = loaders.prebuilt ?? (() => import("@lydell/node-pty"));
  const sourceBuilt =
    loaders.sourceBuilt ?? (() => import(SOURCE_BUILT_PTY_MODULE));
  let prebuiltFailure: unknown;
  try {
    const loaded = await prebuilt();
    if (isPtyModule(loaded)) return loaded;
    prebuiltFailure = new TypeError(
      "@lydell/node-pty did not export a spawn function",
    );
  } catch (cause: unknown) {
    prebuiltFailure = cause;
  }
  let fallback: unknown;
  try {
    fallback = await sourceBuilt();
  } catch (cause: unknown) {
    // The source-built fallback is optional; report the prebuilt failure.
    void cause;
    throw prebuiltFailure;
  }
  if (isPtyModule(fallback)) return fallback;
  throw prebuiltFailure;
};
