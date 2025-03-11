import {
  Coins,
  LayoutDashboard,
  BookDown,
  Users,
  LogOut,
  ChartLine,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  // SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router";
import { useDispatch } from "react-redux";
import { logout } from "@/loginSlice";
import { useState } from "react";
// import { ModeToggle } from "./mode-toggle";

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Inventory",
    url: "/inventory",
    icon: BookDown,
  },
  {
    title: "Sales",
    url: "/sales",
    icon: Coins,
  },
  {
    title: "Users",
    url: "/users",
    icon: Users,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: ChartLine,
  },
];

export function AppSidebar() {
  const [state, setState] = useState<"active" | "pending">("pending");
  const dispatch = useDispatch();

  const onLogout = () => {
    dispatch(logout());
  };
  function makePending() {
    setState("pending");
    return "";
  }

  function makeActive() {
    setState("active");
    return "";
  }

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup className="h-11/12">
          {/* <SidebarGroupLabel>Application</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={
                        ({ isActive, isPending }) =>
                          isPending
                            ? makePending() // Light gray for pending state
                            : isActive
                            ? makeActive() // White and bold for active state
                            : "text-gray-300" // Light gray for inactive state
                      }
                      end
                    >
                      <item.icon className={state == "active" ? "text-white font-medium" : "text-gray-400 font-medium"} />
                      <span className={state == "active" ? "text-white font-medium" : "text-gray-400 font-medium"}>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button onClick={onLogout}>
                    <LogOut />
                    <span>Logout</span>
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {/* <ModeToggle></ModeToggle> */}
    </Sidebar>
  );
}
