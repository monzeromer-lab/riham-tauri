import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { login, LoginState } from "@/loginSlice";
import Database from "@tauri-apps/plugin-sql";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  password: z.string(),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const isLoggedIn = useSelector((state: { login: LoginState }) => state.login.isLoggedIn);

  // Check for admin user on component mount
  useEffect(() => {
    checkForAdminUser();
  }, []);

  // Move navigation logic to useEffect
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/dashboard");
    }
  }, [isLoggedIn, navigate]);

  // Function to check if admin user exists and create if not
  const checkForAdminUser = async () => {
    try {
      const db = await Database.load("sqlite:riham.db");
      
      // Check if users table exists
      const tableCheck = await db.select(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
      );
      
      if ((tableCheck as { name: string }[]).length === 0) {
        // Create users table if it doesn't exist
        await db.execute(
          "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)"
        );
      }
      
      // Check if admin user exists
      const adminCheck = await db.select(
        "SELECT username FROM users WHERE username = 'admin'"
      );
      
      if ((adminCheck as { username: string }[]).length === 0) {
        // Create admin user if it doesn't exist
        await db.execute(
          "INSERT INTO users (username, password) VALUES ('admin', 'admin')"
        );
        console.log("Admin user created successfully");
      }
    } catch (error) {
      console.error("Error checking/creating admin user:", error);
    }
  };

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      const db = await Database.load("sqlite:riham.db");
      
      const users = await db.select<{username: string, password: string}[]>(
        `SELECT username, password FROM users WHERE username = $1`, 
        [data.username]
      );
      
      if (users.length === 0) {
        toast.error("Invalid username or password");
        setIsLoading(false);
        return;
      }
      
      const user = users[0];
      if (user.username === data.username && user.password === data.password) {
        toast.success("Login successful");
        dispatch(login());
        navigate("/dashboard");
      } else {
        toast.error("Invalid username or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-900 p-6">
      <Card className="w-full max-w-sm shadow-lg rounded-lg bg-gray-800 border-0 animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-2xl font-semibold text-white">
            Riham App Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your username"
                        {...field}
                        className="border-gray-600 bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                        className="border-gray-600 bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}