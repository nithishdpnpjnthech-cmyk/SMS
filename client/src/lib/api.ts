const API_BASE = "http://localhost:5050/api";

/**
 * Generic API client
 */
class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    // 🚨 CRITICAL: Allow login without auth headers
    const isLoginRequest = endpoint === "/auth/login";
    
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    // Merge any additional headers from options
    if (options?.headers) {
      Object.assign(headers, options.headers);
    }
    
    // Only add auth headers for non-login requests
    if (!isLoginRequest) {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        throw new Error('Authentication required - please log in');
      }
      
      let user;
      try {
        user = JSON.parse(userStr);
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        throw new Error('Invalid session - please log in again');
      }
      
      if (!user.id || !user.role) {
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        throw new Error('Invalid user session - please log in again');
      }
      
      headers["x-user-role"] = user.role;
      headers["x-user-id"] = user.id;
      headers["x-user-branch"] = user.branchId || "";
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers,
      ...options,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = await response.text() || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
  }

  // ================= AUTH =================
  async login(credentials: { username: string; password: string }): Promise<any> {
    return this.request<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  // ================= DASHBOARD =================
  async getDashboardStats(branchId?: string): Promise<any> {
    const query = branchId ? `?branchId=${branchId}` : "";
    return this.request<any>(`/dashboard/stats${query}`);
  }

  // ================= STUDENTS =================
  async getStudents(branchId?: string): Promise<any[]> {
    const query = branchId ? `?branchId=${branchId}` : "";
    return this.request<any[]>(`/students${query}`);
  }

  async getAllStudents(branchId?: string): Promise<any[]> {
    const query = branchId ? `?branchId=${branchId}` : "";
    return this.request<any[]>(`/students/all${query}`);
  }

  async getStudent(id: string): Promise<any> {
    return this.request<any>(`/students/${id}`);
  }

  async createStudent(student: any): Promise<any> {
    return this.request<any>("/students", {
      method: "POST",
      body: JSON.stringify(student),
    });
  }

  async updateStudent(id: string, student: any): Promise<any> {
    return this.request<any>(`/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(student),
    });
  }

  async deleteStudent(id: string): Promise<void> {
    return this.request<void>(`/students/${id}`, {
      method: "DELETE",
    });
  }

  // ================= TRAINERS =================
  async getTrainers(branchId?: string): Promise<any[]> {
    const query = branchId ? `?branchId=${branchId}` : "";
    return this.request<any[]>(`/trainers${query}`);
  }

  async createTrainer(trainer: any): Promise<any> {
    return this.request<any>("/trainers", {
      method: "POST",
      body: JSON.stringify(trainer),
    });
  }

  async deleteTrainer(id: string): Promise<void> {
    return this.request<void>(`/trainers/${id}`, {
      method: "DELETE",
    });
  }

  // ================= BRANCHES =================
  async getBranches(): Promise<any[]> {
    return this.request<any[]>("/branches");
  }

  async getBranchDetails(branchId: string): Promise<any> {
    return this.request<any>(`/branches/${branchId}/details`);
  }

  async updateBranch(branchId: string, branchData: any): Promise<any> {
    return this.request<any>(`/branches/${branchId}`, {
      method: "PUT",
      body: JSON.stringify(branchData),
    });
  }

  async createBranch(branch: any): Promise<any> {
    return this.request<any>("/branches", {
      method: "POST",
      body: JSON.stringify(branch),
    });
  }

  // ================= ADMIN MASTER DATA =================
  async getAdminPrograms(): Promise<any[]> {
    return this.request<any[]>("/admin/programs");
  }

  async createProgram(program: { name: string; description?: string }): Promise<any> {
    return this.request<any>("/admin/programs", {
      method: "POST",
      body: JSON.stringify(program),
    });
  }

  async updateProgramStatus(id: string, status: string): Promise<any> {
    return this.request<any>(`/admin/programs/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  async getAdminBatches(): Promise<any[]> {
    return this.request<any[]>("/admin/batches");
  }

  async createBatch(batch: { name: string; description?: string }): Promise<any> {
    return this.request<any>("/admin/batches", {
      method: "POST",
      body: JSON.stringify(batch),
    });
  }

  async updateBatchStatus(id: string, status: string): Promise<any> {
    return this.request<any>(`/admin/batches/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  // ================= BATCHES =================
  async getBatches(): Promise<any[]> {
    return this.request<any[]>("/batches");
  }

  // ================= PROGRAMS =================
  async getPrograms(): Promise<any[]> {
    return this.request<any[]>("/programs");
  }

  // ================= ID CARD =================
  async generateIdCard(studentId: string): Promise<any> {
    return this.request<any>(`/students/${studentId}/id-card`, {
      method: "POST",
    });
  }

  // ================= ATTENDANCE =================
  async getAttendance(studentId?: string, date?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (studentId) params.append("studentId", studentId);
    if (date) params.append("date", date);
    const query = params.toString() ? `?${params}` : "";
    return this.request<any[]>(`/attendance${query}`);
  }

  async createAttendance(attendance: any): Promise<any> {
    return this.request<any>("/attendance", {
      method: "POST",
      body: JSON.stringify(attendance),
    });
  }

  async createBulkAttendance(attendanceRecords: any[]): Promise<any> {
    return this.request<any>("/attendance/bulk", {
      method: "POST",
      body: JSON.stringify({ attendanceRecords }),
    });
  }

  async updateAttendance(id: string, attendance: any): Promise<any> {
    return this.request<any>(`/attendance/${id}`, {
      method: "PUT",
      body: JSON.stringify(attendance),
    });
  }

  // ================= FEES =================
  async getFees(branchId?: string, studentId?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (branchId) params.append("branchId", branchId);
    if (studentId) params.append("studentId", studentId);
    const query = params.toString() ? `?${params}` : "";
    return this.request<any[]>(`/fees${query}`);
  }

  async getStudentDues(studentId: string): Promise<any> {
    return this.request<any>(`/students/${studentId}/dues`);
  }

  async createFee(fee: any): Promise<any> {
    return this.request<any>("/fees", {
      method: "POST",
      body: JSON.stringify(fee),
    });
  }

  async updateFee(id: string, fee: any): Promise<any> {
    return this.request<any>(`/fees/${id}`, {
      method: "PUT",
      body: JSON.stringify(fee),
    });
  }

  // ================= TRAINER SPECIFIC =================
  async getTrainerDashboard(trainerId: string): Promise<any> {
    return this.request<any>(`/trainers/${trainerId}/dashboard`);
  }

  async getTrainerStudents(trainerId: string): Promise<any[]> {
    return this.request<any[]>(`/trainers/${trainerId}/students`);
  }

  async getTrainerBatches(trainerId: string): Promise<any[]> {
    return this.request<any[]>(`/trainers/${trainerId}/batches`);
  }

  async assignTrainerToBatch(
    trainerId: string,
    batchName: string,
    program: string
  ): Promise<any> {
    return this.request<any>(`/trainers/${trainerId}/batches`, {
      method: "POST",
      body: JSON.stringify({ batchName, program }),
    });
  }
}

export const api = new ApiClient();
