import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
import { ThemeProvider } from "next-themes";
import { Provider } from "react-redux";
import { store } from "./store";
import { Toaster } from "sonner";
// import Database from '@tauri-apps/plugin-sql';
// when using `"withGlobalTauri": true`, you may use
// const Database = window.__TAURI__.sql;

// const db = await Database.load('sqlite:test.db');
// db.execute("CREATE TABLE IF NOT EXISTS inventory ( id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, type TEXT NOT NULL, color TEXT NOT NULL, size INTEGER NOT NULL, quantity INTEGER NOT NULL, price INTEGER NOT NULL);");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <Provider store={store}>
          <App />
          <Toaster />
        </Provider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
