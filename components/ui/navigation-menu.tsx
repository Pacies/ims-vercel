"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Package, ShoppingBag, FileText, Users } from "lucide-react"

export default function NavigationLinks() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = sessionStorage.getItem("currentUser")
      if (user) {
        setCurrentUser(JSON.parse(user))
      }
    }
  }, [])

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "staff"],
    },
    {
      href: "/inventory",
      label: "Inventory",
      icon: Package,
      roles: ["admin", "staff"],
    },
    {
      href: "/products",
      label: "Products",
      icon: ShoppingBag,
      roles: ["admin", "staff"],
    },
    {
      href: "/reports",
      label: "Reports",
      icon: FileText,
      roles: ["admin", "staff"],
    },
    {
      href: "/manage-users",
      label: "Manage Users",
      icon: Users,
      roles: ["admin"], // Only admins can see this
    },
  ]

  const filteredNavItems = navItems.filter((item) => currentUser && item.roles.includes(currentUser.type))

  return (
    <nav className="space-y-1">
      {filteredNavItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
