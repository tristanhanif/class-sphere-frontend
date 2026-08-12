import axiosInstance from '@/lib/axios-instance';
import {
  ApiResponse,
  User,
  ClassItem,
  Task,
  Submission,
  Attendance,
  Activity,
  Notification,
  ServerTime,
  PaginatedResponse,
} from '@/types';
import type { UserInput, ClassInput, TaskInput, ActivityInput } from '@/schemas';

export const authApi = {
  login: (identifier: string, password: string) =>
    axiosInstance.post<ApiResponse<{ token: string; user: User }>>('/auth/login', {
      identifier,
      password,
    }),

  getProfile: () =>
    axiosInstance.get<ApiResponse<User>>('/auth/me'),

  resetPassword: (oldPassword: string, newPassword: string) =>
    axiosInstance.post<ApiResponse<null>>('/auth/reset-password', {
      oldPassword,
      newPassword,
    }),
};

export const usersApi = {
  getAll: (role?: string, classId?: string) =>
    axiosInstance.get<ApiResponse<User[]>>('/users', {
      params: { role, classId },
    }),

  getOne: (id: string) =>
    axiosInstance.get<ApiResponse<User>>(`/users/${id}`),

  create: (data: UserInput) =>
    axiosInstance.post<ApiResponse<User>>('/users', data),

  update: (id: string, data: Partial<UserInput>) =>
    axiosInstance.put<ApiResponse<User>>(`/users/${id}`, data),

  remove: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/users/${id}`),
};

export const classesApi = {
  getAll: () =>
    axiosInstance.get<ApiResponse<ClassItem[]>>('/classes'),

  getOne: (id: string) =>
    axiosInstance.get<ApiResponse<ClassItem>>(`/classes/${id}`),

  create: (data: ClassInput) =>
    axiosInstance.post<ApiResponse<ClassItem>>('/classes', data),

  update: (id: string, data: Partial<ClassInput>) =>
    axiosInstance.put<ApiResponse<ClassItem>>(`/classes/${id}`, data),

  remove: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/classes/${id}`),
};

export const tasksApi = {
  getAll: (classId?: string) =>
    axiosInstance.get<ApiResponse<Task[]>>('/tasks', {
      params: { classId },
    }),

  getOne: (id: string) =>
    axiosInstance.get<ApiResponse<Task>>(`/tasks/${id}`),

  create: (data: TaskInput) =>
    axiosInstance.post<ApiResponse<Task>>('/tasks', data),

  update: (id: string, data: Partial<TaskInput>) =>
    axiosInstance.put<ApiResponse<Task>>(`/tasks/${id}`, data),

  remove: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/tasks/${id}`),
};

export const submissionsApi = {
  getAll: (params: {
    taskId?: string;
    classId?: string;
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<Submission>>>('/submissions', {
      params,
    }),

  getMy: (classId?: string) =>
    axiosInstance.get<ApiResponse<Submission[]>>('/submissions/my', {
      params: { classId },
    }),

  submit: (taskId: string, classId: string, submissionData: string, file?: File) => {
    const formData = new FormData();
    formData.append('submissionData', submissionData);
    if (file) {
      formData.append('file', file);
    }
    return axiosInstance.post<ApiResponse<Submission>>(
      `/submissions?taskId=${taskId}&classId=${classId}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  grade: (id: string, data: { grade: number; status: string; feedback?: string }) =>
    axiosInstance.put<ApiResponse<Submission>>(`/submissions/${id}/grade`, data),
};

export const attendanceApi = {
  checkIn: (classId: string, photo: File, status: string = 'HADIR', keterangan?: string) => {
    const formData = new FormData();
    formData.append('photo', photo);
    formData.append('status', status);
    if (keterangan) {
      formData.append('keterangan', keterangan);
    }
    return axiosInstance.post<ApiResponse<Attendance>>(
      `/attendance/check-in?classId=${classId}`,
      formData,
      // WAJIB: header multipart/form-data. Tanpa ini, axios mengubah FormData
      // menjadi JSON (karena default header instance adalah application/json)
      // sehingga file foto tidak pernah terkirim dan absensi gagal tersimpan.
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  getServerTime: () =>
    axiosInstance.get<ApiResponse<ServerTime>>('/attendance/server-time'),

  getAll: (classId?: string, date?: string) =>
    axiosInstance.get<ApiResponse<Attendance[]>>('/attendance', {
      params: { classId, date },
    }),

  getMy: () =>
    axiosInstance.get<ApiResponse<Attendance[]>>('/attendance/my'),
};

export const activitiesApi = {
  getAll: (classId?: string) =>
    axiosInstance.get<ApiResponse<Activity[]>>('/activities', {
      params: { classId },
    }),

  getOne: (id: string) =>
    axiosInstance.get<ApiResponse<Activity>>(`/activities/${id}`),

  create: (data: ActivityInput) =>
    axiosInstance.post<ApiResponse<Activity>>('/activities', data),

  remove: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/activities/${id}`),
};

export const notificationsApi = {
  getAll: () =>
    axiosInstance.get<ApiResponse<Notification[]>>('/notifications'),

  getUnreadCount: () =>
    axiosInstance.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),

  markAsRead: (id: string) =>
    axiosInstance.put<ApiResponse<null>>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    axiosInstance.put<ApiResponse<null>>('/notifications/read-all'),
};

export const exportApi = {
  getGradeRecap: (classId: string) =>
    axiosInstance.get<ApiResponse<Record<string, unknown>>>(`/export/grades/${classId}`),
};
