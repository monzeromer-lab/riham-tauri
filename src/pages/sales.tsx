import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Database from "@tauri-apps/plugin-sql";
import { toast } from "sonner";

interface InventoryItem {
  id: number;
  type: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
}

interface SaleFormData {
  name: string;
  phone: string;
  address: string;
  type: string;
  color: string;
  size: string;
  quantity: number;
  total: number;
}

export const Sales = () => {
  const [formData, setFormData] = useState<SaleFormData>({
    name: "",
    phone: "",
    address: "",
    type: "",
    color: "",
    size: "",
    quantity: 1,
    total: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Available options based on current selections
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [maxQuantity, setMaxQuantity] = useState(0);
  const [itemPrice, setItemPrice] = useState(0);

  // Initialize database and fetch inventory data
  useEffect(() => {
    const initializeAndFetchData = async () => {
      try {
        setLoading(true);
        const db = await Database.load("sqlite:riham.db");
        
        // Check if sales table exists
        const tableCheck = await db.select(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='sales'"
        );
        
        // Create sales table if it doesn't exist
        if ((tableCheck as any[]).length === 0) {
          await db.execute(`
            CREATE TABLE sales (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              phone TEXT NOT NULL,
              address TEXT NOT NULL,
              type TEXT NOT NULL,
              color TEXT NOT NULL,
              size TEXT NOT NULL,
              quantity INTEGER NOT NULL,
              date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          console.log("Sales table created successfully");
        }
        
        // Fetch inventory data
        const result = await db.select<InventoryItem[]>("SELECT * FROM inventory");
        setInventory(result);
        
        // Set available types
        const types = [...new Set(result.map(item => item.type))];
        setAvailableTypes(types);
      } catch (error) {
        console.error("Failed to initialize/fetch data:", error);
        toast("Failed to load inventory data");
      } finally {
        setLoading(false);
      }
    };

    initializeAndFetchData();
  }, []);

  // Update available colors when type changes
  useEffect(() => {
    if (formData.type) {
      const filteredItems = inventory.filter(item => item.type === formData.type);
      const colors = [...new Set(filteredItems.map(item => item.color))];
      setAvailableColors(colors);
      
      // Reset color and size when type changes
      setFormData(prev => ({
        ...prev,
        color: "",
        size: "",
        quantity: 1,
        total: 0
      }));
    }
  }, [formData.type, inventory]);

  // Update available sizes when color changes
  useEffect(() => {
    if (formData.type && formData.color) {
      const filteredItems = inventory.filter(
        item => item.type === formData.type && item.color === formData.color
      );
      const sizes = [...new Set(filteredItems.map(item => item.size))];
      setAvailableSizes(sizes);
      
      // Reset size when color changes
      setFormData(prev => ({
        ...prev,
        size: "",
        quantity: 1,
        total: 0
      }));
    }
  }, [formData.color, formData.type, inventory]);

  // Update max quantity and price when size changes
  useEffect(() => {
    if (formData.type && formData.color && formData.size) {
      const selectedItem = inventory.find(
        item => 
          item.type === formData.type && 
          item.color === formData.color &&
          item.size === formData.size
      );
      
      if (selectedItem) {
        setMaxQuantity(selectedItem.quantity);
        setItemPrice(selectedItem.price);
        
        // Reset quantity when size changes
        setFormData(prev => ({
          ...prev,
          quantity: 1,
          total: selectedItem.price
        }));
      }
    }
  }, [formData.size, formData.color, formData.type, inventory]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleSelectChange = (value: string, field: keyof SaleFormData) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = parseInt(e.target.value) || 0;
    // Calculate total based on selected item price
    const total = quantity * itemPrice;
    setFormData({ ...formData, quantity, total });
  };

  const handleSubmit = async () => {
    // Basic validation
    if (
      !formData.name ||
      !formData.phone ||
      !formData.address ||
      !formData.type ||
      !formData.color ||
      !formData.size ||
      formData.quantity <= 0 ||
      formData.quantity > maxQuantity
    ) {
      toast("Please fill in all required fields with valid values");
      return;
    }

    setIsSubmitting(true);

    try {
      const db = await Database.load("sqlite:riham.db");
      
      // Start a transaction
      await db.execute("BEGIN TRANSACTION");

      // Insert the sale record
      await db.execute(
        `INSERT INTO sales (name, phone, address, type, color, size, quantity) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          formData.name,
          formData.phone,
          formData.address,
          formData.type,
          formData.color,
          formData.size,
          formData.quantity,
        ]
      );

      // Update the inventory quantity
      await db.execute(
        `UPDATE inventory SET quantity = quantity - $1 
         WHERE type = $2 AND color = $3 AND size = $4`,
        [formData.quantity, formData.type, formData.color, formData.size]
      );

      // Commit the transaction
      await db.execute("COMMIT");

      toast("Sale has been recorded successfully");

      // Reset form after successful submission
      setFormData({
        name: "",
        phone: "",
        address: "",
        type: "",
        color: "",
        size: "",
        quantity: 1,
        total: 0,
      });
      
      // Refresh inventory data
      const result = await db.select<InventoryItem[]>("SELECT * FROM inventory");
      setInventory(result);
      
    } catch (error) {
      console.error("Error saving sale:", error);
      // Rollback the transaction in case of error
      try {
        const db = await Database.load("sqlite:riham.db");
        await db.execute("ROLLBACK");
      } catch (rollbackError) {
        console.error("Error rolling back transaction:", rollbackError);
      }
      toast("Failed to save sale. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full">
      <h1 className="text-white text-2xl font-bold mb-4">New Sale</h1>
      <div className="p-6 bg-gray-800 rounded-lg shadow-md">
        <div className="mb-4 flex flex-row items-center gap-2">
          <Label htmlFor="name" className="text-white w-24">
            Name:
          </Label>
          <Input
            type="text"
            id="name"
            placeholder="Customer name"
            className="text-white"
            value={formData.name}
            onChange={handleInputChange}
          />
        </div>
        <div className="mb-4 flex flex-row items-center gap-2">
          <Label htmlFor="phone" className="text-white w-24">
            Phone:
          </Label>
          <Input
            type="tel"
            id="phone"
            placeholder="Customer phone number"
            className="text-white"
            value={formData.phone}
            onChange={handleInputChange}
          />
        </div>
        <div className="mb-4 flex flex-row items-center gap-2">
          <Label htmlFor="address" className="text-white w-24">
            Address:
          </Label>
          <Input
            type="text"
            id="address"
            placeholder="Customer address"
            className="text-white"
            value={formData.address}
            onChange={handleInputChange}
          />
        </div>

        {loading ? (
          <div className="text-center py-4 text-white">Loading inventory data...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex flex-row items-center gap-2">
                <Label className="text-white w-24">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange(value, "type")}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-row items-center gap-2">
                <Label className="text-white w-24">Color</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => handleSelectChange(value, "color")}
                  disabled={!formData.type}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Color" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColors.map(color => (
                      <SelectItem key={color} value={color}>{color}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex flex-row items-center gap-2">
                <Label className="text-white w-24">Size</Label>
                <Select
                  value={formData.size}
                  onValueChange={(value) => handleSelectChange(value, "size")}
                  disabled={!formData.color}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSizes.map(size => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-row items-center gap-2">
                <Label className="text-white w-24">Quantity</Label>
                <Input
                  type="number"
                  placeholder="Quantity"
                  className="text-white"
                  value={formData.quantity}
                  onChange={handleQuantityChange}
                  min={1}
                  max={maxQuantity}
                  disabled={!formData.size}
                />
                {formData.size && (
                  <span className="text-white text-sm ml-2">
                    (Max: {maxQuantity})
                  </span>
                )}
              </div>
            </div>

            <div className="mb-4 flex flex-row items-center gap-2">
              <Label className="text-white w-24">Price:</Label>
              <span className="text-white font-medium">
                ${itemPrice} per unit
              </span>
            </div>

            <div className="mb-4 flex flex-row items-center gap-2">
              <Label className="text-white w-24">Total:</Label>
              <span className="text-white font-medium text-xl">
                ${formData.total}
              </span>
            </div>
          </>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? "Processing..." : "Confirm Sale"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sales;