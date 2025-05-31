"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"

interface PageHeaderProps {
  title: string
  description?: string
  icon?: React.ComponentType<any>
  children?: ReactNode
}

export default function PageHeader({ title, description, icon: Icon, children }: PageHeaderProps) {
  return (
    <motion.div
      className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b border-border"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-7 w-7 text-blue-600" />}
        <div>
          <h1 className="text-3xl font-light tracking-tight mb-1">{title}</h1>
          {description && <p className="text-muted-foreground text-base">{description}</p>}
        </div>
      </div>
      {children}
    </motion.div>
  )
}
