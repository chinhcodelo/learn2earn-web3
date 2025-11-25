import React from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../hooks/useWeb3';

// --- Định nghĩa Style cho Trang Home ---
const styles = {
  heroContainer: {
    padding: '80px 20px',
    textAlign: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.6)', // card-glass
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    border: '1px solid rgba(55, 65, 81, 0.5)',
    marginBottom: '60px',
  },
  heroTitle: {
    fontSize: '4rem',
    fontWeight: '800',
    marginBottom: '20px',
    background: 'linear-gradient(to right, #60A5FA, #A78BFA)', // gradient
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSubtitle: {
    fontSize: '1.25rem',
    color: '#D1D5DB', // text-gray-300
    marginBottom: '40px',
    maxWidth: '800px',
    margin: '0 auto 40px auto',
    lineHeight: '1.6',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
  },
  // Nút bấm chính
  btnPrimary: {
    background: 'linear-gradient(to right, #2563EB, #7C3AED)', // gradient
    color: 'white',
    fontWeight: '600',
    padding: '15px 30px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '1.1rem',
    transition: 'all 0.3s',
  },
  // Nút bấm phụ
  btnSecondary: {
    backgroundColor: 'transparent',
    border: '2px solid #4B5563', // border-gray-600
    color: '#D1D5DB', // text-gray-300
    fontWeight: '600',
    padding: '15px 30px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '1.1rem',
    transition: 'all 0.3s',
  },
  // Feature Cards
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '30px',
  },
  featureCard: {
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(55, 65, 81, 0.5)',
    padding: '30px',
    borderRadius: '12px',
    transition: 'transform 0.3s',
  },
  featureIcon: {
    fontSize: '3rem',
    marginBottom: '20px',
    color: '#60A5FA', // text-blue-400
  },
  featureTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: 'white',
  },
  featureDescription: {
    color: '#9CA3AF', // text-gray-400
    lineHeight: '1.6',
  }
};

const Home = () => {
  const { account } = useWeb3();

  return (
    <div style={{ padding: '20px' }}>
      {/* Hero Section */}
      <div style={styles.heroContainer}>
        <h1 style={styles.heroTitle}>
          Tương Lai Của Học Tập
        </h1>
        <p style={styles.heroSubtitle}>
          Chào mừng bạn đến VSTEP-DAO — Nền tảng thi thử VSTEP đầu tiên được xây dựng 100% phi tập trung.
          Minh bạch, công bằng, và trao thưởng xứng đáng cho nỗ lực của bạn.
        </p>
        <div style={styles.buttonContainer}>
          <Link to="/practice" style={styles.btnPrimary}>
            Bắt đầu Làm Bài Ngay
          </Link>
          <Link to="/dao" style={styles.btnSecondary}>
            Tham gia Quản Trị
          </Link>
        </div>
      </div>

      {/* Feature Cards Section */}
      <div style={styles.featuresGrid}>
        {/* Card 1 */}
        <div style={styles.featureCard}>
          <div style={styles.featureIcon}>📚</div>
          <h3 style={styles.featureTitle}>Học để Kiếm Tiền (Learn-to-Earn)</h3>
          <p style={styles.featureDescription}>Hoàn thành bài thi VSTEP và nhận thưởng vDIS token. Nỗ lực của bạn sẽ được đền đáp xứng đáng.</p>
        </div>
        {/* Card 2 */}
        <div style={styles.featureCard}>
          <div style={styles.featureIcon}>🗳️</div>
          <h3 style={styles.featureTitle}>Quản Trị Phi Tập Trung (DAO)</h3>
          <p style={styles.featureDescription}>Không có admin. Cộng đồng sẽ bỏ phiếu để duyệt bài thi mới và quyết định tương lai của nền tảng.</p>
        </div>
        {/* Card 3 */}
        <div style={styles.featureCard}>
          <div style={styles.featureIcon}>🤝</div>
          <h3 style={styles.featureTitle}>Minh Bạch On-Chain</h3>
          <p style={styles.featureDescription}>Mọi bài thi, mọi đáp án, và mọi phần thưởng đều được lưu trữ và xác thực trên Sepolia Testnet.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;