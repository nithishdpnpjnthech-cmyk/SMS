import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        role: string;
        branchId: string | null;
      };
      student?: {
        id: string;
        name: string;
        email?: string;
        phone?: string;
        parent_phone?: string;
        address?: string;
        branch_id: string;
        branch_name?: string;
        program?: string;
        batch?: string;
        joining_date?: Date;
        status: string;
      };
      studentId?: string; // Add studentId for JWT-verified requests
    }
  }
}