import { useState, useCallback } from 'react';

// 1. Sửa tên biến thành VITE_API_URL
// 2. Thêm '/api' vào localhost để đồng bộ với Render
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const useApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (action, payload) => {
    setIsLoading(true);
    setError(null);
    try {
      // 3. Bỏ chữ '/api' ở đây vì trong biến môi trường đã có rồi
      // Kết quả sẽ là: https://...onrender.com/api/execute
      const response = await fetch(`${API_BASE_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }), // Payload cũ dùng 'action', server mới dùng 'pipeline' (nhưng server đã handle cả 2)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || errData.message || 'Lỗi từ server');
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
