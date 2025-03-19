import { Routes, Route } from "react-router";
import "./App.css";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/dashboard";
import Inventory from "./pages/inventory";
import Reports from "./pages/reports";
import { Sales } from "./pages/sales";
import Users from "./pages/users";
import Login from "./pages/login";
function App() {

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
