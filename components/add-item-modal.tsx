"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addInventoryItem, addActivity } from "@/lib/database"

interface AddItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onItemAdded?: () => void
}

export default function AddItemModal({ open, onOpenChange, onItemAdded }: AddItemModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    stock: "1",
    sku: "",
    image_url: "",
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const generateSKU = () => {
    const prefix = formData.category.substring(0, 3).toUpperCase()
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")
    return `${prefix}-${random}`
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

      const sku = formData.sku || generateSKU()
      const status = determineStatus(stock)

      const newItem = await addInventoryItem({
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        price: price,
        stock: stock,
        sku: sku,
        status: status,
        image_url: formData.image_url || null,
      })

      await addActivity({
        action: "create",
        description: `Added new item: ${newItem?.name || formData.name}`,
      })

      // Reset form and close modal
      setFormData({
        name: "",
        description: "",
        category: "",
        price: "",
        stock: "1",
        sku: "",
        image_url: "",
      })

      onOpenChange(false)
      onItemAdded?.()
    } catch (error) {
      console.error("Error adding item:", error)
      alert("Error adding item. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
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
                <SelectItem value="Shirts">Shirts</SelectItem>
                <SelectItem value="Pants">Pants</SelectItem>
                <SelectItem value="Dresses">Dresses</SelectItem>
                <SelectItem value="Sweaters">Sweaters</SelectItem>
                <SelectItem value="Shorts">Shorts</SelectItem>
                <SelectItem value="Skirts">Skirts</SelectItem>
                <SelectItem value="Jackets">Jackets</SelectItem>
                <SelectItem value="Accessories">Accessories</SelectItem>
                <SelectItem value="Shoes">Shoes</SelectItem>
                <SelectItem value="Underwear">Underwear</SelectItem>
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
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              placeholder="Leave empty to auto-generate"
            />
            <p className="text-xs text-gray-500">If left empty, a SKU will be automatically generated</p>
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
              {loading ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
