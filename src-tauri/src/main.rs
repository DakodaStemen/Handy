// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(target_os = "linux")]
    {
        // Force X11 backend to allow global shortcuts (rdev) and input simulation (enigo) to work on Wayland
        std::env::set_var("GDK_BACKEND", "x11");

        if std::path::Path::new("/dev/dri").exists()
            && std::env::var("WAYLAND_DISPLAY").is_err()
            && std::env::var("XDG_SESSION_TYPE").unwrap_or_default() == "x11"
        {
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }
    }

    handy_app_lib::run()
}
