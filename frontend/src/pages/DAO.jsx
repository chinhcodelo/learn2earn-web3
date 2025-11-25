import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../hooks/useWeb3';

const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px' },
  header: { textAlign: 'center', color: 'white', marginBottom: '30px' },
  card: { backgroundColor: 'rgba(31, 41, 55, 0.7)', padding: '20px', borderRadius: '12px', marginBottom: '15px', border: '1px solid #4B5563', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  info: { color: '#D1D5DB' },
  button: { padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
  statusBadge: { padding: '5px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', marginLeft: '10px' }
};

const DAO = () => {
  const { contract } = useWeb3();
  const [proposals, setProposals] = useState([]);
  const [loadingId, setLoadingId] = useState(null);

  const fetchProposals = useCallback(async () => {
    if (!contract) return;
    try {
      const count = Number(await contract.nextProposalId());
      const loaded = [];
      // Lấy danh sách ngược để hiện bài mới nhất lên đầu
      for (let i = count - 1; i >= 1; i--) {
        const p = await contract.proposals(i);
        loaded.push({
            id: Number(p.id),
            proposer: p.proposer,
            ipfsHash: p.ipfsHash,
            voteCount: Number(p.voteCount),
            executed: p.executed
        });
      }
      setProposals(loaded);
    } catch (err) {
      console.error("Fetch proposals error:", err);
    }
  }, [contract]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleVote = async (id) => {
    if (!contract) return;
    setLoadingId(id);
    try {
        // GỌI CONTRACT: Contract tự burn 5 vDIS, KHÔNG có { value: ... }
        const tx = await contract.voteOnTest(id);
        
        await tx.wait();
        alert("Bỏ phiếu thành công! (Đã trừ 5 vDIS)");
        fetchProposals();
    } catch (err) {
        const errMsg = err.reason || err.message;
        if (errMsg.includes("Need 5 vDIS")) {
             alert("Lỗi: Bạn cần ít nhất 5 vDIS để bỏ phiếu.");
        } else {
             alert("Lỗi: " + errMsg);
        }
    } finally {
        setLoadingId(null);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>DAO Governance</h1>
        <p>Phí tham gia bỏ phiếu: 5 vDIS/lượt. Cần 3 phiếu thuận để duyệt bài.</p>
      </div>

      {proposals.map(p => (
        <div key={p.id} style={styles.card}>
            <div>
                <h3 style={{color: 'white', margin: '0 0 10px 0'}}>
                    Proposal #{p.id} 
                    <span style={{
                        ...styles.statusBadge, 
                        backgroundColor: p.executed ? '#065F46' : '#92400E',
                        color: p.executed ? '#6EE7B7' : '#FCD34D'
                    }}>
                        {p.executed ? 'APPROVED' : 'VOTING'}
                    </span>
                </h3>
                <p style={styles.info}>Votes: {p.voteCount} / 3</p>
                <p style={{...styles.info, fontSize: '0.8rem'}}>Hash: {p.ipfsHash}</p>
            </div>
            {!p.executed && (
                <button 
                    onClick={() => handleVote(p.id)}
                    disabled={loadingId === p.id}
                    style={{
                        ...styles.button, 
                        backgroundColor: '#2563EB', 
                        color: 'white',
                        opacity: loadingId === p.id ? 0.7 : 1
                    }}
                >
                    {loadingId === p.id ? "Đang xử lý..." : "Vote (-5 vDIS)"}
                </button>
            )}
        </div>
      ))}
      {proposals.length === 0 && <p style={{textAlign: 'center', color: 'gray'}}>Chưa có đề xuất nào.</p>}
    </div>
  );
};

export default DAO;