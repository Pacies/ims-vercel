"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, ArrowLeft } from "lucide-react"
import { addRawMaterial, updateRawMaterial, getRawMaterials, type RawMaterial } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"

interface AddRawItemModalProps {
  onItemAdded: (newItem: RawMaterial) => void
  onItemUpdated: (updatedItem: RawMaterial) => void // Add this prop
}

export default function AddRawItemModal({ onItemAdded, onItemUpdated }: AddRawItemModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: category, 2: type, 3: quantity
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedType, setSelectedType] = useState("")
  const [customType, setCustomType] = useState("")
  const [quantity, setQuantity] = useState("")
  const [showCustomInput, setShowCustomInput] = useState(false)
  const { toast } = useToast()

  const categories = [
    {
      name: "Fabric",
      types: ["Cotton Fabric", "Polyester Fabric", "Denim Fabric", "Others"],
    },
    {
      name: "Sewing",
      types: ["Buttons", "Thread", "Zipper", "Needle", "Scissors", "Others"],
    },
  ]

  const resetForm = () => {
    setStep(1)
    setSelectedCategory("")
    setSelectedType("")
    setCustomType("")
    setQuantity("")
    setShowCustomInput(false)
  }

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category)
    setStep(2)
  }

  const handleTypeSelect = (type: string) => {
    if (type === "Others") {
      setShowCustomInput(true)
    } else {
      setSelectedType(type)
      setStep(3)
    }
  }

  const handleCustomTypeSubmit = () => {
    if (customType.trim()) {
      setSelectedType(customType.trim())
      setStep(3)
      setShowCustomInput(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedCategory || !selectedType || !quantity) {
      toast({
        title: "Validation Error",
        description: "Please complete all steps.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Check if the same raw material already exists
      const existingMaterials = await getRawMaterials()
      const existingMaterial = existingMaterials.find(
        (material) =>
          material.name.toLowerCase() === selectedType.toLowerCase() &&
          material.category.toLowerCase() === selectedCategory.toLowerCase(),
      )

      if (existingMaterial) {
        // Update existing material by adding quantity
        const newQuantity = existingMaterial.quantity + Number.parseFloat(quantity)
        const updatedMaterial = await updateRawMaterial(existingMaterial.id, {
          quantity: newQuantity,
        })

        if (updatedMaterial) {
          toast({
            title: "Raw material updated",
            description: `Added ${quantity} to existing ${selectedType}. Total quantity: ${newQuantity}`,
          })
          onItemUpdated(updatedMaterial) // Use the onItemUpdated callback
        }
      } else {
        // Create new material
        const newItem = await addRawMaterial({
          name: selectedType,
          quantity: Number.parseFloat(quantity),
          category: selectedCategory,
        })

        if (newItem) {
          toast({
            title: "Raw material added successfully",
            description: `${newItem.name} has been added to your inventory.`,
          })
          onItemAdded(newItem)
        }
      }

      resetForm()
      setIsOpen(false)
    } catch (error) {
      console.error("Error adding raw material:", error)
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
    if (step === 3) {
      setStep(2)
      setQuantity("")
    } else if (step === 2) {
      setStep(1)
      setSelectedType("")
      setCustomType("")
      setShowCustomInput(false)
    }
  }

  const selectedCategoryData = categories.find((cat) => cat.name === selectedCategory)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Raw Material
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Raw Material</DialogTitle>
        </DialogHeader>

        {/* Step 1: Category Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <Label className="text-base font-medium">Select Category</Label>
            <div className="grid grid-cols-1 gap-3">
              {categories.map((category) => (
                <Button
                  key={category.name}
                  variant="outline"
                  className="h-12 text-left justify-start"
                  onClick={() => handleCategorySelect(category.name)}
                >
                  {category.name}
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

        {/* Step 2: Type Selection */}
        {step === 2 && !showCustomInput && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Label className="text-base font-medium">Select {selectedCategory} Type</Label>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {selectedCategoryData?.types.map((type) => (
                <Button
                  key={type}
                  variant="outline"
                  className="h-12 text-left justify-start"
                  onClick={() => handleTypeSelect(type)}
                >
                  {type}
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

        {/* Custom Type Input */}
        {step === 2 && showCustomInput && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCustomInput(false)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Label className="text-base font-medium">Enter Custom {selectedCategory} Type</Label>
            </div>
            <Input
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              placeholder={`Enter ${selectedCategory.toLowerCase()} type name`}
              onKeyPress={(e) => e.key === "Enter" && handleCustomTypeSubmit()}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleCustomTypeSubmit} disabled={!customType.trim()}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Quantity Input */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Label className="text-base font-medium">Enter Quantity</Label>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Selected: <span className="font-medium">{selectedType}</span> ({selectedCategory})
              </p>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading || !quantity}>
                {isLoading ? "Adding..." : "Add Raw Material"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
