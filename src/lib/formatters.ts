import { format, formatDistanceToNow, isAfter, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Timestamp } from '@/types';

// Return today's date string in WIB (Asia/Jakarta) timezone as YYYY-MM-DD
export function getTodayWIB(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return parts; // en-CA yields YYYY-MM-DD
}

function parseFirebaseTimestamp(date: Timestamp | null | undefined): Date {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof date === 'string') return parseISO(date);
  if (typeof date === 'number') return new Date(date);

  if (typeof date === 'object') {
    if (typeof date._seconds === 'number') {
      return new Date(date._seconds * 1000);
    }
    if (typeof date.seconds === 'number') {
      return new Date(date.seconds * 1000);
    }
    if (typeof date.toDate === 'function') {
      return date.toDate();
    }
    return new Date();
  }
  return new Date(date);
}

export function formatDate(date: Timestamp | null | undefined): string {
  try {
    const d = parseFirebaseTimestamp(date);
    return format(d, 'dd MMMM yyyy', { locale: id });
  } catch {
    return '-';
  }
}

export function formatDateTime(date: Timestamp | null | undefined): string {
  try {
    const d = parseFirebaseTimestamp(date);
    return format(d, 'dd MMMM yyyy HH:mm', { locale: id });
  } catch {
    return '-';
  }
}

export function formatRelativeTime(date: Timestamp | null | undefined): string {
  try {
    const d = parseFirebaseTimestamp(date);
    return formatDistanceToNow(d, { addSuffix: true, locale: id });
  } catch {
    return '-';
  }
}

export function isDeadlinePassed(deadline: Timestamp | null | undefined): boolean {
  try {
    const d = parseFirebaseTimestamp(deadline);
    return isAfter(new Date(), d);
  } catch {
    return false;
  }
}


export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'SUDAH_DINILAI':
      return 'text-green-600 bg-green-50';
    case 'BELUM_DINILAI':
      return 'text-yellow-600 bg-yellow-50';
    case 'PERLU_REVISI':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case 'SUPERADMIN':
      return 'Super Admin';
    case 'ADMIN':
      return 'Guru';
    case 'USER':
      return 'Murid';
    default:
      return role;
  }
}
