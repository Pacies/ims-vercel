"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateInventoryItem, addActivity } from "@/lib/database"
import type { InventoryItem } from "@/lib/supabaseClient"

interface EditItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: InventoryItem
  onItemUpdated?: () => void
}

export default function EditItemModal({ open, onOpenChange, item, onItemUpdated }: EditItemModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    stock: "",
    sku: "",
    image_url: "",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description || "",
        category: item.category,
        price: item.price.toString(),
        stock: item.stock.toString(),
        sku: item.sku,
        image_url: item.image_url || "",
      })
    }
  }, [item])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const determineStatus = (stock: number) => {
    if (stock === 0) return "out-of-stock"
    if (stock <= 10) return "low-stock"
    return "in-stock"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate form
      if (!formData.name || !formData.category || !formData.price || !formData.stock) {
        alert("Please fill in all required fields.")
        return
      }

      const stock = Number.parseInt(formData.stock)
      const price = Number.parseFloat(formData.price)

      if (isNaN(stock) || stock < 0) {
        alert("Please enter a valid stock quantity.")
        return
      }

      if (isNaN(price) || price < 0) {
        alert("Please enter a valid price.")
        return
      }

      const status = determineStatus(stock)

      await updateInventoryItem(item.id, {
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        price: price,
        stock: stock,
        sku: formData.sku,
        status: status,
        image_url: formData.image_url || null,
      })

      await addActivity({
        action: "update",
        description: `Updated item: ${formData.name}`,
      })

      onOpenChange(false)
      onItemUpdated?.()
    } catch (error) {
      console.error("Error updating item:", error)
      alert("Error updating item. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter item name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter item description"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Clothing">Clothing</SelectItem>
                <SelectItem value="Books">Books</SelectItem>
                <SelectItem value="Home & Garden">Home & Garden</SelectItem>
                <SelectItem value="Sports">Sports</SelectItem>
                <SelectItem value="Toys">Toys</SelectItem>
                <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                <SelectItem value="Health & Beauty">Health & Beauty</SelectItem>
                <SelectItem value="Automotive">Automotive</SelectItem>
                <SelectItem value="Office Supplies">Office Supplies</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleChange}
                required
                placeholder="0.00"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stock">Stock Quantity *</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                required
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sku">SKU *</Label>
            <Input id="sku" name="sku" value={formData.sku} onChange={handleChange} required placeholder="Enter SKU" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              name="image_url"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={formData.image_url}
              onChange={handleChange}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
