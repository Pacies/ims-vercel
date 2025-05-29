"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Edit, Trash2, Package, RefreshCw } from "lucide-react"
import { getRawMaterials, deleteRawMaterial, type RawMaterial } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import AddRawItemModal from "@/components/add-raw-item-modal"
import EditRawItemModal from "@/components/edit-raw-item-modal"
import PageHeader from "@/components/page-header"
import MainLayout from "@/components/main-layout"

export default function RawItemsPage() {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [filteredMaterials, setFilteredMaterials] = useState<RawMaterial[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null)
  const { toast } = useToast()

  const loadRawMaterials = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getRawMaterials()
      setRawMaterials(data)
    } catch (error) {
      console.error("Error loading raw materials:", error)
      toast({
        title: "Error",
        description: "Failed to load raw materials. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadRawMaterials()
  }, [loadRawMaterials])

  const categories = [...new Set(rawMaterials.map((material) => material.category))]

  useEffect(() => {
    let filtered = rawMaterials
    if (searchTerm) {
      filtered = filtered.filter(
        (material) =>
          material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (material.sku && material.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
          material.category.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    if (categoryFilter !== "all") {
      filtered = filtered.filter((material) => material.category === categoryFilter)
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((material) => material.status === statusFilter)
    }
    setFilteredMaterials(filtered)
  }, [rawMaterials, searchTerm, categoryFilter, statusFilter])

  const handleItemAdded = (newItem: RawMaterial) => {
    setRawMaterials((prev) => [newItem, ...prev])
  }

  const handleItemUpdated = (updatedItem: RawMaterial) => {
    setRawMaterials((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
  }

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      const success = await deleteRawMaterial(id)
      if (success) {
        toast({ title: "Raw material deleted", description: `${name} has been removed.` })
        setRawMaterials((prev) => prev.filter((m) => m.id !== id))
      } else {
        toast({ title: "Error", description: "Failed to delete raw material.", variant: "destructive" })
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in-stock":
        return <Badge variant="default">In Stock</Badge>
      case "low-stock":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Low Stock
          </Badge>
        )
      case "out-of-stock":
        return <Badge variant="destructive">Out of Stock</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading && rawMaterials.length === 0) {
    return (
      <MainLayout>
        <div className="p-6 animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded w-full"></div>
          <div className="h-64 bg-gray-200 rounded w-full"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <PageHeader title="Raw Materials" description="Manage your raw materials and components" icon={Package} />
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Raw Materials Inventory</CardTitle>
                <CardDescription>Track and manage your raw materials and components</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={loadRawMaterials} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
                <AddRawItemModal onItemAdded={handleItemAdded} onItemUpdated={handleItemUpdated} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, category..."
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
            </div>
            <div className="rounded-md border">
              <style jsx global>{`
                .quantity-column {
                  padding-right: 80px !important;
                  margin-right: 20px !important;
                }
                .status-column {
                  padding-left: 80px !important;
                  margin-left: 20px !important;
                }
              `}</style>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ width: "12%" }}>SKU</TableHead>
                    <TableHead style={{ width: "18%" }}>Name</TableHead>
                    <TableHead style={{ width: "12%" }}>Category</TableHead>
                    <TableHead className="text-right quantity-column" style={{ width: "18%" }}>
                      Quantity
                    </TableHead>
                    <TableHead className="status-column" style={{ width: "25%" }}>
                      Status
                    </TableHead>
                    <TableHead className="text-right" style={{ width: "15%" }}>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {rawMaterials.length === 0
                          ? "No raw materials found. Add your first one!"
                          : "No materials match your search."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMaterials.map((material, index) => (
                      <TableRow key={`${material.id}-${index}`}>
                        <TableCell className="font-mono text-sm">{material.sku}</TableCell>
                        <TableCell>
                          <p className="font-medium">{material.name}</p>
                        </TableCell>
                        <TableCell>{material.category}</TableCell>
                        <TableCell className="text-right quantity-column">{material.quantity}</TableCell>
                        <TableCell className="status-column">{getStatusBadge(material.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setEditingMaterial(material)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => handleDelete(material.id, material.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <p>
                Showing {filteredMaterials.length} of {rawMaterials.length} raw materials.
              </p>
            </div>
          </CardContent>
        </Card>
        {editingMaterial && (
          <EditRawItemModal
            material={editingMaterial}
            onClose={() => setEditingMaterial(null)}
            onItemUpdated={handleItemUpdated}
          />
        )}
      </div>
    </MainLayout>
  )
}
