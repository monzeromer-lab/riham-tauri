import { useSelector } from "react-redux";
import { SidebarProvider, SidebarTrigger } from "../ui/sidebar";
import { AppSidebar } from "./AppSideBar";
import { LoginState } from "@/loginSlice";
// import { info } from "@tauri-apps/plugin-log";
import { Outlet, useNavigate } from "react-router";
import { useEffect } from "react";

export default function Layout() {
  const isLoggedIn = useSelector(
    (state: { login: LoginState }) => state.login.isLoggedIn
  );
  const navigate = useNavigate();
  console.log(isLoggedIn);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen">
        {isLoggedIn && <AppSidebar />}
        <main className="flex flex-row w-full h-full overflow-auto p-4">
          {" "}
          {/* Takes remaining width */}
          {isLoggedIn && <SidebarTrigger />}
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
