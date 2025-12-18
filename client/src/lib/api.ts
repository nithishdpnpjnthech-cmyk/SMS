const API_BASE = 'http://localhost:5000/api';

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error ${response.status}:`, errorText);
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  // Auth
  async login(credentials: { username: string; password: string; role: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // Students
  async getStudents(branchId?: string) {
    const query = branchId ? `?branchId=${branchId}` : '';
    return this.request(`/students${query}`);
  }

  async getStudent(id: string) {
    return this.request(`/students/${id}`);
  }

  async createStudent(student: any) {
    return this.request('/students', {
      method: 'POST',
      body: JSON.stringify(student),
    });
  }

  async updateStudent(id: string, student: any) {
    return this.request(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(student),
    });
  }

  // Trainers
  async getTrainers(branchId?: string) {
    const query = branchId ? `?branchId=${branchId}` : '';
    return this.request(`/trainers${query}`);
  }

  async createTrainer(trainer: any) {
    return this.request('/trainers', {
      method: 'POST',
      body: JSON.stringify(trainer),
    });
  }

  // Branches
  async getBranches() {
    return this.request('/branches');
  }

  async createBranch(branch: any) {
    return this.request('/branches', {
      method: 'POST',
      body: JSON.stringify(branch),
    });
  }

  // Attendance
  async getAttendance(studentId?: string, date?: string) {
    const params = new URLSearchParams();
    if (studentId) params.append('studentId', studentId);
    if (date) params.append('date', date);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/attendance${query}`);
  }

  async createAttendance(attendance: any) {
    return this.request('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendance),
    });
  }

  // Fees
  async getFees(studentId?: string) {
    const query = studentId ? `?studentId=${studentId}` : '';
    return this.request(`/fees${query}`);
  }

  async createFee(fee: any) {
    return this.request('/fees', {
      method: 'POST',
      body: JSON.stringify(fee),
    });
  }

  async updateFee(id: string, fee: any) {
    return this.request(`/fees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(fee),
    });
  }
}

export const api = new ApiClient();