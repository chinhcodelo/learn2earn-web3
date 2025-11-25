import React from 'react';
import { Outlet } from 'react-router-dom'; // <--- QUAN TRỌNG
import Header from './Header'; // Hoặc đường dẫn đúng tới Header của bạn

// --- Định nghĩa Styles ---
const styles = {
  layout: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: 'transparent', // Nền đã được set ở index.css
  },
  mainContent: {
    flex: '1', // Chiếm không gian còn lại
    width: '100%',
    maxWidth: '1280px', // Giới hạn chiều rộng
    margin: '0 auto',
    padding: '40px 20px',
  },
  footer: {
    textAlign: 'center',
    padding: '25px',
    color: '#6B7280', // text-gray-500
    borderTop: '1px solid #374151', // border-gray-700
    fontSize: '0.9rem',
    marginTop: '40px',
  }
};
// -------------------------

const Layout = () => {
  return (
    <div style={styles.layout}>
      <Header />
      <main style={styles.mainContent}>
        <Outlet /> {/* Đây là nơi các trang con (Home, DAO...) được hiển thị */}
      </main>
      <footer style={styles.footer}>
        KLCN_TH046 - Web3 Learn-to-Earn (DAO) © 2025
      </footer>
    </div>
  );
};

export default Layout;