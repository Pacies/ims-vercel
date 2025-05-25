"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { addActivity } from "@/lib/activity-store"

export default function Navbar() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentTime, setCurrentTime] = useState("")
  const pathname = usePathname()

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString())
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      addActivity(`Searched for "${searchTerm}"`)
      alert(`Searching for "${searchTerm}"...`)
      setSearchTerm("")
    }
  }

  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Inventory", path: "/inventory" },
    { name: "Products", path: "/products" },
    { name: "Reports", path: "/reports" },
  ]

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between py-3 px-4">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">2K</span>
            </div>
            <span className="text-gray-800 font-bold text-xl tracking-wider">2K Inventory</span>
          </Link>
          <div className="text-xs text-gray-500 ml-2">{currentTime}</div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <ul className="flex flex-wrap justify-center gap-1 mb-4 md:mb-0">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium relative transition-colors",
                    pathname === item.path ? "text-blue-600" : "text-gray-600 hover:text-blue-600",
                  )}
                  onClick={() => addActivity(`Navigated to ${item.name} page`)}
                >
                  {item.name}
                  {pathname === item.path && (
                    <motion.span
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                      layoutId="navbar-indicator"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <form onSubmit={handleSearch} className="relative w-full md:w-auto">
              <Input
                type="search"
                placeholder="Search..."
                className="w-full md:w-64 pl-9 bg-white border-gray-300 focus-visible:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            </form>

            <Avatar className="border-2 border-blue-500">
              <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
              <AvatarFallback>2K</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
