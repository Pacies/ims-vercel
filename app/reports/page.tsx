"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { FileText, Download, Filter, BarChart3, TrendingUp, Package, AlertTriangle } from "lucide-react"
import MainLayout from "@/components/main-layout"
import PageHeader from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Badge } from "@/components/ui/badge"

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState("")
  const [dateRange, setDateRange] = useState(null)

  const reportTypes = [
    {
      id: "inventory-summary",
      title: "Inventory Summary",
      description: "Complete overview of current inventory status",
      icon: <Package className="h-5 w-5" />,
      color: "bg-blue-500",
    },
    {
      id: "low-stock",
      title: "Low Stock Report",
      description: "Items that need restocking",
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "bg-orange-500",
    },
    {
      id: "stock-movement",
      title: "Stock Movement",
      description: "Track inventory changes over time",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "bg-green-500",
    },
    {
      id: "product-performance",
      title: "Product Performance",
      description: "Analyze product trends and performance",
      icon: <BarChart3 className="h-5 w-5" />,
      color: "bg-purple-500",
    },
  ]

  const handleGenerateReport = () => {
    if (!selectedReport) {
      alert("Please select a report type")
      return
    }
    alert(`Generating ${reportTypes.find((r) => r.id === selectedReport)?.title} report...`)
  }

  const handleExport = (format: string) => {
    alert(`Exporting report as ${format.toUpperCase()}...`)
  }

  return (
    <MainLayout>
      <PageHeader title="Inventory Reports" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration */}
        <motion.div
          className="lg:col-span-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Filter className="h-5 w-5" />
                Report Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Report Type</label>
                <Select value={selectedReport} onValueChange={setSelectedReport}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((report) => (
                      <SelectItem key={report.id} value={report.id}>
                        {report.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Date Range</label>
                <DatePickerWithRange date={dateRange} setDate={setDateRange} />
              </div>

              <div className="space-y-2">
                <Button onClick={handleGenerateReport} className="w-full bg-blue-600 hover:bg-blue-700">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleExport("pdf")}>
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleExport("excel")}>
                    <Download className="h-4 w-4 mr-1" />
                    Excel
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleExport("csv")}>
                    <Download className="h-4 w-4 mr-1" />
                    CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Report Types */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-800">Available Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportTypes.map((report, index) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedReport === report.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedReport(report.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${report.color} text-white`}>{report.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{report.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                        {selectedReport === report.id && (
                          <Badge className="mt-2 bg-blue-100 text-blue-800">Selected</Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Report Preview Area */}
      <motion.div
        className="mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-800">Report Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No report generated yet</p>
              <p className="text-sm text-gray-400">
                Select a report type and click "Generate Report" to see the preview
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </MainLayout>
  )
}
