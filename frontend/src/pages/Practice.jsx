import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { useApi } from '../hooks/useApi';

// --- STYLES ---
const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px' },
  header: { textAlign: 'center', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '40px', color: '#E5E7EB' },
  
  // Card danh sách bài thi
  card: { backgroundColor: 'rgba(31, 41, 55, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(55, 65, 81, 0.5)', padding: '25px', borderRadius: '12px', marginBottom: '20px', transition: 'transform 0.2s' },
  testCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  testTitle: { fontSize: '1.4rem', fontWeight: 'bold', color: '#93C5FD', marginBottom: '10px' },
  
  tagContainer: { display: 'flex', gap: '10px', marginTop: '10px' },
  tag: { fontSize: '0.8rem', padding: '5px 12px', borderRadius: '99px', backgroundColor: '#374151', color: '#D1D5DB' },
  tagReward: { backgroundColor: '#B45309', color: '#FDE68A', display: 'flex', alignItems: 'center', gap: '5px' },
  
  buttonPrimary: { backgroundColor: '#2563EB', color: 'white', fontWeight: 'bold', padding: '12px 25px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '1rem', transition: 'background 0.3s' },
  
  // MODAL Overlay
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#1F2937', padding: '0', borderRadius: '15px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #374151', display: 'flex', flexDirection: 'column' },
  modalHeader: { padding: '20px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827', borderTopLeftRadius: '15px', borderTopRightRadius: '15px' },
  modalBody: { padding: '30px' },
  
  // Question Styles
  questionContainer: { backgroundColor: '#374151', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #4B5563' },
  optionLabel: { display: 'flex', alignItems: 'center', padding: '15px', margin: '10px 0', borderRadius: '8px', cursor: 'pointer', border: '1px solid #4B5563', transition: 'all 0.2s' },
  
  // RESULT DASHBOARD STYLES
  resultContainer: { textAlign: 'center', padding: '20px' },
  scoreCircle: { width: '150px', height: '150px', borderRadius: '50%', border: '8px solid', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '3rem', fontWeight: 'bold', margin: '0 auto 20px auto' },
  resultTitle: { fontSize: '2rem', fontWeight: 'bold', marginBottom: '10px' },
  rewardBox: { padding: '20px', borderRadius: '12px', margin: '20px 0', border: '1px solid' },
  statGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' },
  statItem: { backgroundColor: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' },
};

const Practice = () => {
  const { account } = useWeb3();
  const { execute, isLoading } = useApi();
  
  // States
  const [tests, setTests] = useState([]); 
  const [currentTest, setCurrentTest] = useState(null);
  const [fetchedContent, setFetchedContent] = useState(null); 
  const [userAnswers, setUserAnswers] = useState({});
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('test'); // 'test' | 'grading' | 'result'
  const [testResult, setTestResult] = useState(null); // Kết quả trả về từ backend

  // 1. Fetch Danh sách bài thi
  const fetchTests = useCallback(async () => {
    const result = await execute('get_all_tests', {});
    if (result && result.success) {
      setTests(result.data); 
    }
  }, [execute]); 

  useEffect(() => { fetchTests(); }, [fetchTests]);

  // 2. Bắt đầu làm bài
  const handleStartTest = async (test) => {
    setCurrentTest(test);
    setUserAnswers({}); 
    setFetchedContent(null);
    setViewMode('loading');
    setIsModalOpen(true);
    
    // Tải nội dung câu hỏi
    const result = await execute('fetch_test_content', { ipfsHash: test.ipfsHash });
    
    if (result && result.success && result.content) {
        setFetchedContent(result.content);
        setViewMode('test');
    } else {
        alert("Lỗi: Không thể tải nội dung bài thi.");
        setIsModalOpen(false);
    }
  };
  
  // 3. Chọn đáp án
  const handleAnswerChange = (qIndex, answerValue) => {
    setUserAnswers(prev => ({ ...prev, [qIndex]: answerValue }));
  };

  // 4. Nộp bài và Chấm điểm
  const handleSubmitTest = async () => {
    if (!account || !currentTest || !fetchedContent) return;
    
    // Xác nhận trước khi nộp
    const confirmSubmit = window.confirm("Bạn có chắc chắn muốn nộp bài? Hành động này sẽ trừ 1 lượt làm bài.");
    if (!confirmSubmit) return;

    setViewMode('grading'); // Chuyển sang màn hình chờ
    
    // Tạo mảng đáp án chuẩn để gửi lên server
    const answersArray = fetchedContent.questions.map((_, index) => userAnswers[index] || "");
    
    // Gọi API chấm điểm
    const result = await execute('submit_test', {
      userId: account, 
      testId: currentTest.test_id, 
      userAnswers: answersArray
    });
    
    if (result && result.success) {
        setTestResult(result); // Lưu kết quả chấm điểm
        setViewMode('result'); // Chuyển sang màn hình kết quả
        fetchTests(); // Reload lại danh sách đề (để cập nhật số dư/lượt nếu cần)
    } else {
        alert(`Lỗi nộp bài: ${result?.message || 'Lỗi không xác định'}`);
        setIsModalOpen(false);
    }
  };

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setTestResult(null);
      setViewMode('test');
      setUserAnswers({});
  };

  // --- PHẦN RENDER ---

  // Giao diện Làm bài
  const renderTestInterface = () => (
    <>
      <div style={styles.modalHeader}>
        <div>
            <h2 style={{color: '#60A5FA', margin: 0}}>{fetchedContent.title}</h2>
            <span style={{color: '#9CA3AF', fontSize: '0.9rem'}}>{fetchedContent.questions.length} câu hỏi • Trình độ {fetchedContent.level}</span>
        </div>
        <div style={{color: '#FCD34D', fontWeight: 'bold'}}>🎁 {currentTest.reward} vDIS</div>
      </div>
      
      <div style={styles.modalBody}>
          {fetchedContent.questions.map((q, index) => (
            <div key={index} style={styles.questionContainer}>
              <p style={{fontWeight: 'bold', color: 'white', marginBottom: '15px', fontSize: '1.1rem'}}>
                Câu {index + 1}: {q.question_text}
              </p>
              {q.options.map((opt, optIndex) => {
                const isSelected = userAnswers[index] === opt;
                return (
                  <label 
                    key={optIndex}
                    style={{
                      ...styles.optionLabel,
                      backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                      borderColor: isSelected ? '#3B82F6' : '#4B5563',
                      color: isSelected ? 'white' : '#D1D5DB'
                    }}
                  >
                    <input 
                      type="radio" 
                      name={`q-${index}`} 
                      checked={isSelected} 
                      onChange={() => handleAnswerChange(index, opt)} 
                      style={{marginRight: '15px', transform: 'scale(1.2)'}}
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
          ))}

          <div style={{display: 'flex', gap: '20px', marginTop: '20px'}}>
            <button onClick={handleCloseModal} style={{...styles.buttonPrimary, backgroundColor: '#4B5563', flex: 1}}>Hủy bỏ</button>
            <button onClick={handleSubmitTest} style={{...styles.buttonPrimary, flex: 2, fontSize: '1.1rem'}}>Nộp Bài</button>
          </div>
      </div>
    </>
  );

  // Giao diện Kết quả (Dashboard)
  const renderResultInterface = () => {
    if (!testResult) return null;
    const { isPass, score, correctCount, totalQuestions, reward, remainingAttempts } = testResult;
    
    // Màu sắc chủ đề dựa trên kết quả
    const themeColor = isPass ? '#10B981' : '#EF4444'; // Xanh hoặc Đỏ
    const bgColor = isPass ? 'rgba(6, 78, 59, 0.3)' : 'rgba(127, 29, 29, 0.3)';

    return (
      <div style={styles.modalBody}>
        <div style={styles.resultContainer}>
            
            {/* Vòng tròn điểm số */}
            <div style={{
                ...styles.scoreCircle, 
                borderColor: themeColor, 
                color: themeColor,
                boxShadow: `0 0 20px ${themeColor}`
            }}>
                {score.toFixed(0)}%
            </div>

            <h2 style={{...styles.resultTitle, color: themeColor}}>
                {isPass ? "🎉 CHÚC MỪNG!" : "😢 RẤT TIẾC!"}
            </h2>
            
            {/* Hộp Thông tin Thưởng/Phạt */}
            <div style={{
                ...styles.rewardBox, 
                backgroundColor: bgColor, 
                borderColor: themeColor,
                display: 'flex', 
                flexDirection: 'column', 
                gap: '10px'
            }}>
                {/* Dòng 1: Chi phí */}
                <div style={{color: '#D1D5DB', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px'}}>
                    Chi phí làm bài: <span style={{color: '#F87171', fontWeight: 'bold'}}>-1 Lượt</span>
                </div>

                {/* Dòng 2: Phần thưởng */}
                <div>
                    <span style={{color: '#D1D5DB'}}>Phần thưởng nhận được: </span>
                    {isPass ? (
                        <div style={{fontSize: '2.2rem', fontWeight: 'bold', color: '#FCD34D', textShadow: '0 0 10px rgba(252, 211, 77, 0.5)', marginTop: '5px'}}>
                            💰 {reward}
                        </div>
                    ) : (
                        <div style={{fontSize: '1.5rem', color: '#9CA3AF', marginTop: '5px'}}>
                            0 vDIS
                        </div>
                    )}
                </div>
            </div>

            {/* Thống kê chi tiết */}
            <div style={styles.statGrid}>
                <div style={styles.statItem}>
                    <div style={{color: '#9CA3AF', fontSize: '0.9rem'}}>Kết quả</div>
                    <div style={{fontSize: '1.2rem', fontWeight: 'bold', color: 'white'}}>{correctCount} / {totalQuestions} câu đúng</div>
                </div>
                <div style={styles.statItem}>
                    <div style={{color: '#9CA3AF', fontSize: '0.9rem'}}>Số lượt còn lại</div>
                    <div style={{fontSize: '1.2rem', fontWeight: 'bold', color: '#60A5FA'}}>{remainingAttempts}</div>
                </div>
            </div>

            <button onClick={handleCloseModal} style={{...styles.buttonPrimary, width: '100%', padding: '15px'}}>
                Đóng & Quay Về Danh Sách
            </button>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <h2 style={styles.header}>Khu Vực Luyện Tập (Earn)</h2>
      
      {/* DANH SÁCH BÀI THI */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {tests.length === 0 && !isLoading && (
            <div style={{textAlign: 'center', padding: '40px', color: '#9CA3AF'}}>
                Chưa có bài thi nào được duyệt. Hãy quay lại sau!
            </div>
        )}

        {tests.map((test) => (
          <div key={test.test_id} style={styles.card}>
            <div style={styles.testCard}>
                <div>
                  <h3 style={styles.testTitle}>{test.title}</h3>
                  <div style={styles.tagContainer}>
                    <span style={styles.tag}>{test.level}</span>
                    <span style={styles.tag}>{test.test_type}</span>
                    <span style={{...styles.tag, ...styles.tagReward}}>
                        <span>💰</span> Reward: {test.reward} vDIS
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleStartTest(test)} 
                  disabled={isLoading}
                  style={styles.buttonPrimary}
                >
                  Làm Bài
                </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL CHÍNH */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                {viewMode === 'loading' && (
                    <div style={{padding: '50px', textAlign: 'center', color: 'white'}}>
                        <h2>🔄 Đang tải dữ liệu...</h2>
                    </div>
                )}

                {viewMode === 'test' && fetchedContent && renderTestInterface()}
                
                {viewMode === 'grading' && (
                    <div style={{padding: '50px', textAlign: 'center', color: 'white'}}>
                        <h2>📝 Đang chấm điểm & Gửi thưởng...</h2>
                        <p style={{color: '#9CA3AF'}}>Vui lòng không tắt trình duyệt.</p>
                    </div>
                )}

                {viewMode === 'result' && renderResultInterface()}
            </div>
        </div>
      )}
    </div>
  );
};

export default Practice;