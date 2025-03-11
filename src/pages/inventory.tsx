import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Database from "@tauri-apps/plugin-sql";
import { toast } from "sonner";

export interface InventoryRecord {
  id?: number;
  type: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
}

const formSchema = z.object({
  type: z.string().min(2, {
    message: "Type must be at least 2 characters.",
  }),
  color: z.string().min(2, {
    message: "Color must be at least 2 characters.",
  }),
  size: z.string().min(1, {
    message: "Size must be at least 1 character.",
  }),
  quantity: z.coerce.number().min(1, {
    message: "Quantity must be at least 1.",
  }),
  price: z.coerce.number().min(1, {
    message: "Price must be at least 1.",
  }),
});

// Sample inventory data for seeding
const sampleInventory = [
  { type: "T-Shirt", color: "Black", size: "M", quantity: 25, price: 19.99 },
  { type: "T-Shirt", color: "White", size: "L", quantity: 30, price: 19.99 },
  { type: "Jeans", color: "Blue", size: "32", quantity: 15, price: 49.99 },
  { type: "Hoodie", color: "Gray", size: "XL", quantity: 10, price: 39.99 },
  { type: "Dress", color: "Red", size: "S", quantity: 8, price: 59.99 },
  { type: "Jacket", color: "Brown", size: "M", quantity: 5, price: 89.99 },
];

export function Inventory() {
  const [data, setData] = useState<InventoryRecord[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "",
      color: "",
      size: "",
      quantity: 1,
      price: 1,
    },
  });

  // Initialize database and fetch inventory data
  useEffect(() => {
    const initializeAndFetchInventory = async () => {
      try {
        setIsLoading(true);
        const db = await Database.load("sqlite:riham.db");
        
        // Check if inventory table exists
        const tableCheck = await db.select(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='inventory'"
        );
        
        // Create table if it doesn't exist
        if ((tableCheck as { name: string }[]).length === 0) {
          await db.execute(`
            CREATE TABLE inventory (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              type TEXT NOT NULL,
              color TEXT NOT NULL,
              size TEXT NOT NULL,
              quantity INTEGER NOT NULL,
              price REAL NOT NULL
            )
          `);
          console.log("Inventory table created successfully");
        }
        
        // Fetch inventory data
        const result = await db.select<InventoryRecord[]>("SELECT * FROM inventory");
        
        // Seed with sample data if empty
        if (result.length === 0) {
          console.log("Seeding inventory with sample data");
          
          for (const item of sampleInventory) {
            await db.execute(
              "INSERT INTO inventory (type, color, size, quantity, price) VALUES ($1, $2, $3, $4, $5)",
              [item.type, item.color, item.size, item.quantity, item.price]
            );
          }
          
          // Fetch the seeded data
          const seededData = await db.select<InventoryRecord[]>("SELECT * FROM inventory");
          setData(seededData);
          toast("Inventory initialized with sample data");
        } else {
          setData(result);
        }
      } catch (error) {
        console.error("Failed to initialize/fetch inventory:", error);
        toast("Failed to load inventory data");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAndFetchInventory();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const db = await Database.load("sqlite:riham.db");
      
      if (editingId !== null) {
        // Update existing item
        await db.execute(
          "UPDATE inventory SET type = $1, color = $2, size = $3, quantity = $4, price = $5 WHERE id = $6",
          [values.type, values.color, values.size, values.quantity, values.price, editingId]
        );
        
        setData(prevData => 
          prevData.map(item => 
            item.id === editingId ? { ...values, id: editingId } : item
          )
        );
        
        toast("Inventory item updated successfully");
      } else {
        // Add new item
        const result = await db.execute(
          "INSERT INTO inventory (type, color, size, quantity, price) VALUES ($1, $2, $3, $4, $5)",
          [values.type, values.color, values.size, values.quantity, values.price]
        );
        
        const newId = result.lastInsertId;
        setData(prevData => [...prevData, { ...values, id: newId as number }]);
        
        toast("New inventory item added successfully");
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error("Database operation failed:", error);
      toast("Failed to save inventory item");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const db = await Database.load("sqlite:riham.db");
      await db.execute("DELETE FROM inventory WHERE id = $1", [id]);
      setData(prevData => prevData.filter(item => item.id !== id));
      toast("Item deleted successfully");
    } catch (error) {
      console.error("Failed to delete item:", error);
      toast("Failed to delete item");
    }
  };

  const handleEdit = (item: InventoryRecord) => {
    if (item.id) {
      setEditingId(item.id);
      setIsDialogOpen(true);
      form.reset(item);
    }
  };

  const handleOpenDialog = () => {
    setEditingId(null);
    setIsDialogOpen(true);
    form.reset({
      type: "",
      color: "",
      size: "",
      quantity: 1,
      price: 1,
    });
  };

  const handleCloseDialog = () => {
    setEditingId(null);
    setIsDialogOpen(false);
    form.reset();
  };

  return (
    <div className="w-full h-full max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Inventory</h2>
        <Button variant="outline" className="text-white" onClick={handleOpenDialog}>
          Add New Item
        </Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8 text-white">Loading inventory data...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-8 text-white">No inventory items found. Add some items to get started.</div>
      ) : (
        <Table className="text-white border">
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Type</TableHead>
              <TableHead className="text-white">Color</TableHead>
              <TableHead className="text-white">Size</TableHead>
              <TableHead className="text-white">Quantity</TableHead>
              <TableHead className="text-white">Price</TableHead>
              <TableHead className="text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="text-white">{item.type}</TableCell>
                <TableCell className="text-white">{item.color}</TableCell>
                <TableCell className="text-white">{item.size}</TableCell>
                <TableCell className="text-white">{item.quantity}</TableCell>
                <TableCell className="text-white">${item.price}</TableCell>
                <TableCell className="text-white">
                  <div className="flex space-x-2">
                    <Button variant="ghost" className="text-white" size="sm" onClick={() => handleEdit(item)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => item.id && handleDelete(item.id)}>
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">{editingId !== null ? "Edit Item" : "Add New Item"}</DialogTitle>
            <DialogDescription className="text-white">
              {editingId !== null ? "Modify the item details." : "Enter the new item details."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {['type', 'color', 'size', 'quantity', 'price'].map((field) => (
                <FormField
                  key={field}
                  control={form.control}
                  name={field as "type" | "color" | "size" | "quantity" | "price"}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">{field.name.charAt(0).toUpperCase() + field.name.slice(1)}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="text-white" 
                          placeholder={field.name === 'quantity' ? '10' : field.name === 'price' ? '100' : ''} 
                          type={field.name === 'quantity' || field.name === 'price' ? 'number' : 'text'} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <DialogFooter className="sm:justify-start">
                <Button type="submit" className="text-white">
                  {editingId !== null ? "Update" : "Add"}
                </Button>
                <DialogClose asChild>
                  <Button type="button" variant="secondary" className="text-white" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Inventory;