import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
// Import thư viện biểu đồ
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  title: { color: 'white', fontSize: '2rem', borderLeft: '5px solid #3B82F6', paddingLeft: '15px', margin: 0 },
  
  // Nút Xuất Excel (Đáp ứng yêu cầu "Trích xuất")
  exportBtn: {
    backgroundColor: '#059669', color: 'white', border: 'none', padding: '10px 20px',
    borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px'
  },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' },
  card: { padding: '25px', borderRadius: '12px', backgroundColor: '#1F2937', border: '1px solid #374151', textAlign: 'center' },
  number: { fontSize: '3rem', fontWeight: 'bold', color: 'white', margin: '10px 0' },
  label: { color: '#9CA3AF', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' },

  chartContainer: { backgroundColor: '#1F2937', padding: '30px', borderRadius: '12px', border: '1px solid #374151', height: '400px' },
  chartTitle: { color: '#D1D5DB', marginBottom: '20px', textAlign: 'center', fontSize: '1.2rem' }
};

const Dashboard = () => {
  const { execute } = useApi();
  const [stats, setStats] = useState({ totalUsers: 0, totalTests: 0, approvedTests: 0, pendingTests: 0, chartData: [] });

  useEffect(() => {
    const fetchStats = async () => {
        const res = await execute('get_admin_stats', {});
        if (res && res.success) setStats(res.stats);
    };
    fetchStats();
  }, [execute]);

  // Hàm xử lý Xuất dữ liệu ra file CSV (Trích xuất)
  const handleExport = () => {
    const csvContent = [
        ["Bao Cao Thong Ke He Thong VSTEP-DAO"],
        ["Ngay Xuat", new Date().toLocaleString()],
        [],
        ["Tong Hoc Vien", stats.totalUsers],
        ["Tong De Thi", stats.totalTests],
        ["De Da Duyet", stats.approvedTests],
        ["De Cho Duyet", stats.pendingTests],
        [],
        ["--- Du lieu bieu do (7 ngay qua) ---"],
        ["Ngay", "So luong de thi"],
        ...stats.chartData.map(d => [d._id, d.count])
    ]
    .map(e => e.join(","))
    .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "VSTEP_Report.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h1 style={styles.title}>Admin Dashboard</h1>
        <button style={styles.exportBtn} onClick={handleExport}>
            📂 Trích Xuất Báo Cáo (CSV)
        </button>
      </div>
      
      {/* CÁC THẺ SỐ LIỆU */}
      <div style={styles.grid}>
        <div style={{...styles.card, borderTop: '4px solid #10B981'}}>
            <div style={styles.label}>Tổng Học Viên</div>
            <div style={{...styles.number, color: '#10B981'}}>{stats.totalUsers}</div>
        </div>
        <div style={{...styles.card, borderTop: '4px solid #3B82F6'}}>
            <div style={styles.label}>Tổng Đề Thi</div>
            <div style={{...styles.number, color: '#3B82F6'}}>{stats.totalTests}</div>
        </div>
        <div style={{...styles.card, borderTop: '4px solid #8B5CF6'}}>
            <div style={styles.label}>Đã Duyệt</div>
            <div style={{...styles.number, color: '#8B5CF6'}}>{stats.approvedTests}</div>
        </div>
        <div style={{...styles.card, borderTop: '4px solid #F59E0B'}}>
            <div style={styles.label}>Chờ Duyệt</div>
            <div style={{...styles.number, color: '#F59E0B'}}>{stats.pendingTests}</div>
        </div>
      </div>

      {/* BIỂU ĐỒ THỰC TẾ (RECHARTS) */}
      <div style={styles.chartContainer}>
        <h3 style={styles.chartTitle}>📊 Biểu Đồ Tăng Trưởng Đề Thi (7 Ngày Qua)</h3>
        <ResponsiveContainer width="100%" height="85%">
            <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="_id" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" allowDecimals={false} />
                <Tooltip 
                    contentStyle={{backgroundColor: '#111827', borderColor: '#4B5563', color: 'white'}} 
                    itemStyle={{color: '#60A5FA'}}
                />
                <Bar dataKey="count" name="Số lượng đề" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;