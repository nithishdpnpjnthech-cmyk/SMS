import { addDays, subDays, format } from "date-fns";

export type UserRole = "admin" | "manager" | "receptionist" | "trainer" | "parent";

export interface Student {
  id: string;
  name: string;
  program: string;
  batch: string;
  status: "active" | "inactive" | "on-leave";
  joinDate: string;
  parentName: string;
  phone: string;
  feesStatus: "paid" | "due" | "overdue";
  attendance: number; // percentage
  avatar?: string;
}

export interface Trainer {
  id: string;
  name: string;
  specialty: string;
  status: "active" | "on-leave";
  phone: string;
  email: string;
  avatar?: string;
  rating: number;
}

export interface ClassSession {
  id: string;
  program: string;
  batch: string;
  trainerId: string;
  time: string;
  date: string;
  capacity: number;
  enrolled: number;
  status: "scheduled" | "completed" | "cancelled";
}

export const PROGRAMS = ["Karate", "Yoga", "Dance", "Arts & Crafts", "Music"];
export const BATCHES = ["Morning 6-7", "Morning 7-8", "Evening 4-5", "Evening 5-6", "Evening 6-7"];

export const STUDENTS: Student[] = [
  {
    id: "ST-001",
    name: "Alex Johnson",
    program: "Karate",
    batch: "Evening 5-6",
    status: "active",
    joinDate: "2024-01-15",
    parentName: "David Johnson",
    phone: "+1 (555) 123-4567",
    feesStatus: "paid",
    attendance: 92,
  },
  {
    id: "ST-002",
    name: "Mia Williams",
    program: "Dance",
    batch: "Evening 4-5",
    status: "active",
    joinDate: "2024-02-10",
    parentName: "Sarah Williams",
    phone: "+1 (555) 234-5678",
    feesStatus: "due",
    attendance: 85,
  },
  {
    id: "ST-003",
    name: "Ethan Brown",
    program: "Yoga",
    batch: "Morning 6-7",
    status: "active",
    joinDate: "2024-03-05",
    parentName: "Michael Brown",
    phone: "+1 (555) 345-6789",
    feesStatus: "overdue",
    attendance: 78,
  },
  {
    id: "ST-004",
    name: "Sophia Davis",
    program: "Arts & Crafts",
    batch: "Evening 6-7",
    status: "on-leave",
    joinDate: "2023-11-20",
    parentName: "Jennifer Davis",
    phone: "+1 (555) 456-7890",
    feesStatus: "paid",
    attendance: 60,
  },
  {
    id: "ST-005",
    name: "Lucas Miller",
    program: "Karate",
    batch: "Evening 5-6",
    status: "active",
    joinDate: "2024-01-20",
    parentName: "Robert Miller",
    phone: "+1 (555) 567-8901",
    feesStatus: "paid",
    attendance: 95,
  },
];

export const TRAINERS: Trainer[] = [
  {
    id: "TR-001",
    name: "Sensei Kenji",
    specialty: "Karate",
    status: "active",
    phone: "+1 (555) 999-0001",
    email: "kenji@academy.com",
    rating: 4.9,
  },
  {
    id: "TR-002",
    name: "Elena Rodriguez",
    specialty: "Dance",
    status: "active",
    phone: "+1 (555) 999-0002",
    email: "elena@academy.com",
    rating: 4.8,
  },
  {
    id: "TR-003",
    name: "Priya Sharma",
    specialty: "Yoga",
    status: "active",
    phone: "+1 (555) 999-0003",
    email: "priya@academy.com",
    rating: 4.7,
  },
];

export const TODAY_CLASSES: ClassSession[] = [
  {
    id: "CL-101",
    program: "Yoga",
    batch: "Morning 6-7",
    trainerId: "TR-003",
    time: "06:00 AM",
    date: format(new Date(), "yyyy-MM-dd"),
    capacity: 20,
    enrolled: 15,
    status: "completed",
  },
  {
    id: "CL-102",
    program: "Dance",
    batch: "Evening 4-5",
    trainerId: "TR-002",
    time: "04:00 PM",
    date: format(new Date(), "yyyy-MM-dd"),
    capacity: 25,
    enrolled: 22,
    status: "scheduled",
  },
  {
    id: "CL-103",
    program: "Karate",
    batch: "Evening 5-6",
    trainerId: "TR-001",
    time: "05:00 PM",
    date: format(new Date(), "yyyy-MM-dd"),
    capacity: 30,
    enrolled: 28,
    status: "scheduled",
  },
];

export const RECENT_FEES = [
  { id: "INV-001", student: "Alex Johnson", amount: 150, date: "2024-05-01", status: "paid" },
  { id: "INV-002", student: "Lucas Miller", amount: 150, date: "2024-05-02", status: "paid" },
  { id: "INV-003", student: "Mia Williams", amount: 120, date: "2024-05-03", status: "pending" },
];

export const STATS = {
  totalStudents: 124,
  presentToday: 45,
  absentToday: 5,
  feesCollectedToday: 450,
  pendingDues: 1250,
};
