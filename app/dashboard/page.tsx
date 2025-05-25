"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Package, ShoppingCart, TrendingUp, AlertTriangle } from "lucide-react"
import MainLayout from "@/components/main-layout"
import PageHeader from "@/components/page-header"
import StatCard from "@/components/stat-card"
import ActivityList from "@/components/activity-list"
import AlertList from "@/components/alert-list"
import DatabaseStatus from "@/components/database-status"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardStats, getLowStockItems } from "@/lib/database"

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalItems: 0,
    categories: 0,
    lowStockItems: 0,
    totalOrders: 0,
    totalValue: 0,
  })
  const [lowStockItems, setLowStockItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [dashboardStats, lowStock] = await Promise.all([getDashboardStats(), getLowStockItems()])

      setStats(dashboardStats)
      setLowStockItems(lowStock)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <PageHeader title="Dashboard" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <PageHeader title="Dashboard" />

      {/* Database Status */}
      <div className="mb-6">
        <DatabaseStatus />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard value={stats.totalItems} label="Total Items" icon={<Package className="h-6 w-6" />} delay={0.1} />
        <StatCard
          value={stats.totalOrders}
          label="Total Orders"
          icon={<ShoppingCart className="h-6 w-6" />}
          delay={0.2}
        />
        <StatCard
          value={stats.lowStockItems}
          label="Low Stock Alerts"
          icon={<AlertTriangle className="h-6 w-6" />}
          delay={0.3}
          variant={stats.lowStockItems > 0 ? "warning" : "default"}
        />
        <StatCard
          value={`$${stats.totalValue.toLocaleString()}`}
          label="Total Value"
          icon={<TrendingUp className="h-6 w-6" />}
          delay={0.4}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityList />
            </CardContent>
          </Card>
        </motion.div>

        {/* Alerts */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader>
              <CardTitle>Alerts & Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <AlertList lowStockItems={lowStockItems} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  )
}
