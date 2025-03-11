import { useState, useEffect } from "react";
import AnalyticCart from "@/components/riham/AnalyticCart";
import Database from "@tauri-apps/plugin-sql";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [totalSales, setTotalSales] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [salesChartData, setSalesChartData] = useState<any[]>([]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const db = await Database.load("sqlite:riham.db");
      
      // Get total sales count
      const totalResult = await db.select<{count: number}[]>("SELECT COUNT(*) as count FROM sales");
      setTotalSales(totalResult[0]?.count || 0);
      
      // Get total items sold (sum of quantities)
      const itemsResult = await db.select<{total: number}[]>("SELECT SUM(quantity) as total FROM sales");
      setTotalItems(itemsResult[0]?.total || 0);
      
      // Get total revenue (assuming we have price data in inventory)
      // This is an estimate based on current inventory prices
      const revenueResult = await db.select<{total: number}[]>(`
        SELECT SUM(s.quantity * COALESCE(i.price, 100)) as total 
        FROM sales s
        LEFT JOIN inventory i ON s.type = i.type AND s.color = i.color AND s.size = i.size
      `);
      setTotalRevenue(revenueResult[0]?.total || 0);
      
      // Get total unique customers
      const customersResult = await db.select<{count: number}[]>(
        "SELECT COUNT(DISTINCT name) as count FROM sales"
      );
      setTotalCustomers(customersResult[0]?.count || 0);
      
      // Get low stock items (less than 5 in quantity)
      const lowStockResult = await db.select(
        "SELECT id, type, color, size, quantity FROM inventory WHERE quantity < 5"
      );
      setLowStockItems(lowStockResult as any[]);
      
      // Get recent sales
      const recentSalesResult = await db.select(
        "SELECT s.id, s.name, s.type, s.color, s.size, s.quantity, COALESCE(i.price, 100) as price FROM sales s LEFT JOIN inventory i ON s.type = i.type AND s.color = i.color AND s.size = i.size ORDER BY s.id DESC LIMIT 5"
      );
      setRecentSales(recentSalesResult as any[]);
      
      // Generate revenue by color chart data
      const revenueByColorResult = await db.select(`
        SELECT s.color, SUM(s.quantity * COALESCE(i.price, 100)) as total 
        FROM sales s
        LEFT JOIN inventory i ON s.type = i.type AND s.color = i.color AND s.size = i.size
        GROUP BY s.color
        ORDER BY total DESC
        LIMIT 6
      `);
      
      setSalesChartData((revenueByColorResult as Array<{ color: string; total: number }>).map(item => ({
        name: item.color,
        value: item.total
      })));
      
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-start gap-6 p-4">
      <h1 className="text-white font-bold text-3xl">Dashboard</h1>
      
      {loading ? (
        <div className="text-white text-center py-8">Loading dashboard data...</div>
      ) : (
        <>
          <div className="flex flex-row flex-wrap w-full gap-4">
            <AnalyticCart color="#FF5733" name="Total Sales" value={totalSales} />
            <AnalyticCart color="#4CAF50" name="Total Revenue" value={totalRevenue.toFixed(2)} />
            <AnalyticCart color="#2196F3" name="Items Sold" value={totalItems} />
            <AnalyticCart color="#FF9800" name="Customers" value={totalCustomers} />
            <AnalyticCart 
              color={lowStockItems.length > 0 ? "#FF0000" : "#9C27B0"} 
              name="Low Stock Items" 
              value={lowStockItems.length} 
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-0">
              <CardHeader>
                <CardTitle className="text-white">Revenue by Color</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {salesChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={salesChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {salesChartData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                          contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Legend formatter={(value) => <span style={{ color: '#fff' }}>{value}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-white">
                      No revenue data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-0">
              <CardHeader>
                <CardTitle className="text-white">Recent Sales</CardTitle>
              </CardHeader>
              <CardContent>
                {recentSales.length === 0 ? (
                  <p className="text-white text-center py-4">No recent sales found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-white">Customer</TableHead>
                        <TableHead className="text-white">Product</TableHead>
                        <TableHead className="text-white">Quantity</TableHead>
                        <TableHead className="text-white">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="text-white">{sale.name}</TableCell>
                          <TableCell className="text-white">{`${sale.type} - ${sale.color} (${sale.size})`}</TableCell>
                          <TableCell className="text-white">{sale.quantity}</TableCell>
                          <TableCell className="text-white">${(sale.quantity * sale.price).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
          
          {lowStockItems.length > 0 && (
            <Card className="bg-gray-800 border-0">
              <CardHeader>
                <CardTitle className="text-red-400">Low Stock Alert</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-white">Item</TableHead>
                      <TableHead className="text-white">Remaining Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-white">{`${item.type} - ${item.color} (${item.size})`}</TableCell>
                        <TableCell className="font-bold text-red-400">{item.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}