import { Routes, Route } from "react-router";
import "./App.css";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/dashboard";
import Inventory from "./pages/inventory";
import Reports from "./pages/reports";
import { Sales } from "./pages/sales";
import Users from "./pages/users";
import Login from "./pages/login";
// import Database from "@tauri-apps/plugin-sql";
import { useEffect } from "react";
// import { info } from "@tauri-apps/plugin-log";
function App() {
  useEffect(() => {
    async function initDB() {
      try {
        //   const db = await Database.load("sqlite:grad.db");
        //   const user: { username: string; password: string }[] = await db.select(
        //     `SELECT username, password FROM users WHERE username = $1`,
        //     ["admin"]
        //   );
        //   info(`found ${user[0].username}::${user[0].password}`);
        //   info(`found result ${JSON.stringify(user)}`);
      } catch (error) {
        console.error("Database initialization failed:", error);
      }
    }

    initDB();
  }, []); // Run only once on component mount

  return (
    <main className="w-full h-full flex flex-row">
      <Routes>
        <Route path="/login" index element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/users" element={<Users />} />
        </Route>
      </Routes>
    </main>
  );
}

export default App;
