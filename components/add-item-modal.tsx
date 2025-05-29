"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, ArrowLeft } from "lucide-react"
import { addInventoryItem, updateInventoryItem, getInventoryItems, type InventoryItem } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"

interface AddItemModalProps {
  onItemAdded: (newItem: InventoryItem) => void
  onItemUpdated: (updatedItem: InventoryItem) => void // Add this prop
}

export default function AddItemModal({ onItemAdded, onItemUpdated }: AddItemModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: product type, 2: quantity and price
  const [selectedProduct, setSelectedProduct] = useState("")
  const [customProduct, setCustomProduct] = useState("")
  const [quantity, setQuantity] = useState("")
  const [price, setPrice] = useState("")
  const [showCustomInput, setShowCustomInput] = useState(false)
  const { toast } = useToast()

  const productTypes = [
    { name: "T-Shirt", category: "Top" },
    { name: "Polo Shirt", category: "Top" },
    { name: "Blouse", category: "Top" },
    { name: "Tank Top", category: "Top" },
    { name: "Pajama", category: "Bottom" },
    { name: "Shorts", category: "Bottom" },
    { name: "Pants", category: "Bottom" },
    { name: "Skirt", category: "Bottom" },
    { name: "Others", category: "" },
  ]

  const resetForm = () => {
    setStep(1)
    setSelectedProduct("")
    setCustomProduct("")
    setQuantity("")
    setPrice("")
    setShowCustomInput(false)
  }

  const handleProductSelect = (productName: string, category: string) => {
    if (productName === "Others") {
      setShowCustomInput(true)
    } else {
      setSelectedProduct(productName)
      setStep(2)
    }
  }

  const handleCustomProductSubmit = () => {
    if (customProduct.trim()) {
      setSelectedProduct(customProduct.trim())
      setStep(2)
      setShowCustomInput(false)
    }
  }

  const getProductCategory = (productName: string) => {
    const product = productTypes.find((p) => p.name === productName)
    if (product && product.category) {
      return product.category
    }
    // For custom products, determine category based on common patterns
    const lowerName = productName.toLowerCase()
    if (
      lowerName.includes("shirt") ||
      lowerName.includes("blouse") ||
      lowerName.includes("top") ||
      lowerName.includes("polo")
    ) {
      return "Top"
    } else if (
      lowerName.includes("pant") ||
      lowerName.includes("short") ||
      lowerName.includes("pajama") ||
      lowerName.includes("skirt") ||
      lowerName.includes("bottom")
    ) {
      return "Bottom"
    }
    return "Top" // Default to Top if unclear
  }

  const handleSubmit = async () => {
    if (!selectedProduct || !quantity || !price) {
      toast({
        title: "Validation Error",
        description: "Please complete all fields.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const category = getProductCategory(selectedProduct)
      const priceValue = Number.parseFloat(price)

      // Check if the same product already exists (same name, category, and price)
      const existingItems = await getInventoryItems()
      const existingItem = existingItems.find(
        (item) =>
          item.name.toLowerCase() === selectedProduct.toLowerCase() &&
          item.category.toLowerCase() === category.toLowerCase() &&
          Math.abs(item.price - priceValue) < 0.01, // Compare prices with small tolerance for floating point
      )

      if (existingItem) {
        // Update existing item by adding quantity
        const newStock = existingItem.stock + Number.parseInt(quantity)
        const updatedItem = await updateInventoryItem(existingItem.id, {
          stock: newStock,
        })

        if (updatedItem) {
          toast({
            title: "Product updated",
            description: `Added ${quantity} to existing ${selectedProduct}. Total stock: ${newStock}`,
          })
          onItemUpdated(updatedItem) // Use the onItemUpdated callback
        }
      } else {
        // Create new product
        const newItem = await addInventoryItem({
          name: selectedProduct,
          category: category,
          stock: Number.parseInt(quantity),
          price: priceValue,
        })

        if (newItem) {
          toast({
            title: "Product added successfully",
            description: `${newItem.name} has been added to your inventory.`,
          })
          onItemAdded(newItem)
        }
      }

      resetForm()
      setIsOpen(false)
    } catch (error) {
      console.error("Error adding item:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    resetForm()
    setIsOpen(false)
  }

  const handleBack = () => {
    if (step === 2) {
      setStep(1)
      setQuantity("")
      setPrice("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>

        {/* Step 1: Product Type Selection */}
        {step === 1 && !showCustomInput && (
          <div className="space-y-4">
            <Label className="text-base font-medium">Select Product Type</Label>
            <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
              {productTypes.map((product, index) => (
                <Button
                  key={`${product.name}-${index}`} // Use index to ensure unique keys
                  variant="outline"
                  className="h-12 text-left justify-start"
                  onClick={() => handleProductSelect(product.name, product.category)}
                >
                  {product.name}
                </Button>
              ))}
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Custom Product Input */}
        {step === 1 && showCustomInput && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCustomInput(false)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Label className="text-base font-medium">Enter Custom Product Type</Label>
            </div>
            <Input
              value={customProduct}
              onChange={(e) => setCustomProduct(e.target.value)}
              placeholder="Enter product type name"
              onKeyPress={(e) => e.key === "Enter" && handleCustomProductSubmit()}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleCustomProductSubmit} disabled={!customProduct.trim()}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Quantity and Price Input */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Label className="text-base font-medium">Enter Details</Label>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Selected: <span className="font-medium">{selectedProduct}</span>
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading || !quantity || !price}>
                {isLoading ? "Adding..." : "Add Product"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
