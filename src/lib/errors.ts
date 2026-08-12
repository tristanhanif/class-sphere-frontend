interface ApiErrorShape {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
  message?: string;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string') return error;
  const err = error as ApiErrorShape;
  const message = err?.response?.data?.message;
  if (Array.isArray(message)) return message[0] || fallback;
  return message || err?.message || fallback;
}
