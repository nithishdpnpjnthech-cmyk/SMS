class StudentApiClient {
  private getHeaders() {
    const token = localStorage.getItem('studentToken');
    if (!token) {
      throw new Error('Student not authenticated');
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`/api/student${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid - clear student data and redirect
        localStorage.removeItem('student');
        localStorage.removeItem('studentToken');
        window.location.href = '/student/login';
        throw new Error('Session expired. Please login again.');
      }
      
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getProfile() {
    return this.request('/profile');
  }

  async getNotes() {
    return this.request('/notes');
  }

  async getAttendance(month?: number, year?: number) {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/attendance${query}`);
  }

  async getFees() {
    return this.request('/fees');
  }

  async processPayment(feeId: string, paymentMethod: string) {
    return this.request('/payment', {
      method: 'POST',
      body: JSON.stringify({
        feeId,
        paymentMethod,
      }),
    });
  }

  async downloadAttendanceReport(month: number, year: number, format: 'csv' | 'pdf') {
    const params = new URLSearchParams({
      month: month.toString(),
      year: year.toString(),
      format,
    });

    const response = await fetch(`/api/student/reports/attendance?${params.toString()}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('student');
        localStorage.removeItem('studentToken');
        window.location.href = '/student/login';
        throw new Error('Session expired. Please login again.');
      }
      throw new Error('Failed to download report');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${month}-${year}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export const studentApi = new StudentApiClient();