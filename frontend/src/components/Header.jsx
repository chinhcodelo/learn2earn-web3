import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWeb3 } from '../hooks/useWeb3';
import { ethers } from 'ethers';
// 🔽 Thêm import cho Icons 🔽
import { WalletIcon, UserCircleIcon, CurrencyDollarIcon, CubeTransparentIcon } from '@heroicons/react/24/outline';

// --- Định nghĩa Styles ---
const styles = {
  header: {
    backgroundColor: 'rgba(17, 24, 39, 0.8)', // bg-gray-900/80
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #374151', // border-gray-700
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '16px 20px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'white',
    textDecoration: 'none',
  },
  navLinksContainer: {
    display: 'flex',
    gap: '30px',
  },
  navLink: {
    color: '#9CA3AF', // text-gray-400
    textDecoration: 'none',
    paddingBottom: '5px',
    transition: 'color 0.3s',
    fontSize: '1rem',
  },
  navLinkActive: {
    color: 'white',
    borderBottom: '2px solid #3B82F6', // border-blue-500
    fontWeight: '500',
  },
  walletContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  btnConnect: {
    background: 'linear-gradient(to right, #2563EB, #7C3AED)',
    color: 'white',
    fontWeight: '600',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.3s',
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
  },
  infoChip: {
    backgroundColor: 'rgba(55, 65, 81, 0.6)', // bg-gray-700/60
    padding: '8px 15px',
    borderRadius: '99px',
    fontSize: '0.9rem',
    fontWeight: '500',
    border: '1px solid #4B5563',
    display: 'flex',
    alignItems: 'center',
    gap: '8px', 
  },
  icon: {
    width: '20px',
    height: '20px',
  }
};
// -------------------------

const Header = () => {
  const { account, contract, provider, isLoading, connectWallet } = useWeb3(); // Thêm 'provider'
  const [vdisBalance, setVdisBalance] = useState("0");
  
  // ==========================================================
  // 🔽 THÊM STATE MỚI CHO SỐ DƯ SepoliaETH 🔽
  // ==========================================================
  const [ethBalance, setEthBalance] = useState("0");
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  const truncateAddress = (address) => `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;

  // Lấy số dư token VÀ SepoliaETH
  useEffect(() => {
    const fetchBalances = async () => {
      if (contract && account && provider) { // Đảm bảo 'provider' đã sẵn sàng
        try {
          // 1. Lấy số dư vDIS
          const bal = await contract.balanceOf(account);
          setVdisBalance(ethers.formatUnits(bal, 18));
          
          // 2. Lấy số dư SepoliaETH
          const ethBal = await provider.getBalance(account);
          setEthBalance(ethers.formatEther(ethBal));

        } catch (err) { 
          console.error("Lỗi lấy số dư:", err); 
          setVdisBalance("0");
          setEthBalance("0");
        }
      }
    };
    fetchBalances();
  }, [contract, account, provider]); // Thêm 'provider' vào dependency

  const getLinkStyle = (path) => {
    return location.pathname === path
      ? { ...styles.navLink, ...styles.navLinkActive }
      : styles.navLink;
  };

  return (
    <header style={styles.header}>
      <nav style={styles.nav}>
        <Link to="/" style={styles.logo}>
          <CubeTransparentIcon style={{...styles.icon, color: '#60A5FA'}} />
          <span>VSTEP-DAO</span>
        </Link>
        
        <div style={styles.navLinksContainer}>
          <Link to="/" style={getLinkStyle('/')}>Trang Chủ</Link>
          <Link to="/practice" style={getLinkStyle('/practice')}>Làm Bài (Earn)</Link>
          <Link to="/dao" style={getLinkStyle('/dao')}>Quản Trị (DAO)</Link>
          <Link to="/upload" style={getLinkStyle('/upload')}>Đăng Bài Thi</Link>
          <Link to="/leaderboard" style={getLinkStyle('/leaderboard')}>Xếp Hạng</Link>
          <Link to="/dashboard" style={getLinkStyle('/dashboard')}>Dashboard</Link>
        </div>

        <div style={styles.walletContainer}>
          {account ? (
            <>
              {/* ========================================================== */}
              {/* 🔽 HIỂN THỊ SỐ DƯ SepoliaETH 🔽 */}
              {/* ========================================================== */}
              <div style={styles.infoChip}>
                <span style={{ color: '#9CA3AF' }}>♦</span>
                <span style={{ color: '#E5E7EB' }}>
                  {parseFloat(ethBalance).toFixed(4)} SepoliaETH
                </span>
              </div>

              {/* Chip hiển thị số dư vDIS */}
              <div style={styles.infoChip}>
                <CurrencyDollarIcon style={{...styles.icon, color: '#FCD34D'}} />
                <span style={{ color: '#FCD34D' }}>
                  {parseFloat(vdisBalance).toFixed(2)} vDIS
                </span>
              </div>
              
              {/* Chip địa chỉ ví (Link tới Profile) */}
              <Link to="/profile" style={{ 
                  ...styles.infoChip, 
                  color: '#6EE7B7', 
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}>
                <UserCircleIcon style={{...styles.icon, color: '#6EE7B7'}} />
                {truncateAddress(account)}
              </Link>
            </>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isLoading}
              style={{
                ...styles.btnConnect,
                opacity: isLoading ? 0.7 : (isHovered ? 0.85 : 1)
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <WalletIcon style={styles.icon} />
              <span>{isLoading ? "Đang kết nối..." : "Connect Wallet"}</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;