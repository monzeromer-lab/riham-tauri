use tauri_plugin_sql::{MigrationKind, Migration};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        // Create initial tables
        Migration {
            version: 2,
            description: "create_initial_tables",
            sql: "
            CREATE TABLE IF NOT EXISTS inventory (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                type TEXT NOT NULL,
                color TEXT NOT NULL,
                size INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                price INTEGER NOT NULL
            );
    
            CREATE TABLE IF NOT EXISTS sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                name TEXT NOT NULL,
                phone TEXT NOT NULL UNIQUE,
                address TEXT NOT NULL,
                type TEXT NOT NULL,
                color TEXT NOT NULL,
                size TEXT NOT NULL,
                quantity INTEGER NOT NULL
            );
    
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL
            );
    
            INSERT INTO users (username, password)
            SELECT 'admin', 'admin'
            WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');
            ",
            kind: MigrationKind::Up,
        }
    ];
    

    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:grad.db", migrations)
        .build())
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
