"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Activity, Package, Edit, Trash2, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getActivities } from "@/lib/database"
import type { Activity as ActivityType } from "@/lib/supabaseClient"

export default function ActivityList() {
  const [activities, setActivities] = useState<ActivityType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()

    // Set up polling to refresh activities every 30 seconds
    const interval = setInterval(loadActivities, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadActivities = async () => {
    try {
      const data = await getActivities(10)
      setActivities(data)
    } catch (error) {
      console.error("Error loading activities:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "create":
        return <Plus className="h-4 w-4" />
      case "update":
        return <Edit className="h-4 w-4" />
      case "delete":
        return <Trash2 className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getActivityColor = (action: string) => {
    switch (action) {
      case "create":
        return "bg-green-100 text-green-800"
      case "update":
        return "bg-blue-100 text-blue-800"
      case "delete":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No recent activity</p>
            <p className="text-sm text-gray-400">Activity will appear here as you use the system</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className={`p-2 rounded-full ${getActivityColor(activity.action)}`}>
                  {getActivityIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <Badge variant="outline" className="text-xs">
                      {formatTime(activity.created_at)}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activities.length > 0 && (
          <div className="mt-4 text-center">
            <button onClick={loadActivities} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Refresh Activity
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
