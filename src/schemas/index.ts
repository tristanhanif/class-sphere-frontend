import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Identifier wajib diisi')
    .min(8, 'Minimal 8 karakter'),
  password: z
    .string()
    .min(1, 'Password wajib diisi')
    .min(6, 'Minimal 6 karakter'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const resetPasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Password lama wajib diisi'),
    newPassword: z
      .string()
      .min(6, 'Password baru minimal 6 karakter'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const taskSchema = z.object({
  title: z.string().min(1, 'Judul tugas wajib diisi'),
  description: z.string().optional(),
  subject: z.string().min(1, 'Mata pelajaran wajib diisi'),
  classIds: z.array(z.string()).min(1, 'Pilih minimal 1 kelas'),
  deadline: z.string().min(1, 'Deadline wajib diisi'),
  submissionType: z.enum(['FILE', 'URL']),
});

export type TaskInput = z.infer<typeof taskSchema>;

export const attendanceSchema = z.object({
  photo: z
    .any()
    .refine((files) => files?.length === 1, 'Foto absensi wajib diunggah')
    .refine(
      (files) => {
        const file = files?.[0];
        if (!file) return false;
        return ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type);
      },
      'Format file harus JPG atau PNG',
    )
    .refine(
      (files) => {
        const file = files?.[0];
        if (!file) return false;
        return file.size <= 2 * 1024 * 1024;
      },
      'Ukuran file maksimal 2MB',
    ),
  status: z.enum(['HADIR', 'SAKIT']),
  keterangan: z.string().optional(),
});

export type AttendanceInput = z.infer<typeof attendanceSchema>;

export const taskSubmissionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('URL'),
    url: z.string().url('Format URL tidak valid').min(1, 'URL wajib diisi'),
  }),
  z.object({
    type: z.literal('FILE'),
    file: z
      .any()
      .refine((files) => files?.length === 1, 'File wajib diunggah')
      .refine(
        (files) => {
          const file = files?.[0];
          if (!file) return false;
          return [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/zip',
          ].includes(file.type);
        },
        'Format file harus PDF, DOCX, atau ZIP',
      )
      .refine(
        (files) => {
          const file = files?.[0];
          if (!file) return false;
          return file.size <= 5 * 1024 * 1024;
        },
        'Ukuran file maksimal 5MB',
      ),
  }),
]);

export type TaskSubmissionInput = z.infer<typeof taskSubmissionSchema>;

export const userSchema = z.object({
  identifier: z.string().min(1, 'Identifier wajib diisi'),
  name: z.string().min(1, 'Nama wajib diisi'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['SUPERADMIN', 'ADMIN', 'USER']),
  classId: z.string().optional(),
});

export type UserInput = z.infer<typeof userSchema>;

export const classSchema = z.object({
  name: z.string().min(1, 'Nama kelas wajib diisi'),
  academicYear: z.string().min(1, 'Tahun ajaran wajib diisi'),
});

export type ClassInput = z.infer<typeof classSchema>;

export const gradingSchema = z.object({
  grade: z.number().min(0).max(100, 'Nilai maksimal 100'),
  status: z.enum(['SUDAH_DINILAI', 'PERLU_REVISI']),
  feedback: z.string().optional(),
});

export type GradingInput = z.infer<typeof gradingSchema>;

export const activitySchema = z.object({
  title: z.string().min(1, 'Judul pengumuman wajib diisi'),
  description: z.string().optional(),
  targetClassIds: z.array(z.string()).min(1, 'Pilih minimal 1 kelas'),
});

export type ActivityInput = z.infer<typeof activitySchema>;
