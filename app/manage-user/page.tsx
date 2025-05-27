"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { UserPlus, Download, Edit, Trash2, Users, Shield, User } from "lucide-react"
import MainLayout from "@/components/main-layout"
import PageHeader from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

// Mock users database
const initialUsers: any[] = [
  {
    id: 1,
    username: "admin",
    password: "admin123",
    type: "admin",
    status: "active",
    lastLogin: "2024-01-15 10:30:00",
    createdDate: "2024-01-01 09:00:00",
  },
  {
    id: 2,
    username: "staff",
    password: "staff123",
    type: "staff",
    status: "active",
    lastLogin: "2024-01-14 14:20:00",
    createdDate: "2024-01-02 11:00:00",
  },
  {
    id: 3,
    username: "john_staff",
    password: "john123",
    type: "staff",
    status: "active",
    lastLogin: "2024-01-13 16:45:00",
    createdDate: "2024-01-05 13:30:00",
  },
]

interface UserInterface {
  id: number
  username: string
  password: string
  type: "admin" | "staff"
  status: "active" | "inactive"
  lastLogin: string
  createdDate: string
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<any[]>(initialUsers)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [userToDelete, setUserToDelete] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    type: "",
    status: "active",
  })
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check admin access
    const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}")
    if (currentUser.type !== "admin") {
      toast({
        title: "Access Denied",
        description: "Admin privileges required.",
        variant: "destructive",
      })
      router.push("/dashboard")
      return
    }
  }, [router, toast])

  const handleAddUser = () => {
    setFormData({ username: "", password: "", type: "", status: "active" })
    setIsAddModalOpen(true)
  }

  const handleEditUser = (user: any) => {
    setSelectedUser(user)
    setFormData({
      username: user.username,
      password: user.password,
      type: user.type,
      status: user.status,
    })
    setIsEditModalOpen(true)
  }

  const handleDeleteUser = (user: any) => {
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  const saveUser = (isEdit = false) => {
    // Validate form
    if (!formData.username || !formData.password || !formData.type) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    // Check for duplicate username
    const existingUser = users.find((u) => u.username === formData.username && (!isEdit || u.id !== selectedUser?.id))
    if (existingUser) {
      toast({
        title: "Username Exists",
        description: "Please choose a different username.",
        variant: "destructive",
      })
      return
    }

    if (isEdit && selectedUser) {
      // Update existing user
      setUsers(
        users.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                ...formData,
                type: formData.type as "admin" | "staff",
                status: formData.status as "active" | "inactive",
              }
            : u,
        ),
      )
      setIsEditModalOpen(false)
      toast({
        title: "Success",
        description: "User updated successfully!",
      })
    } else {
      // Add new user
      const newUser: UserInterface = {
        id: Math.max(...users.map((u) => u.id)) + 1,
        ...formData,
        type: formData.type as "admin" | "staff",
        status: formData.status as "active" | "inactive",
        lastLogin: "Never",
        createdDate: new Date().toISOString().slice(0, 19).replace("T", " "),
      }
      setUsers([...users, newUser])
      setIsAddModalOpen(false)
      toast({
        title: "Success",
        description: "User added successfully!",
      })
    }
  }

  const confirmDelete = () => {
    if (userToDelete) {
      setUsers(users.filter((u) => u.id !== userToDelete.id))
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
      toast({
        title: "Success",
        description: "User deleted successfully!",
      })
    }
  }

  const exportUsers = () => {
    const headers = ["Username", "User Type", "Status", "Last Login", "Created Date"]
    const csvContent = [
      headers.join(","),
      ...users.map((user) => [user.username, user.type, user.status, user.lastLogin, user.createdDate].join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "users_export.csv"
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Success",
      description: "Users exported successfully!",
    })
  }

  const formatDate = (dateString: string) => {
    if (dateString === "Never") return "Never"
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  const getUserTypeIcon = (type: string) => {
    return type === "admin" ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />
  }

  const getUserTypeBadge = (type: string) => {
    return type === "admin" ? (
      <Badge className="bg-purple-100 text-purple-800">
        <Shield className="h-3 w-3 mr-1" />
        Admin
      </Badge>
    ) : (
      <Badge className="bg-blue-100 text-blue-800">
        <User className="h-3 w-3 mr-1" />
        Staff
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Inactive</Badge>
    )
  }

  return (
    <MainLayout>
      <PageHeader title="Manage Users" />

      {/* Quick Actions */}
      <div className="flex gap-4 mb-6">
        <Button onClick={handleAddUser} className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
        <Button variant="outline" onClick={exportUsers}>
          <Download className="h-4 w-4 mr-2" />
          Export Users
        </Button>
      </div>

      {/* Users Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              System Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Username</th>
                    <th className="text-left py-3 px-4 font-medium">User Type</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Last Login</th>
                    <th className="text-left py-3 px-4 font-medium">Created Date</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 font-medium">{user.username}</td>
                      <td className="py-3 px-4">{getUserTypeBadge(user.type)}</td>
                      <td className="py-3 px-4">{getStatusBadge(user.status)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(user.lastLogin)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(user.createdDate)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Add User Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <div>
              <Label htmlFor="type">User Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => saveUser(false)}>Save User</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>
            <div>
              <Label htmlFor="edit-password">Password</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <div>
              <Label htmlFor="edit-type">User Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => saveUser(true)}>Update User</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  )
}
