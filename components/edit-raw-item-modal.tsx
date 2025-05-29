"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { updateRawMaterial, type RawMaterial } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"

interface EditRawItemModalProps {
  material: RawMaterial
  onClose: () => void
  onItemUpdated: () => void
}

export default function EditRawItemModal({ material, onClose, onItemUpdated }: EditRawItemModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    category: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name,
        quantity: material.quantity.toString(),
        category: material.category || "",
      })
    }
  }, [material])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const success = await updateRawMaterial(material.id, {
        name: formData.name,
        quantity: Number.parseFloat(formData.quantity),
        category: formData.category,
      })

      if (success) {
        toast({
          title: "Raw material updated successfully",
          description: `${formData.name} has been updated.`,
        })
        onClose()
        onItemUpdated()
      } else {
        toast({
          title: "Error",
          description: "Failed to update raw material. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating raw material:", error)
      toast({
        title: "Error",
        description: "Failed to update raw material. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const categories = ["Fabric", "Sewing"]

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Raw Material</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Material Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter material name"
              required
            />
          </div>

          <div>
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="0"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Material"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
