export interface AdminOrder {
  id: string;
  customer: string;
  amount: number;
  status: "pending" | "processing" | "delivered";
  date: string;
}

export const monthlySales = [
  { label: "Jan", value: 32 },
  { label: "Feb", value: 45 },
  { label: "Mar", value: 40 },
  { label: "Apr", value: 56 },
  { label: "May", value: 63 },
  { label: "Jun", value: 58 }
];

export const latestOrders: AdminOrder[] = [
  { id: "ORD-4901", customer: "Rohan Sharma", amount: 229, status: "processing", date: "2026-04-24" },
  { id: "ORD-4900", customer: "Aisha Khan", amount: 149, status: "delivered", date: "2026-04-24" },
  { id: "ORD-4899", customer: "Vivek Patel", amount: 89, status: "pending", date: "2026-04-23" },
  { id: "ORD-4898", customer: "Sara Ali", amount: 179, status: "delivered", date: "2026-04-23" },
  { id: "ORD-4897", customer: "Arjun Mehta", amount: 120, status: "processing", date: "2026-04-22" }
];

