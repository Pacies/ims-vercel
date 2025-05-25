import { supabase, isConfigured } from "./supabaseClient"
import type { InventoryItem, Order, User, Activity } from "./supabaseClient"

// Dashboard Statistics
export async function getDashboardStats() {
  if (!isConfigured) {
    return {
      totalItems: 0,
      categories: 0,
      lowStockItems: 0,
      totalOrders: 0,
      totalValue: 0,
    }
  }

  try {
    // Get total items
    const { data: items, error: itemsError } = await supabase.from("inventory_items").select("*")

    if (itemsError) throw itemsError

    // Get total orders
    const { data: orders, error: ordersError } = await supabase.from("orders").select("*")

    if (ordersError) throw ordersError

    // Calculate stats
    const totalItems = items?.length || 0
    const categories = new Set(items?.map((item: InventoryItem) => item.category)).size
    const lowStockItems = items?.filter((item: InventoryItem) => item.stock < 10).length || 0
    const totalOrders = orders?.length || 0
    const totalValue = items?.reduce((sum: number, item: InventoryItem) => sum + item.price * item.stock, 0) || 0

    return {
      totalItems,
      categories,
      lowStockItems,
      totalOrders,
      totalValue,
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return {
      totalItems: 0,
      categories: 0,
      lowStockItems: 0,
      totalOrders: 0,
      totalValue: 0,
    }
  }
}

// Get low stock items
export async function getLowStockItems(): Promise<InventoryItem[]> {
  if (!isConfigured) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from("inventory_items")
      .select("*")
      .lt("stock", 10)
      .order("stock", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching low stock items:", error)
    return []
  }
}

// Get all inventory items
export async function getInventoryItems(): Promise<InventoryItem[]> {
  if (!isConfigured) {
    return []
  }

  try {
    const { data, error } = await supabase.from("inventory_items").select("*").order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching inventory items:", error)
    return []
  }
}

// Add new inventory item
export async function addInventoryItem(item: Omit<InventoryItem, "id" | "created_at" | "updated_at">) {
  if (!isConfigured) {
    console.log("Would add item:", item)
    return { data: null, error: null }
  }

  try {
    const { data, error } = await supabase
      .from("inventory_items")
      .insert([
        {
          ...item,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) throw error

    // Log activity
    await logActivity("CREATE", `Added new item: ${item.name}`)

    return { data, error: null }
  } catch (error) {
    console.error("Error adding inventory item:", error)
    return { data: null, error }
  }
}

// Update inventory item
export async function updateInventoryItem(id: number, updates: Partial<InventoryItem>) {
  if (!isConfigured) {
    console.log("Would update item:", id, updates)
    return { data: null, error: null }
  }

  try {
    const { data, error } = await supabase
      .from("inventory_items")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) throw error

    // Log activity
    await logActivity("UPDATE", `Updated item ID: ${id}`)

    return { data, error: null }
  } catch (error) {
    console.error("Error updating inventory item:", error)
    return { data: null, error }
  }
}

// Delete inventory item
export async function deleteInventoryItem(id: number) {
  if (!isConfigured) {
    console.log("Would delete item:", id)
    return { data: null, error: null }
  }

  try {
    const { data, error } = await supabase.from("inventory_items").delete().eq("id", id)

    if (error) throw error

    // Log activity
    await logActivity("DELETE", `Deleted item ID: ${id}`)

    return { data, error: null }
  } catch (error) {
    console.error("Error deleting inventory item:", error)
    return { data: null, error }
  }
}

// Get recent activities
export async function getRecentActivities(limit = 10): Promise<Activity[]> {
  if (!isConfigured) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching activities:", error)
    return []
  }
}

// Get activities (alias for getRecentActivities for backward compatibility)
export async function getActivities(limit = 10): Promise<Activity[]> {
  return getRecentActivities(limit)
}

// Log activity
export async function logActivity(action: string, description: string, userId?: number) {
  if (!isConfigured) {
    console.log("Would log activity:", action, description)
    return
  }

  try {
    const { error } = await supabase.from("activities").insert([
      {
        user_id: userId || null,
        action,
        description,
        created_at: new Date().toISOString(),
      },
    ])

    if (error) throw error
  } catch (error) {
    console.error("Error logging activity:", error)
  }
}

// Get all orders
export async function getOrders(): Promise<Order[]> {
  if (!isConfigured) {
    return []
  }

  try {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching orders:", error)
    return []
  }
}

// Get all users
export async function getUsers(): Promise<User[]> {
  if (!isConfigured) {
    return []
  }

  try {
    const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}

export async function addOrder(order: Omit<Order, "id" | "created_at" | "updated_at">): Promise<Order | null> {
  try {
    const { data, error } = await supabase.from("orders").insert([order]).select().single()

    if (error) {
      console.error("Error adding order:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error adding order:", error)
    return null
  }
}

export async function updateOrder(id: number, updates: Partial<Order>): Promise<Order | null> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating order:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error updating order:", error)
    return null
  }
}

export async function addUser(user: Omit<User, "id" | "created_at" | "updated_at">): Promise<User | null> {
  try {
    const { data, error } = await supabase.from("users").insert([user]).select().single()

    if (error) {
      console.error("Error adding user:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error adding user:", error)
    return null
  }
}

export async function updateUser(id: number, updates: Partial<User>): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating user:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error updating user:", error)
    return null
  }
}

export async function deleteUser(id: number): Promise<boolean> {
  try {
    const { error } = await supabase.from("users").delete().eq("id", id)

    if (error) {
      console.error("Error deleting user:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error deleting user:", error)
    return false
  }
}

// Raw Materials functions (if you have this table)
export async function getRawMaterials(): Promise<any[]> {
  try {
    const { data, error } = await supabase.from("raw_materials").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching raw materials:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Database connection error:", error)
    return []
  }
}

export async function addRawMaterial(material: any): Promise<any | null> {
  try {
    const { data, error } = await supabase.from("raw_materials").insert([material]).select().single()

    if (error) {
      console.error("Error adding raw material:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error adding raw material:", error)
    return null
  }
}
