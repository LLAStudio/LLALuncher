use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InstalledVersion {
    pub version: String,
    pub path: String,
    pub installed_at: String,
    pub size: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct AppInstallState {
    pub installed_versions: Vec<InstalledVersion>,
    pub active_version: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct InstallDb {
    pub apps: HashMap<String, AppInstallState>,
}

fn get_db_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data dir: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create app data dir: {e}"))?;
    Ok(dir.join("installs.json"))
}

fn read_db(app: &AppHandle) -> Result<InstallDb, String> {
    let path = get_db_path(app)?;
    if !path.exists() {
        return Ok(InstallDb::default());
    }
    let data = fs::read_to_string(&path).map_err(|e| format!("Failed to read install db: {e}"))?;
    serde_json::from_str(&data).map_err(|e| format!("Failed to parse install db: {e}"))
}

fn write_db(app: &AppHandle, db: &InstallDb) -> Result<(), String> {
    let path = get_db_path(app)?;
    let data = serde_json::to_string_pretty(db).map_err(|e| format!("Failed to serialize db: {e}"))?;
    fs::write(path, data).map_err(|e| format!("Failed to write install db: {e}"))
}

fn installs_root(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data dir: {e}"))?
        .join("apps");
    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create installs dir: {e}"))?;
    Ok(dir)
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DownloadProgress {
    app_id: String,
    version: String,
    downloaded: u64,
    total: Option<u64>,
    percent: Option<f64>,
    done: bool,
    path: Option<String>,
    error: Option<String>,
}

#[tauri::command]
fn get_install_state(app: AppHandle, app_id: String) -> Result<AppInstallState, String> {
    let db = read_db(&app)?;
    Ok(db.apps.get(&app_id).cloned().unwrap_or_default())
}

#[tauri::command]
fn get_all_install_states(app: AppHandle) -> Result<HashMap<String, AppInstallState>, String> {
    let db = read_db(&app)?;
    Ok(db.apps)
}

#[tauri::command]
fn set_active_version(app: AppHandle, app_id: String, version: String) -> Result<AppInstallState, String> {
    let mut db = read_db(&app)?;
    let state = db.apps.entry(app_id).or_default();
    if !state.installed_versions.iter().any(|v| v.version == version) {
        return Err("Version not installed".into());
    }
    state.active_version = Some(version);
    let result = state.clone();
    write_db(&app, &db)?;
    Ok(result)
}

#[tauri::command]
fn open_external(url: String) -> Result<(), String> {
    open::that_detached(&url).map_err(|e| format!("Failed to open URL: {e}"))
}

#[tauri::command]
fn open_path(path: String) -> Result<(), String> {
    open::that_detached(&path).map_err(|e| format!("Failed to open path: {e}"))
}

#[tauri::command]
async fn launch_app(app: AppHandle, app_id: String, version: Option<String>) -> Result<(), String> {
    let db = read_db(&app)?;
    let state = db.apps.get(&app_id).ok_or("App not installed")?;
    let ver = version
        .or_else(|| state.active_version.clone())
        .ok_or("No active version selected")?;
    let installed = state
        .installed_versions
        .iter()
        .find(|v| v.version == ver)
        .ok_or("Requested version not found")?;
    open::that_detached(&installed.path).map_err(|e| format!("Failed to launch app: {e}"))
}

#[tauri::command]
fn uninstall_version(app: AppHandle, app_id: String, version: String) -> Result<AppInstallState, String> {
    let mut db = read_db(&app)?;
    let state = db.apps.entry(app_id.clone()).or_default();
    if let Some(iv) = state.installed_versions.iter().find(|v| v.version == version).cloned() {
        let p = Path::new(&iv.path);
        if p.exists() {
            if p.is_dir() {
                let _ = fs::remove_dir_all(p);
            } else {
                let _ = fs::remove_file(p);
            }
        }
        // also try removing parent version folder if empty-ish
        if let Some(parent) = p.parent() {
            let _ = fs::remove_dir(parent);
        }
    }
    state.installed_versions.retain(|v| v.version != version);
    if state.active_version.as_deref() == Some(version.as_str()) {
        state.active_version = state.installed_versions.last().map(|v| v.version.clone());
    }
    let result = state.clone();
    write_db(&app, &db)?;
    Ok(result)
}

#[tauri::command]
async fn download_and_install(
    app: AppHandle,
    app_id: String,
    version: String,
    url: String,
    file_name: String,
) -> Result<AppInstallState, String> {
    let root = installs_root(&app)?;
    let target_dir = root.join(&app_id).join(&version);
    fs::create_dir_all(&target_dir).map_err(|e| format!("Failed to create install dir: {e}"))?;
    let target_path = target_dir.join(&file_name);

    let client = reqwest::Client::builder()
        .user_agent("LLAStudio-Launcher/0.1")
        .build()
        .map_err(|e| format!("HTTP client error: {e}"))?;

    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Download request failed: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!("Download failed with status {}", resp.status()));
    }

    let total = resp.content_length();
    let mut stream = resp.bytes_stream();
    let mut file = fs::File::create(&target_path).map_err(|e| format!("Failed to create file: {e}"))?;
    let mut downloaded: u64 = 0;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Stream error: {e}"))?;
        file.write_all(&chunk).map_err(|e| format!("Write error: {e}"))?;
        downloaded += chunk.len() as u64;
        let percent = total.map(|t| (downloaded as f64 / t as f64) * 100.0);
        let _ = app.emit(
            "download-progress",
            DownloadProgress {
                app_id: app_id.clone(),
                version: version.clone(),
                downloaded,
                total,
                percent,
                done: false,
                path: None,
                error: None,
            },
        );
    }

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        if file_name.ends_with(".AppImage") || !file_name.contains('.') {
            let _ = fs::set_permissions(&target_path, fs::Permissions::from_mode(0o755));
        }
    }

    let mut db = read_db(&app)?;
    let state = db.apps.entry(app_id.clone()).or_default();
    state.installed_versions.retain(|v| v.version != version);
    state.installed_versions.push(InstalledVersion {
        version: version.clone(),
        path: target_path.to_string_lossy().to_string(),
        installed_at: chrono::Utc::now().to_rfc3339(),
        size: Some(downloaded),
    });
    state.installed_versions.sort_by(|a, b| a.installed_at.cmp(&b.installed_at));
    state.active_version = Some(version.clone());
    let result = state.clone();
    write_db(&app, &db)?;

    let _ = app.emit(
        "download-progress",
        DownloadProgress {
            app_id,
            version,
            downloaded,
            total,
            percent: Some(100.0),
            done: true,
            path: Some(target_path.to_string_lossy().to_string()),
            error: None,
        },
    );

    Ok(result)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            get_install_state,
            get_all_install_states,
            set_active_version,
            open_external,
            open_path,
            launch_app,
            uninstall_version,
            download_and_install
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
