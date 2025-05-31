"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Edit, Trash2, Package, RefreshCw } from "lucide-react"
import { getInventoryItems, deleteInventoryItem, updateInventoryItem, type InventoryItem } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import AddItemModal from "@/components/add-item-modal"
import EditItemModal from "@/components/edit-item-modal"
import PageHeader from "@/components/page-header"
import MainLayout from "@/components/main-layout"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import ItemQRCode from "@/components/item-qr-code";

const BarcodeScanner = dynamic(() => import("react-qr-barcode-scanner"), { ssr: false });

export default function ProductInventoryPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [isProcessingBarcode, setIsProcessingBarcode] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrProduct, setQRProduct] = useState<InventoryItem | null>(null);
  const { toast } = useToast();

  const loadInventoryItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getInventoryItems();
      setInventoryItems(data);
    } catch (error) {
      console.error("Error loading inventory items:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadInventoryItems();
  }, [loadInventoryItems]);

  const categories = [...new Set(inventoryItems.map((item) => item.category))];

  useEffect(() => {
    let filtered = inventoryItems;
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }
    setFilteredItems(filtered);
  }, [inventoryItems, searchTerm, categoryFilter, statusFilter]);

  const handleItemAdded = (newItem: InventoryItem) => {
    setInventoryItems((prev) => [newItem, ...prev]);
  };

  const handleItemUpdated = (updatedItem: InventoryItem) => {
    setInventoryItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      const success = await deleteInventoryItem(id);
      if (success) {
        toast({
          title: "Product deleted",
          description: `${name} has been removed from your inventory.`,
        });
        setInventoryItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        toast({
          title: "Error",
          description: "Failed to delete product. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in-stock":
        return <Badge variant="default">In Stock</Badge>;
      case "low-stock":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Low Stock
          </Badge>
        );
      case "out-of-stock":
        return <Badge variant="destructive">Out of Stock</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Handle QR/barcode scan
  const handleBarcodeScanned = async (result: { text: string; format: string } | null) => {
    if (!result || isProcessingBarcode) return;
    setIsProcessingBarcode(true);
    try {
      let barcode = result.text;
      let type = result.format;
      let parsed: any = null;
      console.log('[SCAN] Raw barcode:', barcode, 'Format:', type);
      try {
        parsed = JSON.parse(barcode);
        console.log('[SCAN] Parsed QR:', parsed);
      } catch (e) {
        console.log('[SCAN] Not a JSON QR, treating as plain barcode');
      }
      if (parsed && parsed.type === "item_update" && parsed.itemId) {
        // Find by itemId (from QR)
        const product = inventoryItems.find(item => item.id.toString() === parsed.itemId.toString() || item.sku === parsed.itemId);
        console.log('[SCAN] Matched product by QR:', product);
        if (product) {
          // Increment stock by 1
          const updatedItem = await updateInventoryItem(product.id, { stock: product.stock + 1 });
          console.log('[SCAN] Update result:', updatedItem);
          if (updatedItem) {
            toast({ title: 'Stock Incremented', description: `Stock for ${product.name} incremented to ${updatedItem.stock}` });
            handleItemUpdated(updatedItem);
          } else {
            toast({ title: 'Error', description: 'Failed to update product stock.', variant: 'destructive' });
          }
        } else {
          window.alert('QR code does not match any product.');
        }
      } else {
        // Fallback: treat as barcode (SKU)
        const product = inventoryItems.find(item => item.sku === barcode);
        console.log('[SCAN] Matched product by SKU:', product);
        if (product) {
          // Increment stock by 1
          const updatedItem = await updateInventoryItem(product.id, { stock: product.stock + 1 });
          console.log('[SCAN] Update result:', updatedItem);
          if (updatedItem) {
            toast({ title: 'Stock Incremented', description: `Stock for ${product.name} incremented to ${updatedItem.stock}` });
            handleItemUpdated(updatedItem);
          } else {
            toast({ title: 'Error', description: 'Failed to update product stock.', variant: 'destructive' });
          }
        } else {
          window.alert('Product Not Found. Would you like to add this product?');
        }
      }
      setShowBarcodeScanner(false);
    } catch (error) {
      console.error('Barcode processing error:', error);
      window.alert('Error: Failed to process barcode scan');
    } finally {
      setIsProcessingBarcode(false);
    }
  };

  if (isLoading && inventoryItems.length === 0) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Products" description="Manage your finished products and inventory" icon={Package} />
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Product Inventory</CardTitle>
                <CardDescription>Track and manage your finished products</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={loadInventoryItems} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
                <AddItemModal onItemAdded={handleItemAdded} onItemUpdated={handleItemUpdated} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category, index) => (
                    <SelectItem key={`${category}-${index}`} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                className="bg-blue-600 text-white"
                onClick={() => setShowBarcodeScanner(true)}
                disabled={isProcessingBarcode}
              >
                📱 Scan Barcode
              </Button>
            </div>

            {/* Barcode Scanner Modal */}
            <Dialog open={showBarcodeScanner} onOpenChange={setShowBarcodeScanner}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Scan Barcode</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center">
                  {/* @ts-ignore: react-qr-barcode-scanner types may be incorrect */}
                  <BarcodeScanner
                    // @ts-ignore
                    onUpdate={(err, result) => {
                      if (result) {
                        // Some versions return a Result object, not plain text
                        // @ts-ignore
                        const text = result.getText ? result.getText() : result.text;
                        handleBarcodeScanned({ text, format: "qr" });
                      }
                    }}
                    // @ts-ignore
                    constraints={{ facingMode: "environment" }}
                    style={{ width: "100%" }}
                  />
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowBarcodeScanner(false)}
                    disabled={isProcessingBarcode}
                  >
                    Cancel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Product Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[150px]">Category</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[100px]">Stock</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.sku}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right">{item.stock}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingItem(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id, item.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => { setQRProduct(item); setShowQRModal(true); }}
                            title="Show QR Code"
                          >
                            <span role="img" aria-label="QR">� QR</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )
                }
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Item Modal */}
        {editingItem && (
          <EditItemModal item={editingItem} onClose={() => setEditingItem(null)} onItemUpdated={() => {}} />
        )}

        {/* QR Code Modal (for future use) */}
        <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Product QR Code</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center">
              {qrProduct && <ItemQRCode itemId={qrProduct.id.toString()} itemName={qrProduct.name} />}
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowQRModal(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
