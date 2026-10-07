# FreeBSD

REA's CLI and MCP server run on FreeBSD x64 and arm64 with a supported Node.js
runtime. FreeBSD support has no real-provider verification yet; the checks below
describe what REA admits, not a verified lane.

## Install

```sh
pkg install node24 npm-node24
npm install --global rea-agents
rea doctor --json
rea setup
```

`rea setup` registers REA with supported agents using the same XDG
configuration locations as Linux. Hopper has no FreeBSD build, so setup never
offers to install it and `rea doctor` reports Hopper as missing.

## Ghidra

Install Ghidra and a JDK from ports or packages, then point REA at the
installation:

```sh
pkg install ghidra
export GHIDRA_INSTALL_DIR=/usr/local/share/ghidra
export JAVA_HOME=/usr/local/openjdk21
rea doctor --json
```

Official Ghidra release archives contain no FreeBSD native components. REA
therefore requires an executable decompiler at
`Ghidra/Features/Decompiler/os/freebsd_x86_64/decompile` (x64) or
`Ghidra/Features/Decompiler/os/freebsd_arm_64/decompile` (arm64), such as the
one the `devel/ghidra` port builds. REA does not build native components.

REA accepts Ghidra 12.1.x. If the packaged Ghidra is an older release line,
`rea doctor` rejects it with the observed version; install a 12.1.x build with
FreeBSD native components instead.

## Process capture

Process capture uses a pseudo-terminal. `@lydell/node-pty` publishes no
FreeBSD binary, so REA falls back to the upstream `node-pty` package, which
compiles from source. Install it where REA resolves its dependencies:

```sh
pkg install python3 gmake
cd "$(npm root --global)/rea-agents"
npm install --no-save node-pty
```

Without it, `capture_process_scenario` reports that no native PTY binary exists
for this host; other tools are unaffected. Process-tree sampling and
owned-process cleanup use FreeBSD `ps`.

## Other providers

- Browser and Electron tools accept a caller-supplied Chromium executable, such
  as `/usr/local/bin/chrome` from `www/chromium`.
- Android analysis accepts an explicit `REA_JADX_MCP_JAR` and JDK.
- Firmware extraction and Wakaru recovery depend on Linux sandboxing and remain
  unavailable on FreeBSD.
- Static JavaScript, artifact, and managed-code analysis need no native engine.
