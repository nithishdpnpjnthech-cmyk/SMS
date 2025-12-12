import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Student, ClassSession, STUDENTS, TODAY_CLASSES, RECENT_FEES } from "./mockData";

// Define Data Types
export interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  date: string;
  type: string;
  mode: string;
  status: "paid" | "pending";
}

export interface AttendanceRecord {
  id: string;
  date: string;
  program: string;
  batch: string;
  studentId: string;
  status: "present" | "absent" | "late";
}

interface AppState {
  students: Student[];
  fees: FeeRecord[];
  attendance: AttendanceRecord[];
  classes: ClassSession[];
  addStudent: (student: Omit<Student, "id">) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  addFee: (fee: Omit<FeeRecord, "id">) => void;
  markAttendance: (record: AttendanceRecord) => void;
  getStudent: (id: string) => Student | undefined;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage or mock data
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem("academy_students");
    return saved ? JSON.parse(saved) : STUDENTS;
  });

  const [fees, setFees] = useState<FeeRecord[]>(() => {
    const saved = localStorage.getItem("academy_fees");
    // Map mock data to FeeRecord format if initial load
    if (!saved) {
      return RECENT_FEES.map(f => ({
        id: f.id,
        studentId: "UNKNOWN", // Mock data didn't have IDs linked perfectly
        studentName: f.student,
        amount: f.amount,
        date: f.date,
        type: "Tuition",
        mode: "Cash",
        status: f.status as "paid" | "pending"
      }));
    }
    return JSON.parse(saved);
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem("academy_attendance");
    return saved ? JSON.parse(saved) : [];
  });

  const [classes] = useState<ClassSession[]>(TODAY_CLASSES);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem("academy_students", JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem("academy_fees", JSON.stringify(fees));
  }, [fees]);

  useEffect(() => {
    localStorage.setItem("academy_attendance", JSON.stringify(attendance));
  }, [attendance]);

  // Actions
  const addStudent = (newStudent: Omit<Student, "id">) => {
    const id = `ST-${(students.length + 1).toString().padStart(3, "0")}`;
    const studentWithId = { ...newStudent, id };
    setStudents(prev => [studentWithId, ...prev]);
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setStudents(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
  };

  const addFee = (newFee: Omit<FeeRecord, "id">) => {
    const id = `INV-${(fees.length + 1).toString().padStart(3, "0")}`;
    const feeWithId = { ...newFee, id };
    setFees(prev => [feeWithId, ...prev]);
    
    // Update student status if needed
    if (newFee.status === 'paid') {
      setStudents(prev => prev.map(s => 
        s.id === newFee.studentId ? { ...s, feesStatus: 'paid' } : s
      ));
    }
  };

  const markAttendance = (record: AttendanceRecord) => {
    setAttendance(prev => {
      // Remove existing record for same day/student if exists to allow update
      const filtered = prev.filter(r => 
        !(r.date === record.date && r.studentId === record.studentId && r.batch === record.batch)
      );
      return [...filtered, { ...record, id: Math.random().toString(36).substr(2, 9) }];
    });
  };

  const getStudent = (id: string) => students.find(s => s.id === id);

  return (
    <AppContext.Provider value={{ students, fees, attendance, classes, addStudent, updateStudent, addFee, markAttendance, getStudent }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppStore must be used within an AppProvider");
  }
  return context;
}
