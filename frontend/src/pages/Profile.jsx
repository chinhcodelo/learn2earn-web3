import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { useApi } from '../hooks/useApi';
import { ethers } from 'ethers';

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '20px' },
  card: { backgroundColor: 'rgba(31, 41, 55, 0.7)', padding: '30px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #4B5563' },
  sectionTitle: { fontSize: '1.5rem', fontWeight: '600', color: 'white', marginBottom: '20px', borderBottom: '1px solid #4B5563', paddingBottom: '10px' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #4B5563', color: '#D1D5DB' },
  value: { fontWeight: 'bold', color: 'white' },
  button: { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', color: 'white' },
  shopGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' },
  shopItem: { border: '1px solid', padding: '15px', borderRadius: '10px', textAlign: 'center' },
  exchangeContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' },
  exchangeCard: { backgroundColor: 'rgba(0, 0, 0, 0.3)', padding: '20px', borderRadius: '10px', border: '1px solid #4B5563' },
  inputGroup: { display: 'flex', gap: '10px', marginTop: '10px' }
};

const Profile = () => {
  const { account, contract, provider, disconnectWallet } = useWeb3();
  const { execute } = useApi();
  const [profile, setProfile] = useState(null);
  const [balances, setBalances] = useState({ eth: '0', vdis: '0' });
  const [studentID, setStudentID] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  
  // Swap States
  const [swapAmountETH, setSwapAmountETH] = useState('');
  const [swapAmountVDIS, setSwapAmountVDIS] = useState('');

  // Tải dữ liệu Profile và Số dư
  const loadData = useCallback(async () => {
    if (!account || !execute) return;
    
    // 1. Backend Profile
    const res = await execute('get_user_profile', { userId: account });
    if (res && res.success && res.status === 'found') {
        setProfile(res.data);
    } else {
        setProfile(null);
    }
    
    // 2. Blockchain Balance
    if (provider && contract) {
        try {
            const eth = await provider.getBalance(account);
            const vdis = await contract.balanceOf(account);
            setBalances({ 
                eth: ethers.formatEther(eth), 
                vdis: ethers.formatUnits(vdis, 18) 
            });
        } catch (err) {
            console.error("Lỗi tải số dư:", err);
        }
    }
  }, [account, execute, provider, contract]);

  useEffect(() => { loadData(); }, [loadData]);

  // Đăng ký hồ sơ
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    const res = await execute('register_or_login', { user_id: account, studentID });
    if (res && res.success) {
        loadData();
    } else {
        alert("Đăng ký thất bại");
    }
    setIsProcessing(false);
  };

  // --- CHỨC NĂNG 1: SÀN GIAO DỊCH (SWAP) ---

  const handleSwapETHToVDIS = async () => {
    if (!contract || !swapAmountETH) return;
    setIsProcessing(true);
    setStatusMsg("Đang đổi ETH sang vDIS...");
    try {
        const ethWei = ethers.parseEther(swapAmountETH);
        const tx = await contract.swapETHForVDIS({ value: ethWei });
        await tx.wait();
        alert(`Thành công! Đã đổi ${swapAmountETH} ETH sang vDIS.`);
        loadData(); 
        setSwapAmountETH('');
    } catch (err) { 
        alert("Lỗi: " + (err.reason || err.message)); 
    } finally { 
        setIsProcessing(false); 
        setStatusMsg(''); 
    }
  };

  const handleSwapVDISToETH = async () => {
    if (!contract || !swapAmountVDIS) return;
    setIsProcessing(true);
    setStatusMsg("Đang đổi vDIS sang ETH...");
    try {
        const vdisWei = ethers.parseUnits(swapAmountVDIS, 18);
        const tx = await contract.swapVDISForETH(vdisWei);
        await tx.wait();
        alert(`Thành công! Đã rút ${swapAmountVDIS} vDIS về ETH.`);
        loadData(); 
        setSwapAmountVDIS('');
    } catch (err) { 
        alert("Lỗi: Số dư không đủ hoặc Contract hết thanh khoản."); 
    } finally { 
        setIsProcessing(false); 
        setStatusMsg(''); 
    }
  };

  // --- CHỨC NĂNG 2: MUA LƯỢT LÀM BÀI ---

  const handleBuyETH = async () => {
    if (!contract) return;
    setIsProcessing(true);
    setStatusMsg("Đang giao dịch với ETH...");
    try {
        const price = ethers.parseEther("0.0001");
        const tx = await contract.buyAttemptsWithETH({ value: price });
        await tx.wait();
        
        // Cập nhật DB Backend
        await execute('confirm_purchase', { userId: account, txHash: tx.hash });
        alert("Mua thành công bằng ETH!");
        loadData();
    } catch (err) { 
        alert(err.message); 
    } finally { 
        setIsProcessing(false); 
        setStatusMsg(''); 
    }
  };

  const handleBuyVDIS = async () => {
    if (!contract) return;
    setIsProcessing(true);
    setStatusMsg("Đang đốt 50 vDIS để mua lượt...");
    try {
        const tx = await contract.buyAttemptsWithVDIS();
        await tx.wait();
        
        // Cập nhật DB Backend
        await execute('confirm_purchase', { userId: account, txHash: tx.hash });
        alert("Đổi điểm thành công!");
        loadData();
    } catch (err) { 
        alert("Lỗi: Không đủ vDIS hoặc lỗi mạng."); 
    } finally { 
        setIsProcessing(false); 
        setStatusMsg(''); 
    }
  };

  if (!account) return <div style={{textAlign:'center', color:'white', marginTop:'50px'}}>Vui lòng kết nối ví để xem hồ sơ.</div>;

  return (
    <div style={styles.container}>
      <h2 style={{color:'white', textAlign:'center'}}>Hồ Sơ Cá Nhân & Ví</h2>
      
      {!profile ? (
        <div style={styles.card}>
            <h3 style={{color:'white'}}>Đăng Ký Hồ Sơ Mới</h3>
            <p style={{color:'gray'}}>Liên kết Mã Sinh Viên với Ví Web3 của bạn.</p>
            <form onSubmit={handleRegister}>
                <input style={{width:'100%', padding:'10px', margin:'10px 0', borderRadius:'5px'}} 
                    placeholder="Nhập Mã Sinh Viên" value={studentID} onChange={e => setStudentID(e.target.value)} />
                <button type="submit" disabled={isProcessing} style={{...styles.button, backgroundColor:'#2563EB'}}>
                    {isProcessing ? "Đang xử lý..." : "Tạo Hồ Sơ"}
                </button>
            </form>
        </div>
      ) : (
        <>
            {/* THÔNG TIN VÍ */}
            <div style={styles.card}>
                <h3 style={styles.sectionTitle}>Tài Sản Số</h3>
                <div style={styles.row}><span>Địa chỉ Ví</span><span style={styles.value}>{account.substring(0,6)}...{account.substring(38)}</span></div>
                <div style={styles.row}><span>Số dư ETH</span><span style={styles.value}>{parseFloat(balances.eth).toFixed(5)} ETH</span></div>
                <div style={styles.row}><span>Số dư Token</span><span style={{...styles.value, color:'#FCD34D', fontSize:'1.2rem'}}>{parseFloat(balances.vdis).toFixed(2)} vDIS</span></div>
            </div>

            {/* SÀN GIAO DỊCH (SWAP) */}
            <div style={styles.card}>
                <h3 style={{color: '#8B5CF6', borderBottom: '1px solid #4B5563', paddingBottom: '10px'}}>🔄 Sàn Quy Đổi (Exchange)</h3>
                <div style={styles.exchangeContainer}>
                    {/* CỘT TRÁI: MUA vDIS */}
                    <div style={styles.exchangeCard}>
                        <h4 style={{color: '#10B981'}}>Nạp ETH ➔ Nhận vDIS</h4>
                        <div style={styles.inputGroup}>
                            <input type="number" placeholder="Số ETH" value={swapAmountETH} onChange={(e) => setSwapAmountETH(e.target.value)} style={{flex: 1, padding: '8px', borderRadius: '5px'}}/>
                        </div>
                        <p style={{fontSize:'0.8rem', color:'gray', marginTop:'5px'}}>1 ETH = 1,000,000 vDIS</p>
                        <button onClick={handleSwapETHToVDIS} disabled={isProcessing} style={{...styles.button, backgroundColor: '#059669', marginTop: '10px'}}>Đổi sang vDIS</button>
                    </div>

                    {/* CỘT PHẢI: BÁN vDIS */}
                    <div style={styles.exchangeCard}>
                        <h4 style={{color: '#F59E0B'}}>Bán vDIS ➔ Rút ETH</h4>
                        <div style={styles.inputGroup}>
                            <input type="number" placeholder="Số vDIS" value={swapAmountVDIS} onChange={(e) => setSwapAmountVDIS(e.target.value)} style={{flex: 1, padding: '8px', borderRadius: '5px'}}/>
                        </div>
                        <p style={{fontSize:'0.8rem', color:'gray', marginTop:'5px'}}>Cần contract có thanh khoản</p>
                        <button onClick={handleSwapVDISToETH} disabled={isProcessing} style={{...styles.button, backgroundColor: '#D97706', marginTop: '10px'}}>Rút về ETH</button>
                    </div>
                </div>
            </div>

            {/* CỬA HÀNG MUA LƯỢT */}
            <div style={styles.card}>
                <h3 style={styles.sectionTitle}>Cửa Hàng Lượt Thi (Còn lại: {profile.remaining_attempts})</h3>
                <div style={styles.shopGrid}>
                    <div style={{...styles.shopItem, borderColor:'#4B5563', backgroundColor:'rgba(0,0,0,0.2)'}}>
                        <p style={{color:'#9CA3AF'}}>Dành cho người mới</p>
                        <h4 style={{color:'white'}}>0.0001 ETH</h4>
                        <button onClick={handleBuyETH} disabled={isProcessing} style={{...styles.button, backgroundColor:'#374151'}}>Mua bằng ETH</button>
                    </div>
                    <div style={{...styles.shopItem, borderColor:'#059669', backgroundColor:'rgba(6, 78, 59, 0.2)'}}>
                        <p style={{color:'#6EE7B7'}}>Dành cho Holder (Ưu đãi)</p>
                        <h4 style={{color:'#FCD34D'}}>50 vDIS</h4>
                        <button onClick={handleBuyVDIS} disabled={isProcessing} style={{...styles.button, backgroundColor:'#059669'}}>Đổi Điểm lấy Lượt</button>
                    </div>
                </div>
                {statusMsg && <p style={{textAlign:'center', color:'#93C5FD', marginTop:'10px', fontWeight:'bold'}}>{statusMsg}</p>}
            </div>
        </>
      )}
      <button onClick={disconnectWallet} style={{...styles.button, backgroundColor:'#DC2626'}}>Ngắt Kết Nối Ví</button>
    </div>
  );
};

export default Profile;