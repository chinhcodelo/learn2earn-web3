import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '20px' },
  title: { textAlign: 'center', color: '#FCD34D', fontSize: '2.5rem', marginBottom: '30px', textTransform: 'uppercase', letterSpacing: '2px' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'rgba(31, 41, 55, 0.7)', borderRadius: '12px', overflow: 'hidden' },
  th: { padding: '15px', backgroundColor: '#111827', color: '#9CA3AF', textAlign: 'left', borderBottom: '1px solid #374151' },
  td: { padding: '15px', borderBottom: '1px solid #374151', color: 'white' },
  rank1: { color: '#FFD700', fontWeight: 'bold', fontSize: '1.2rem' }, // Vàng
  rank2: { color: '#C0C0C0', fontWeight: 'bold', fontSize: '1.1rem' }, // Bạc
  rank3: { color: '#CD7F32', fontWeight: 'bold', fontSize: '1.1rem' }, // Đồng
  myCard: { marginTop: '30px', padding: '20px', backgroundColor: '#064E3B', borderRadius: '10px', color: 'white', textAlign: 'center' }
};

const Leaderboard = () => {
  const { execute } = useApi();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
        const res = await execute('get_leaderboard', {});
        if (res && res.success) setUsers(res.data);
    };
    fetchLeaderboard();
  }, [execute]);

  const getRankStyle = (index) => {
      if (index === 0) return styles.rank1;
      if (index === 1) return styles.rank2;
      if (index === 2) return styles.rank3;
      return {};
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🏆 Bảng Xếp Hạng Học Viên</h1>
      
      <table style={styles.table}>
        <thead>
            <tr>
                <th style={styles.th}>Hạng</th>
                <th style={styles.th}>Mã Học Viên (Card ID)</th>
                <th style={styles.th}>Địa chỉ Ví</th>
                <th style={styles.th}>Số Lượt (Tài sản)</th>
            </tr>
        </thead>
        <tbody>
            {users.map((u, index) => (
                <tr key={u.user_id} style={{backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.05)'}}>
                    <td style={{...styles.td, ...getRankStyle(index)}}>#{index + 1}</td>
                    <td style={styles.td}>{u.card_id}</td>
                    <td style={{...styles.td, fontFamily: 'monospace', color: '#60A5FA'}}>
                        {u.user_id.substring(0, 6)}...{u.user_id.substring(38)}
                    </td>
                    <td style={{...styles.td, fontWeight: 'bold', color: '#10B981'}}>{u.remaining_attempts}</td>
                </tr>
            ))}
        </tbody>
      </table>
      
      {users.length === 0 && <p style={{textAlign:'center', color:'gray', marginTop:'20px'}}>Chưa có dữ liệu xếp hạng.</p>}
    </div>
  );
};

export default Leaderboard;