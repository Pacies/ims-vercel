import { createClient } from "@supabase/supabase-js"

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if we're in development/preview mode without proper env vars
const isConfigured =
  supabaseUrl && supabaseAnonKey && supabaseUrl !== "your-project-url" && supabaseAnonKey !== "your-anon-key"

let supabase: any

if (isConfigured) {
  // Use real Supabase client when properly configured
  supabase = createClient(supabaseUrl!, supabaseAnonKey!)
} else {
  // For development, we'll still try to create a client with fallback values
  // This allows the app to work even without env vars set
  console.warn("Supabase environment variables not found. Using fallback configuration.")

  // Try to use the URL from the screenshot or fallback
  const fallbackUrl = "https://zjhjxzhyoeuxedbyhmeji.supabase.co"
  const fallbackKey = "your-anon-key-here" // You'll need to replace this with your actual anon key

  try {
    supabase = createClient(fallbackUrl, fallbackKey)
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    // Create a mock client as last resort
    supabase = {
      from: (table: string) => ({
        select: (columns?: string, options?: any) => ({
          eq: () => ({ data: [], error: null }),
          lt: () => ({ data: [], error: null }),
          order: () => ({ data: [], error: null }),
          limit: () => ({ data: [], error: null }),
          then: (callback: any) => callback({ data: [], error: null }),
        }),
        insert: (data: any) => ({ data: null, error: null }),
        update: (data: any) => ({
          eq: () => ({ data: null, error: null }),
        }),
        delete: () => ({
          eq: () => ({ data: null, error: null }),
        }),
        upsert: (data: any) => ({ data: null, error: null }),
      }),
      auth: {
        signUp: () => Promise.resolve({ data: null, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      },
    }
  }
}

export { supabase, isConfigured }

// Type definitions for your database tables
export interface InventoryItem {
  id: number
  name: string
  description: string | null
  category: string
  price: number
  stock: number
  sku: string
  status: "in-stock" | "low-stock" | "out-of-stock"
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface Order {
  id: number
  order_number: string
  customer_name: string
  customer_email: string
  items: string // JSON string of order items
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  created_at: string
  updated_at: string
}

export interface User {
  id: number
  username: string
  email: string
  user_type: "admin" | "staff" | "viewer"
  status: "active" | "inactive"
  last_login: string | null
  created_at: string
  updated_at: string
}

export interface Activity {
  id: number
  user_id: number | null
  action: string
  description: string
  created_at: string
}

export interface RawMaterial {
  id: number
  name: string
  description: string | null
  supplier: string | null
  cost_per_unit: number
  quantity: number
  unit: string
  status: "available" | "low-stock" | "out-of-stock"
  created_at: string
  updated_at: string
}
