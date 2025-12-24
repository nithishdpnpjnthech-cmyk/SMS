const API_BASE = "http://localhost:5050/api";

class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    // Get user info from localStorage for auth headers
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        "x-user-role": user.role || "",
        "x-user-id": user.id || "",
        "x-user-branch": user.branch_id || "",
        ...(options?.headers || {}),
      },
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
      console.error(`API Error ${response.status}:`, errorMessage);
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // ================= AUTH =================
  async login(credentials: { username: string; password: string }) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  // ================= DASHBOARD =================
  async getDashboardStats(branchId?: string) {
    const query = branchId ? `?branchId=${branchId}` : "";
    return this.request(`/dashboard/stats${query}`);
  }

  // ================= STUDENTS =================
  async getStudents(branchId?: string) {
    const query = branchId ? `?branchId=${branchId}` : "";
    return this.request(`/students${query}`);
  }

  async getAllStudents(branchId?: string) {
    const query = branchId ? `?branchId=${branchId}` : "";
    return this.request(`/students/all${query}`);
  }

  async getStudent(id: string) {
    return this.request(`/students/${id}`);
  }

  async createStudent(student: any) {
    return this.request("/students", {
      method: "POST",
      body: JSON.stringify(student),
    });
  }

  async updateStudent(id: string, student: any) {
    return this.request(`/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(student),
    });
  }

  async deleteStudent(id: string) {
    return this.request(`/students/${id}`, {
      method: "DELETE",
    });
  }

  // ================= TRAINERS =================
  async getTrainers(branchId?: string) {
    const query = branchId ? `?branchId=${branchId}` : "";
    return this.request(`/trainers${query}`);
  }

  async createTrainer(trainer: any) {
    return this.request("/trainers", {
      method: "POST",
      body: JSON.stringify(trainer),
    });
  }

  async deleteTrainer(id: string) {
    return this.request(`/trainers/${id}`, {
      method: "DELETE",
    });
  }

  // ================= BRANCHES =================
  async getBranches() {
    return this.request("/branches");
  }

  async getBranchDetails(branchId: string) {
    return this.request(`/branches/${branchId}/details`);
  }

  async updateBranch(branchId: string, branchData: any) {
    return this.request(`/branches/${branchId}`, {
      method: "PUT",
      body: JSON.stringify(branchData),
    });
  }

  async createBranch(branch: any) {
    return this.request("/branches", {
      method: "POST",
      body: JSON.stringify(branch),
    });
  }

  // ================= ADMIN MASTER DATA =================
  async getAdminPrograms() {
    return this.request("/admin/programs");
  }

  async createProgram(program: { name: string; description?: string }) {
    return this.request("/admin/programs", {
      method: "POST",
      body: JSON.stringify(program),
    });
  }

  async updateProgramStatus(id: string, status: string) {
    return this.request(`/admin/programs/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  async getAdminBatches() {
    return this.request("/admin/batches");
  }

  async createBatch(batch: { name: string; description?: string }) {
    return this.request("/admin/batches", {
      method: "POST",
      body: JSON.stringify(batch),
    });
  }

  async updateBatchStatus(id: string, status: string) {
    return this.request(`/admin/batches/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  // ================= BATCHES =================
  async getBatches() {
    return this.request("/batches");
  }

  // ================= PROGRAMS =================
  async getPrograms() {
    return this.request("/programs");
  }

  // ================= ID CARD =================
  async generateIdCard(studentId: string) {
    return this.request(`/students/${studentId}/id-card`, {
      method: "POST",
    });
  }

  // ================= ATTENDANCE =================
  async getAttendance(studentId?: string, date?: string) {
    const params = new URLSearchParams();
    if (studentId) params.append("studentId", studentId);
    if (date) params.append("date", date);
    const query = params.toString() ? `?${params}` : "";
    return this.request(`/attendance${query}`);
  }

  async createAttendance(attendance: any) {
    return this.request("/attendance", {
      method: "POST",
      body: JSON.stringify(attendance),
    });
  }

  async createBulkAttendance(attendanceRecords: any[]) {
    console.log("API: Sending bulk attendance request:", { attendanceRecords });
    try {
      const response = await this.request("/attendance/bulk", {
        method: "POST",
        body: JSON.stringify({ attendanceRecords }),
      });
      console.log("API: Bulk attendance response:", response);
      return response;
    } catch (error) {
      console.error("API: Bulk attendance error:", error);
      throw error;
    }
  }

  async updateAttendance(id: string, attendance: any) {
    return this.request(`/attendance/${id}`, {
      method: "PUT",
      body: JSON.stringify(attendance),
    });
  }

  // ================= FEES =================
  async getFees(studentId?: string) {
    const query = studentId ? `?studentId=${studentId}` : "";
    return this.request(`/fees${query}`);
  }

  async getStudentDues(studentId: string) {
    return this.request(`/students/${studentId}/dues`);
  }

  async createFee(fee: any) {
    return this.request("/fees", {
      method: "POST",
      body: JSON.stringify(fee),
    });
  }

  async updateFee(id: string, fee: any) {
    return this.request(`/fees/${id}`, {
      method: "PUT",
      body: JSON.stringify(fee),
    });
  }

  // ================= TRAINER SPECIFIC =================
  async getTrainerDashboard(trainerId: string) {
    return this.request(`/trainers/${trainerId}/dashboard`);
  }

  async getTrainerStudents(trainerId: string) {
    return this.request(`/trainers/${trainerId}/students`);
  }

  async getTrainerBatches(trainerId: string) {
    return this.request(`/trainers/${trainerId}/batches`);
  }

  async assignTrainerToBatch(trainerId: string, batchName: string, program: string) {
    return this.request(`/trainers/${trainerId}/batches`, {
      method: "POST",
      body: JSON.stringify({ batchName, program }),
    });
  }
}

export const api = new ApiClient();
