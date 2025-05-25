export interface Order {
  id: string
  date: string
  customer: string
  items: string
  total: number
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled"
}

// Generate random orders
export function generateOrders(count: number): Order[] {
  const statuses: Order["status"][] = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]
  const customers = ["John Doe", "Jane Smith", "Robert Johnson", "Emily Davis", "Michael Brown"]
  const orders: Order[] = []

  for (let i = 0; i < count; i++) {
    const items = Math.floor(Math.random() * 5) + 1
    const total = Number.parseFloat((Math.random() * 500 + 20).toFixed(2))
    const status = statuses[Math.floor(Math.random() * statuses.length)]

    // Generate a random date within the last 30 days
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(Math.random() * 30))

    orders.push({
      id: (1000 + i).toString(),
      date: date.toLocaleDateString(),
      customer: customers[Math.floor(Math.random() * customers.length)],
      items: `${items} item${items > 1 ? "s" : ""}`,
      total: total,
      status: status,
    })
  }

  return orders
}
