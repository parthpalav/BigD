// Utility to extract error message from axios errors
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    if ('response' in error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return axiosError.response?.data?.error || error.message;
    }
    return error.message;
  }
  return 'An unknown error occurred';
};
