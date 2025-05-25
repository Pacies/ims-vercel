"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Package, Plus, Search, Filter, Edit, Trash2, TrendingUp, DollarSign } from "lucide-react"
import MainLayout from "@/components/main-layout"
import PageHeader from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import StatCard from "@/components/stat-card"
import AddItemModal from "@/components/add-item-modal"
import EditItemModal from "@/components/edit-item-modal"
import { getInventoryItems, deleteInventoryItem, addActivity } from "@/lib/database"
import type { InventoryItem } from "@/lib/supabaseClient"

export default function ProductsPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [editItemOpen, setEditItemOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")

  useEffect(() => {
    loadItems()
  }, [])

  useEffect(() => {
    filterAndSortItems()
  }, [items, searchTerm, categoryFilter, sortBy])

  const loadItems = async () => {
    try {
      const data = await getInventoryItems()
      setItems(data)
    } catch (error) {
      console.error("Error loading items:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortItems = () => {
    let filtered = items

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter)
    }

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "price":
          return b.price - a.price
        case "stock":
          return b.stock - a.stock
        case "category":
          return a.category.localeCompare(b.category)
        default:
          return 0
      }
    })

    setFilteredItems(filtered)
  }

  const handleDeleteItem = async (item: InventoryItem) => {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        await deleteInventoryItem(item.id)
        await addActivity({
          action: "delete",
          description: `Deleted product: ${item.name}`,
        })
        loadItems()
      } catch (error) {
        console.error("Error deleting item:", error)
        alert("Error deleting item")
      }
    }
  }

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item)
    setEditItemOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in-stock":
        return <Badge className="bg-green-100 text-green-800">In Stock</Badge>
      case "low-stock":
        return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>
      case "out-of-stock":
        return <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const categories = [...new Set(items.map((item) => item.category))]
  const totalValue = items.reduce((sum, item) => sum + item.price * item.stock, 0)
  const averagePrice = items.length > 0 ? items.reduce((sum, item) => sum + item.price, 0) / items.length : 0

  if (loading) {
    return (
      <MainLayout>
        <PageHeader title="Products" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <PageHeader title="Products" />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard value={items.length} label="Total Products" icon={<Package className="h-6 w-6" />} delay={0.1} />
        <StatCard value={categories.length} label="Categories" icon={<Filter className="h-6 w-6" />} delay={0.2} />
        <StatCard
          value={`$${averagePrice.toFixed(2)}`}
          label="Average Price"
          icon={<DollarSign className="h-6 w-6" />}
          delay={0.3}
        />
        <StatCard
          value={`$${totalValue.toLocaleString()}`}
          label="Total Value"
          icon={<TrendingUp className="h-6 w-6" />}
          delay={0.4}
        />
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price">Price (High to Low)</SelectItem>
                  <SelectItem value="stock">Stock (High to Low)</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => setAddItemOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-4">
              {items.length === 0
                ? "Get started by adding your first product."
                : "Try adjusting your search or filter criteria."}
            </p>
            {items.length === 0 && (
              <Button onClick={() => setAddItemOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Product
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    {item.image_url ? (
                      <img
                        src={item.image_url || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="h-12 w-12 text-gray-400" />
                    )}
                  </div>

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">{item.category}</p>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Price:</span>
                      <span className="font-semibold text-lg">${item.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Stock:</span>
                      <span className="font-medium">{item.stock} units</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Value:</span>
                      <span className="font-medium">${(item.price * item.stock).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditItem(item)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteItem(item)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <AddItemModal open={addItemOpen} onOpenChange={setAddItemOpen} onItemAdded={loadItems} />

      {selectedItem && (
        <EditItemModal
          open={editItemOpen}
          onOpenChange={setEditItemOpen}
          item={selectedItem}
          onItemUpdated={loadItems}
        />
      )}
    </MainLayout>
  )
}
