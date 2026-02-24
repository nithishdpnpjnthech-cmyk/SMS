// ================= BASE URL =================
// Use Vite-provided env var when available, otherwise fall back to relative path.
// Keep default as empty string so endpoints (which include the `/api` prefix)
// resolve correctly against the current origin when no VITE_API_URL is set.
const API_BASE = ((import.meta as any).env?.VITE_API_URL || "").replace(/\/$/, "");

// ================= API WRAPPER =================
export const api = {
  // ---------- GET ----------
  get: async (endpoint: string, headers: Record<string, string> = {}) => {
    const fullUrl = `${API_BASE}${endpoint}`;
    // Dev-only debug to help diagnose 404s
    try {
      const mode = (import.meta as any).env?.MODE || (import.meta as any).env?.VITE_MODE || 'development';
      if (mode !== 'production' && typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.debug('[api] GET', fullUrl, { headers });
      }
    } catch (e) {
      // swallow - import.meta might not be available in some runtime checks
    }

    const response = await fetch(fullUrl, {
      method: 'GET',
      credentials: 'include', // 🔥 REQUIRED
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': localStorage.getItem('userId') || '',
        'x-user-role': localStorage.getItem('userRole') || '',
        'x-user-branch': localStorage.getItem('userBranch') || '',
        ...headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error ${response.status}:`, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  // ---------- POST ----------
  post: async (endpoint: string, data: any, headers: Record<string, string> = {}) => {
    const fullUrl = `${API_BASE}${endpoint}`;
    try {
      const mode = (import.meta as any).env?.MODE || (import.meta as any).env?.VITE_MODE || 'development';
      if (mode !== 'production' && typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.debug('[api] POST', fullUrl, { headers, bodyPreview: data && typeof data === 'object' ? { ...data, password: data.password ? '***' : undefined } : data });
      }
    } catch (e) { }

    const response = await fetch(fullUrl, {
      method: 'POST',
      credentials: 'include', // 🔥 REQUIRED
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': localStorage.getItem('userId') || '',
        'x-user-role': localStorage.getItem('userRole') || '',
        'x-user-branch': localStorage.getItem('userBranch') || '',
        ...headers,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error ${response.status}:`, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  // ---------- PUT ----------
  put: async (endpoint: string, data: any, headers: Record<string, string> = {}) => {
    const fullUrl = `${API_BASE}${endpoint}`;
    try {
      const mode = (import.meta as any).env?.MODE || (import.meta as any).env?.VITE_MODE || 'development';
      if (mode !== 'production' && typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.debug('[api] PUT', fullUrl);
      }
    } catch (e) { }

    const response = await fetch(fullUrl, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': localStorage.getItem('userId') || '',
        'x-user-role': localStorage.getItem('userRole') || '',
        'x-user-branch': localStorage.getItem('userBranch') || '',
        ...headers,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  // ---------- PATCH ----------
  patch: async (endpoint: string, data: any, headers: Record<string, string> = {}) => {
    const fullUrl = `${API_BASE}${endpoint}`;
    try {
      const mode = (import.meta as any).env?.MODE || (import.meta as any).env?.VITE_MODE || 'development';
      if (mode !== 'production' && typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.debug('[api] PATCH', fullUrl);
      }
    } catch (e) { }

    const response = await fetch(fullUrl, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': localStorage.getItem('userId') || '',
        'x-user-role': localStorage.getItem('userRole') || '',
        'x-user-branch': localStorage.getItem('userBranch') || '',
        ...headers,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  // ---------- DELETE ----------
  delete: async (endpoint: string, headers: Record<string, string> = {}) => {
    const fullUrl = `${API_BASE}${endpoint}`;
    try {
      const mode = (import.meta as any).env?.MODE || (import.meta as any).env?.VITE_MODE || 'development';
      if (mode !== 'production' && typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.debug('[api] DELETE', fullUrl);
      }
    } catch (e) { }

    const response = await fetch(fullUrl, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': localStorage.getItem('userId') || '',
        'x-user-role': localStorage.getItem('userRole') || '',
        'x-user-branch': localStorage.getItem('userBranch') || '',
        ...headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  // ================= AUTH =================
  // Use existing `post` helper so URL construction is consistent across the app.
  login: async (credentials: { username: string; password: string }) =>
    api.post('/api/auth/login', credentials),

  // ================= ADMIN =================
  getAdminPrograms: async () => api.get('/api/admin/programs'),
  getAdminBatches: async () => api.get('/api/admin/batches'),

  createProgram: async (data: { name: string; description?: string }) =>
    api.post('/api/admin/programs', data),

  createBatch: async (data: { name: string; description?: string }) =>
    api.post('/api/admin/batches', data),

  updateProgramStatus: async (id: string, status: string) =>
    api.put(`/api/admin/programs/${id}`, { status }),

  updateBatchStatus: async (id: string, status: string) =>
    api.put(`/api/admin/batches/${id}`, { status }),

  // ================= COMMON =================
  getBranches: async () => api.get('/api/branches'),
  getBranchDetails: async (id: string) => api.get(`/api/branches/${id}/details`),

  getTrainers: async (branchId?: string) => {
    const params = branchId ? `?branchId=${branchId}` : '';
    return api.get(`/api/trainers${params}`);
  },

  getTrainer: async (id: string) => api.get(`/api/trainers/${id}`),

  createTrainer: async (data: any) => api.post('/api/trainers', data),
  updateTrainer: async (id: string, data: any) => api.put(`/api/trainers/${id}`, data),
  deleteTrainer: async (id: string) => api.delete(`/api/trainers/${id}`),
  getTrainerBatches: async (id: string) => api.get(`/api/trainers/${id}/batches`),
  getTrainerStudents: async (id: string) => api.get(`/api/trainers/${id}/students`),

  // Trainer attendance
  trainerClockIn: async (trainerId: string, data: { location: string; area?: string; notes?: string }) =>
    api.post(`/api/trainers/${trainerId}/clock-in`, data),
  trainerClockOut: async (trainerId: string) =>
    api.post(`/api/trainers/${trainerId}/clock-out`, {}),
  getTrainerAttendanceToday: async (trainerId: string) =>
    api.get(`/api/trainers/${trainerId}/attendance/today`),
  getTrainerAttendanceHistory: async (trainerId: string, params?: { from?: string; to?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.from) query.append('from', params.from);
    if (params?.to) query.append('to', params.to);
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset) query.append('offset', String(params.offset));
    return api.get(`/api/trainers/${trainerId}/attendance/history?${query.toString()}`);
  },

  // Admin APIs
  getAdminTrainerAttendance: async (date?: string) => {
    const params = date ? `?date=${date}` : '';
    return api.get(`/api/admin/trainer-attendance${params}`);
  },

  getStudents: async (params?: Record<string, string>) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get(`/api/students${queryString}`);
  },

  getAttendance: async (params?: Record<string, string>) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get(`/api/attendance${queryString}`);
  },

  getFees: async (branchId?: string, studentId?: string) => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    if (studentId) params.append('studentId', studentId);
    return api.get(`/api/fees?${params.toString()}`);
  },

  markAttendance: async (data: any) => api.post('/api/attendance', data),
  createBulkAttendance: async (attendanceRecords: any[]) =>
    api.post('/api/attendance/bulk', { attendanceRecords }),

  // Update a single attendance record by id
  updateAttendance: async (id: string, data: any) => api.put(`/api/attendance/${id}`, data),

  getDashboardStats: async (branchId?: string) =>
    api.get(`/api/dashboard/stats${branchId ? `?branchId=${branchId}` : ''}`),

  // ================= STUDENTS =================
  createStudent: async (data: any) => api.post('/api/students', data),
  updateStudent: async (id: string, data: any) => api.put(`/api/students/${id}`, data),
  getStudent: async (id: string) => api.get(`/api/students/${id}`),

  deactivateStudent: async (id: string) =>
    api.patch(`/api/students/${id}/deactivate`, {}),

  activateStudent: async (id: string) =>
    api.patch(`/api/students/${id}/activate`, {}),

  suspendStudent: async (id: string) =>
    api.patch(`/api/students/${id}/suspend`, {}),

  // ================= PROGRAMS =================
  getPrograms: async () => api.get('/api/programs'),
  getBatches: async () => api.get('/api/batches'),

  // ================= ID CARD =================
  generateIdCard: async (studentId: string) =>
    api.post(`/api/students/${studentId}/id-card`, {}),

  // ================= REPORTS =================
  getReportData: async (type: string, from: string, to: string) =>
    api.get(`/api/reports/data?type=${type}&from=${from}&to=${to}`),
};
