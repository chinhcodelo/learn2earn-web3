import { useState, useCallback } from 'react';

// URL của backend server.js
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const useApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (action, payload) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Lỗi từ server');
      }

      const data = await response.json();
      return data;

    } catch (err) {
      console.error(`Lỗi khi thực thi pipeline [${action}]:`, err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { execute, isLoading, error };
};