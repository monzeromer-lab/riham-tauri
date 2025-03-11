import { useState, useEffect } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Database from "@tauri-apps/plugin-sql";
import { toast } from "sonner";

interface SalesReport {
  id: number;
  name: string;
  phone: string;
  address: string;
  type: string;
  color: string;
  size: string;
  quantity: number;
  date?: string; // This might come from a timestamp or date field
}

export default function Reports() {
  const [salesData, setSalesData] = useState<SalesReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState("");
  const [startDate] = useState<Date | undefined>(undefined);
  const [endDate] = useState<Date | undefined>(undefined);
  const [totalSales, setTotalSales] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const db = await Database.load("sqlite:riham.db");
      const result = await db.select<SalesReport[]>("SELECT * FROM sales");
      
      // Add a date field if it doesn't exist in your database
      const salesWithDate = result.map(sale => ({
        ...sale,
        date: new Date().toISOString().split('T')[0] // Use current date as placeholder
      }));
      
      setSalesData(salesWithDate);
      
      // Calculate totals
      const quantity = salesWithDate.reduce((sum, sale) => sum + sale.quantity, 0);
      setTotalQuantity(quantity);
      
      // Assuming each item has a price of 100 (you should adjust this based on your actual data)
      setTotalSales(quantity * 100);
    } catch (error) {
      console.error("Failed to fetch sales data:", error);
      toast("Failed to load sales reports");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = salesData.filter((sale) => {
    // Filter by name
    const nameMatch = sale.name.toLowerCase().includes(nameFilter.toLowerCase());
    
    // Filter by date range if set
    let dateMatch = true;
    if (startDate && endDate && sale.date) {
      const saleDate = new Date(sale.date);
      dateMatch = saleDate >= startDate && saleDate <= endDate;
    }
    
    return nameMatch && dateMatch;
  });


  return (
    <Card className="w-full h-full border-0">
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Sales Reports</h2>
          
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card className="bg-blue-600 text-white">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <h3 className="text-lg font-medium">Total Sales</h3>
              <p className="text-2xl font-bold">${totalSales.toFixed(2)}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-green-600 text-white">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <h3 className="text-lg font-medium">Total Items Sold</h3>
              <p className="text-2xl font-bold">{totalQuantity}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-600 text-white">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <h3 className="text-lg font-medium">Total Customers</h3>
              <p className="text-2xl font-bold">{new Set(salesData.map(sale => sale.name)).size}</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search by customer name..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="text-white"
            />
          </div>
          <div className="flex-1 flex gap-2">
            <div className="flex-1">
              {/* <Label htmlFor="startDate" className="text-white mb-1 block">Start Date</Label> */}
              {/* <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal text-white"
                    id="startDate"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover> */}
            </div>
            <div className="flex-1">
              {/* <Label htmlFor="endDate" className="text-white mb-1 block">End Date</Label> */}
              {/* <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal text-white"
                    id="endDate"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover> */}
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-8 text-white">Loading sales data...</div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-8 text-white">No sales records found matching your filters.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-white">ID</TableHead>
                <TableHead className="text-white">Customer</TableHead>
                <TableHead className="text-white">Phone</TableHead>
                <TableHead className="text-white">Type</TableHead>
                <TableHead className="text-white">Color</TableHead>
                <TableHead className="text-white">Size</TableHead>
                <TableHead className="text-white">Quantity</TableHead>
                <TableHead className="text-white">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="text-white">{sale.id}</TableCell>
                  <TableCell className="text-white">{sale.name}</TableCell>
                  <TableCell className="text-white">{sale.phone}</TableCell>
                  <TableCell className="text-white">{sale.type}</TableCell>
                  <TableCell className="text-white">{sale.color}</TableCell>
                  <TableCell className="text-white">{sale.size}</TableCell>
                  <TableCell className="text-white">{sale.quantity}</TableCell>
                  <TableCell className="text-white">{sale.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}