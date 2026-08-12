export enum Role {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum TaskSubmissionType {
  FILE = 'FILE',
  URL = 'URL',
}

export enum SubmissionStatus {
  BELUM_DINILAI = 'BELUM_DINILAI',
  SUDAH_DINILAI = 'SUDAH_DINILAI',
  PERLU_REVISI = 'PERLU_REVISI',
}

export enum NotificationType {
  TASK_CREATED = 'TASK_CREATED',
  GRADE_UPDATED = 'GRADE_UPDATED',
  ACTIVITY_CREATED = 'ACTIVITY_CREATED',
}

export type Timestamp =
  | Date
  | string
  | number
  | { _seconds?: number; seconds?: number; toDate?: () => Date };

export interface User {
  id: string;
  identifier: string;
  name: string;
  role: Role;
  isFirstLogin: boolean;
  classId: string | null;
}

export interface ClassItem {
  id: string;
  name: string;
  academicYear: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  subject: string;
  teacherId: string;
  classIds: string[];
  deadline: string;
  submissionType: TaskSubmissionType;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Submission {
  id: string;
  taskId: string;
  studentId: string;
  studentName?: string;
  classId: string;
  submissionData: string;
  fileName?: string | null;
  status: SubmissionStatus;
  grade: number | null;
  teacherFeedback: string | null;
  isLate: boolean;
  submittedAt: Timestamp;
}

export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  photoUrl: string | null;
  status: string;
  keterangan?: string;
  submittedAt: Timestamp;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  targetClassIds: string[];
  createdAt: Timestamp;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Timestamp;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  submissions: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ServerTime {
  serverTime: string;
  timezone: string;
  isAttendanceOpen: boolean;
}
