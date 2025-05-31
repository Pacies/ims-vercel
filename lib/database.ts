import { supabase } from "./supabaseClient"

// Types for our database tables
export interface User {
  id: number
  username: string
  email: string
  user_type: "admin" | "staff" | "viewer"
  status: "active" | "inactive"
  last_login?: string
  created_at: string
  updated_at: string
}

export interface AuthUserMapping {
  id: string // This is usually a UUID from Supabase Auth
  auth_user_id: string // UUID from auth.users
  app_user_id: number // Foreign key to your custom users table
  created_at: string
}

export interface InventoryItem {
  id: number
  name: string
  description?: string
  category: string // "top" | "bottom"
  price: number
  stock: number
  sku: string
  status: "in-stock" | "low-stock" | "out-of-stock"
  image_url?: string
  created_at: string
  updated_at: string
}

export interface RawMaterial {
  id: number
  name: string
  description?: string
  category?: string
  quantity: number
  unit: string
  cost_per_unit: number
  supplier?: string
  reorder_level?: number
  sku?: string
  status: "in-stock" | "low-stock" | "out-of-stock"
  created_at: string
  updated_at: string
}

export interface Order {
  id: number
  order_number: string
  customer_name: string
  customer_email?: string
  items: string
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  created_at: string
  updated_at: string
}

export interface Activity {
  id: number
  user_id?: number
  action: string
  description: string
  created_at: string
}

// Helper function to get current user from auth mapping
export async function getCurrentUser(): Promise<User | null> {
  // For development/demo purposes, return a mock admin user
  console.warn("getCurrentUser: Returning mock admin user for development.")
  return {
    id: 1,
    username: "admin_mock",
    email: "admin_mock@example.com",
    user_type: "admin",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

// Helper function to check if user has admin privileges
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.user_type === "admin" && user?.status === "active" ? true : false
}

// Helper function to check if user has staff or admin privileges
export async function isStaffOrAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.user_type && ["admin", "staff"].includes(user.user_type) && user?.status === "active" ? true : false
}

// Database operations for inventory items (products)
export async function getInventoryItems(): Promise<InventoryItem[]> {
  try {
    console.log("Fetching inventory items from database...")
    const { data, error } = await supabase.from("inventory_items").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching inventory items:", error.message)
      return []
    }

    console.log("Successfully fetched inventory items:", data)
    return data || []
  } catch (error: any) {
    console.error("Unexpected error fetching inventory items:", error.message)
    return []
  }
}

export async function addInventoryItem(
  item: Omit<InventoryItem, "id" | "created_at" | "updated_at" | "sku" | "status" | "description" | "image_url">,
): Promise<InventoryItem | null> {
  try {
    const { data: existingItems } = await supabase
      .from("inventory_items")
      .select("sku")
      .like("sku", "PRD-%")
      .order("sku", { ascending: false })
      .limit(1)

    let nextNumber = 1
    if (existingItems && existingItems.length > 0 && existingItems[0].sku) {
      const lastSku = existingItems[0].sku
      const lastNumber = Number.parseInt(lastSku.split("-")[1])
      if (!Number.isNaN(lastNumber)) {
        nextNumber = lastNumber + 1
      }
    }
    const sku = `PRD-${nextNumber.toString().padStart(4, "0")}`

    let status: "in-stock" | "low-stock" | "out-of-stock" = "in-stock"
    if (item.stock === 0) status = "out-of-stock"
    else if (item.stock <= 10) status = "low-stock"

    const newItem = { ...item, sku, status, price: item.price || 0 }

    const { data, error } = await supabase.from("inventory_items").insert(newItem).select().single()

    if (error) {
      console.error("Error adding inventory item:", error.message)
      return null
    }
    await logActivity("create", `Added new product: ${data.name} (SKU: ${data.sku})`)
    return data
  } catch (error: any) {
    console.error("Unexpected error adding inventory item:", error.message)
    return null
  }
}

export async function updateInventoryItem(id: number, updates: Partial<InventoryItem>): Promise<InventoryItem | null> {
  try {
    if (updates.stock !== undefined) {
      if (updates.stock === 0) updates.status = "out-of-stock"
      else if (updates.stock <= 10) updates.status = "low-stock"
      else updates.status = "in-stock"
    }
    const { data, error } = await supabase.from("inventory_items").update(updates).eq("id", id).select().single()
    if (error) {
      console.error("Error updating inventory item:", error.message)
      return null
    }
    await logActivity("update", `Updated product: ${data.name} (ID: ${id})`)
    return data
  } catch (error: any) {
    console.error("Unexpected error updating inventory item:", error.message)
    return null
  }
}

export async function deleteInventoryItem(id: number): Promise<boolean> {
  try {
    const { error } = await supabase.from("inventory_items").delete().eq("id", id)
    if (error) {
      console.error("Error deleting inventory item:", error.message)
      return false
    }
    await logActivity("delete", `Deleted product with ID: ${id}`)
    return true
  } catch (error: any) {
    console.error("Unexpected error deleting inventory item:", error.message)
    return false
  }
}

// Database operations for raw materials
export async function getRawMaterials(): Promise<RawMaterial[]> {
  try {
    console.log("Fetching raw materials from database...")
    const { data, error } = await supabase.from("raw_materials").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching raw materials:", error.message)
      return []
    }

    console.log("Successfully fetched raw materials:", data)

    // Transform the data to match our interface
    const transformedData =
      data?.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category || "general",
        quantity: item.quantity || 0,
        unit: item.unit || "units",
        cost_per_unit: item.cost_per_unit || 0,
        supplier: item.supplier,
        reorder_level: item.reorder_level || 10,
        sku: item.sku || `RAW-${item.id.toString().padStart(4, "0")}`,
        status: item.status || (item.quantity > 10 ? "in-stock" : item.quantity > 0 ? "low-stock" : "out-of-stock"),
        created_at: item.created_at,
        updated_at: item.updated_at,
      })) || []

    return transformedData
  } catch (error: any) {
    console.error("Unexpected error fetching raw materials:", error.message)
    return []
  }
}

export async function addRawMaterial(
  material: Omit<
    RawMaterial,
    | "id"
    | "created_at"
    | "updated_at"
    | "sku"
    | "status"
    | "description"
    | "supplier"
    | "unit"
    | "cost_per_unit"
    | "reorder_level"
  > & { quantity: number; category: string; name: string },
): Promise<RawMaterial | null> {
  try {
    const { data: existingMaterials } = await supabase
      .from("raw_materials")
      .select("sku")
      .like("sku", "RAW-%")
      .order("sku", { ascending: false })
      .limit(1)

    let nextNumber = 1
    if (existingMaterials && existingMaterials.length > 0 && existingMaterials[0].sku) {
      const lastSku = existingMaterials[0].sku
      const lastNumber = Number.parseInt(lastSku.split("-")[1])
      if (!Number.isNaN(lastNumber)) {
        nextNumber = lastNumber + 1
      }
    }
    const sku = `RAW-${nextNumber.toString().padStart(4, "0")}`

    const unit = "units"
    const cost_per_unit = 0
    const reorder_level = 10

    let status: "in-stock" | "low-stock" | "out-of-stock" = "in-stock"
    if (material.quantity === 0) status = "out-of-stock"
    else if (material.quantity <= reorder_level) status = "low-stock"

    const newMaterial = { ...material, sku, status, unit, cost_per_unit, reorder_level }

    const { data, error } = await supabase.from("raw_materials").insert(newMaterial).select().single()

    if (error) {
      console.error("Error adding raw material:", error.message)
      return null
    }
    await logActivity("create", `Added new raw material: ${data.name} (SKU: ${data.sku})`)
    return data
  } catch (error: any) {
    console.error("Unexpected error adding raw material:", error.message)
    return null
  }
}

export async function updateRawMaterial(id: number, updates: Partial<RawMaterial>): Promise<RawMaterial | null> {
  try {
    if (updates.quantity !== undefined || updates.reorder_level !== undefined) {
      const { data: currentMaterial } = await supabase
        .from("raw_materials")
        .select("quantity, reorder_level")
        .eq("id", id)
        .single()
      if (currentMaterial) {
        const newQuantity = updates.quantity ?? currentMaterial.quantity
        const newReorderLevel = updates.reorder_level ?? currentMaterial.reorder_level
        if (newQuantity === 0) updates.status = "out-of-stock"
        else if (newQuantity <= newReorderLevel) updates.status = "low-stock"
        else updates.status = "in-stock"
      }
    }
    const { data, error } = await supabase.from("raw_materials").update(updates).eq("id", id).select().single()
    if (error) {
      console.error("Error updating raw material:", error.message)
      return null
    }
    await logActivity("update", `Updated raw material: ${data.name} (ID: ${id})`)
    return data
  } catch (error: any) {
    console.error("Unexpected error updating raw material:", error.message)
    return null
  }
}

export async function deleteRawMaterial(id: number): Promise<boolean> {
  try {
    const { error } = await supabase.from("raw_materials").delete().eq("id", id)
    if (error) {
      console.error("Error deleting raw material:", error.message)
      return false
    }
    await logActivity("delete", `Deleted raw material with ID: ${id}`)
    return true
  } catch (error: any) {
    console.error("Unexpected error deleting raw material:", error.message)
    return false
  }
}

// Database operations for orders (keeping for completeness, but not primary focus)
export async function getOrders(): Promise<Order[]> {
  try {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })
    if (error) {
      console.error("Error fetching orders:", error.message)
      return []
    }
    return data || []
  } catch (error: any) {
    console.error("Unexpected error fetching orders:", error.message)
    return []
  }
}

// Database operations for users
export async function getUsers(): Promise<User[]> {
  try {
    console.log("Fetching users from database...")
    const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })
    if (error) {
      console.error("Error fetching users:", error.message)
      // Return some mock users for development
      return [
        {
          id: 1,
          username: "admin",
          email: "admin@example.com",
          user_type: "admin",
          status: "active",
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          username: "staff1",
          email: "staff1@example.com",
          user_type: "staff",
          status: "active",
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]
    }
    console.log("Successfully fetched users:", data)
    return data || []
  } catch (error: any) {
    console.error("Unexpected error fetching users:", error.message)
    return []
  }
}

export async function addUser(
  user: Omit<User, "id" | "created_at" | "updated_at" | "last_login">,
): Promise<User | null> {
  try {
    const { data, error } = await supabase.from("users").insert(user).select().single()
    if (error) {
      console.error("Error adding user:", error.message)
      return null
    }
    await logActivity("create", `Added new user: ${data.username}`)
    return data
  } catch (error: any) {
    console.error("Unexpected error adding user:", error.message)
    return null
  }
}

export async function updateUser(id: number, updates: Partial<User>): Promise<User | null> {
  try {
    const { data, error } = await supabase.from("users").update(updates).eq("id", id).select().single()
    if (error) {
      console.error("Error updating user:", error.message)
      return null
    }
    await logActivity("update", `Updated user: ${data.username} (ID: ${id})`)
    return data
  } catch (error: any) {
    console.error("Unexpected error updating user:", error.message)
    return null
  }
}

export async function deleteUser(id: number): Promise<boolean> {
  try {
    const { error: mappingError } = await supabase.from("auth_user_mapping").delete().eq("app_user_id", id)
    if (mappingError) {
      console.warn("Error deleting from auth_user_mapping (might be okay if no mapping exists):", mappingError.message)
    }

    const { error: userError } = await supabase.from("users").delete().eq("id", id)
    if (userError) {
      console.error("Error deleting user from users table:", userError.message)
      return false
    }

    await logActivity("delete", `Deleted user with ID: ${id}`)
    return true
  } catch (error: any) {
    console.error("Unexpected error deleting user:", error.message)
    return false
  }
}

// Database operations for activities
export async function getActivities(): Promise<Activity[]> {
  try {
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
    if (error) {
      console.error("Error fetching activities:", error.message)
      return []
    }
    return data || []
  } catch (error: any) {
    console.error("Unexpected error fetching activities:", error.message)
    return []
  }
}

export async function logActivity(action: string, description: string): Promise<void> {
  try {
    const user = await getCurrentUser()
    await supabase.from("activities").insert([{ user_id: user?.id || null, action, description }])
  } catch (error: any) {
    console.error("Error logging activity:", error.message)
  }
}

// Authentication functions
export async function signOut(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Error signing out:", error.message)
    }
  } catch (error: any) {
    console.error("Unexpected error signing out:", error.message)
  }
}
