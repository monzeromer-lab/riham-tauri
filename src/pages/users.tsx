import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import Database from "@tauri-apps/plugin-sql";
import { toast } from "sonner";

interface User {
  id: number;
  username: string;
  password?: string; // Make password optional since we might not want to display it
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Create an async function inside useEffect
    const initializeAndFetchUsers = async () => {
      try {
        setIsLoading(true);
        const db = await Database.load("sqlite:riham.db");
        
        // Check if users table exists
        const tableCheck = await db.select(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
        );
        
        // Create table if it doesn't exist
        if ((tableCheck as any[]).length === 0) {
          await db.execute(`
            CREATE TABLE users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT UNIQUE NOT NULL,
              password TEXT NOT NULL
            )
          `);
          console.log("Users table created successfully");
          
          // Create default admin user
          await db.execute(
            "INSERT INTO users (username, password) VALUES ('admin', 'admin')"
          );
          console.log("Default admin user created");
          toast("Users database initialized with admin account");
        }
        
        // Fetch users
        const system_users: User[] = await db.select(`SELECT id, username, password FROM users`);
        setUsers(system_users);
      } catch (error) {
        console.error("Failed to initialize/fetch users:", error);
        toast("Failed to load users data");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAndFetchUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password) return;

    try {
      const db = await Database.load("sqlite:riham.db");
      
      // Insert the new user into the database
      const result = await db.execute(
        "INSERT INTO users (username, password) VALUES ($1, $2)",
        [formData.username, formData.password]
      );
      
      // Get the ID of the newly inserted user
      const newUserId = result.lastInsertId;
      
      // Add the new user to the state
      const newUser: User = {
        id: newUserId as number,
        username: formData.username,
      };
      
      setUsers([...users, newUser]);
      setFormData({ username: "", password: "" });
      toast("User created successfully");
    } catch (error) {
      console.error("Failed to create user:", error);
      toast("Failed to create user. Username may already exist.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const db = await Database.load("sqlite:riham.db");
      
      // Delete the user from the database
      await db.execute("DELETE FROM users WHERE id = $1", [id]);
      
      // Remove the user from the state
      setUsers(users.filter((user) => user.id !== id));
      toast("User deleted successfully");
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast("Failed to delete user");
    }
  };

  return (
    <div className="w-full h-full mx-auto space-y-4">
      <Card className="w-80">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-2">
            <Label htmlFor="username">Username: </Label>
            <Input
              id="username"
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <Label htmlFor="password">Password: </Label>

            <Input
              id="password"
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <Button type="submit" className="w-full">
              Create
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-center text-white">Loading users...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(user.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}