# Fast Testing Guide using Bun

This guide explains how to use Bun to quickly test your Tauri application, bypassing the full production build process.

## The Shortcut: `bun run tauri dev`

The fastest way to test changes is to run the application in development mode.

```bash
bun run tauri dev
```

Or, if you have the helper script:

```bash
./fast-test.sh
```

## Why is this faster?

Running `tauri dev` skips several time-consuming steps required for a final release:

1.  **No Frontend Bundling**: deeply optimizes build time. Instead of minimizing and bundling all JavaScript/CSS (which takes time), Vite acts as a dev server, serving files on-demand.
2.  **Incremental Compilation**: Rust only recompiles files you've changed, rather than the entire backend.
3.  **Hot Module Replacement (HMR)**: Changes to your frontend code (React, TSX, CSS) are reflected **instantly** in the running app without restarting it.
4.  **No Code Signing/Packaging**: Skips the creation of `.deb`, `.dmg`, or `.msi` installers.

## Workflow

1.  **Start the Dev Server**: Run `bun run tauri dev`.
2.  **Wait for Build**: The first run will compile the Rust backend. Subsequent runs will be near-instant if you only change frontend code.
3.  **Make Changes**:
    - **Frontend**: Edit `.tsx` or `.ts` files. The app window will auto-update.
    - **Backend**: Edit `.rs` files. The app will automatically rebuild and restart.
4.  **Debug**: Use `Ctrl + Shift + I` (or `Cmd + Option + I` on Mac) in the app window to open the Web Inspector for console logs.

## Troubleshooting

- **"Command not found"**: Ensure Bun is installed and in your PATH.
- **Rust Errors**: If the backend fails to build, check the terminal output for Rust compiler errors.
- **Stuck Build**: If the build seems stuck, try `cargo clean` in the `src-tauri` directory (note: this will make the next build slower).
