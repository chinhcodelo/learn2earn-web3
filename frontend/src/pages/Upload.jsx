import React, { useState } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { useApi } from '../hooks/useApi';

const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '40px 20px' },
  headerTitle: { fontSize: '2.5rem', fontWeight: '800', color: 'white', textAlign: 'center', marginBottom: '10px' },
  headerSub: { textAlign: 'center', color: '#9CA3AF', marginBottom: '40px' },
  
  card: { backgroundColor: '#1F2937', padding: '30px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #374151', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
  
  sectionTitle: { color: 'white', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '20px', borderBottom: '1px solid #374151', paddingBottom: '10px' },
  
  inputGroup: { marginBottom: '20px' },
  label: { display: 'block', color: '#D1D5DB', marginBottom: '8px', fontSize: '0.95rem', fontWeight: '500' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#111827', border: '1px solid #4B5563', color: 'white', fontSize: '1rem', transition: 'border-color 0.2s' },
  select: { width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#111827', border: '1px solid #4B5563', color: 'white', fontSize: '1rem' },
  
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  
  questionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  removeBtn: { backgroundColor: '#EF4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' },
  
  addButton: { width: '100%', padding: '15px', backgroundColor: '#374151', color: '#D1D5DB', border: '2px dashed #4B5563', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem', fontWeight: '600', transition: 'all 0.2s' },
  submitButton: { width: '100%', padding: '16px', backgroundColor: '#2563EB', color: 'white', borderRadius: '12px', border: 'none', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '30px', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)' },
  
  messageBox: { padding: '15px', borderRadius: '8px', marginTop: '20px', textAlign: 'center', color: 'white', fontWeight: '500' }
};

const Upload = () => {
  const { contract, account } = useWeb3();
  const { execute, isLoading } = useApi(); 
  
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');

  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('B1');
  const [type, setType] = useState('Reading');
  
  // Mỗi câu hỏi gồm text, 4 lựa chọn, và index của đáp án đúng (0-3)
  const [questions, setQuestions] = useState([
    { question_text: '', options: ['', '', '', ''], correctIndex: 0 }
  ]);

  // Xử lý thay đổi nội dung câu hỏi
  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    if (field === 'question_text') {
        newQuestions[index].question_text = value;
    } else if (field === 'correctIndex') {
        newQuestions[index].correctIndex = parseInt(value);
    } else if (field.startsWith('option_')) {
        const optIndex = parseInt(field.split('_')[1]);
        newQuestions[index].options[optIndex] = value;
    }
    setQuestions(newQuestions);
  };

  const addQuestion = () => setQuestions([...questions, { question_text: '', options: ['', '', '', ''], correctIndex: 0 }]);
  const removeQuestion = (index) => setQuestions(questions.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract || !account) {
      setMessageType('error');
      setMessage("⚠️ Vui lòng kết nối ví để tiếp tục.");
      return;
    }

    // 1. Validate dữ liệu
    for(let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if(!q.question_text.trim()) {
            setMessageType('error'); setMessage(`Câu ${i+1}: Thiếu nội dung câu hỏi.`); return;
        }
        if(q.options.some(opt => !opt.trim())) {
            setMessageType('error'); setMessage(`Câu ${i+1}: Vui lòng điền đủ 4 đáp án.`); return;
        }
    }

    setMessageType('info');
    setMessage("⏳ Đang tải dữ liệu bài thi lên IPFS...");
    
    // 2. Chuẩn hóa dữ liệu để gửi lên Backend
    // Backend mong đợi: correct_answer là STRING (nội dung đáp án)
    const formattedQuestions = questions.map(q => ({
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.options[q.correctIndex] // Lấy text dựa trên index đã chọn
    }));

    const testData = { title, level, type, questions: formattedQuestions, proposer: account };
    
    try {
      // 3. Upload IPFS
      const uploadResult = await execute('upload_content', { testContent: testData }); 
      if (!uploadResult || !uploadResult.success) throw new Error("Lỗi Upload IPFS.");
      const ipfsHash = uploadResult.ipfsHash;

      // 4. Gọi Smart Contract (Burn 20 vDIS)
      setMessage(`📦 Đã lưu IPFS. Đang chờ xác nhận đốt 20 vDIS phí đăng bài...`);
      
      const tx = await contract.proposeTest(ipfsHash); 
      
      setMessage("⛓️ Đang chờ Blockchain xác nhận giao dịch...");
      await tx.wait(); 

      setMessageType('success');
      setMessage("✅ Đăng bài thành công! (Đã trừ 20 vDIS). Bài thi đang chờ Vote.");
      
      // Reset form
      setTitle(''); 
      setQuestions([{ question_text: '', options: ['', '', '', ''], correctIndex: 0 }]);
      window.scrollTo(0, 0);

    } catch (err) {
      console.error(err);
      setMessageType('error');
      const errMsg = err.reason || err.message;
      if (errMsg.includes("Need 20 vDIS")) {
          setMessage("⛔ Lỗi: Ví bạn không đủ 20 vDIS để đăng bài.");
      } else {
          setMessage(`⛔ Lỗi: ${errMsg}`);
      }
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.headerTitle}>Đăng Đề Thi Mới</h1>
      <p style={styles.headerSub}>Đóng góp nội dung cho cộng đồng và nhận hoa hồng vDIS trọn đời.</p>
      
      <form onSubmit={handleSubmit}>
        {/* THÔNG TIN CHUNG */}
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>1. Thông Tin Chung</h3>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tiêu đề bài thi</label>
            <input style={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ví dụ: Đề luyện tập Reading B1 - Số 05" />
          </div>
          
          <div style={styles.grid2}>
            <div style={styles.inputGroup}>
                <label style={styles.label}>Trình độ</label>
                <select style={styles.select} value={level} onChange={(e) => setLevel(e.target.value)}>
                    <option>B1</option><option>B2</option><option>C1</option>
                </select>
            </div>
            <div style={styles.inputGroup}>
                <label style={styles.label}>Kỹ năng</label>
                <select style={styles.select} value={type} onChange={(e) => setType(e.target.value)}>
                    <option>Reading</option><option>Listening</option>
                </select>
            </div>
          </div>
        </div>

        {/* DANH SÁCH CÂU HỎI */}
        {questions.map((q, i) => (
            <div key={i} style={styles.card}>
                <div style={styles.questionHeader}>
                    <h3 style={{color:'white', margin:0}}>Câu hỏi số {i+1}</h3>
                    {questions.length > 1 && <button type="button" onClick={() => removeQuestion(i)} style={styles.removeBtn}>Xóa câu này</button>}
                </div>
                
                <div style={styles.inputGroup}>
                    <input style={styles.input} placeholder="Nhập nội dung câu hỏi..." value={q.question_text} onChange={(e) => handleQuestionChange(i, 'question_text', e.target.value)} />
                </div>

                <div style={styles.grid2}>
                    {q.options.map((opt, optIndex) => (
                        <div key={optIndex} style={styles.inputGroup}>
                            <label style={{...styles.label, fontSize:'0.8rem'}}>Lựa chọn {String.fromCharCode(65 + optIndex)}</label>
                            <input style={styles.input} placeholder={`Đáp án ${String.fromCharCode(65 + optIndex)}`} value={opt} onChange={(e) => handleQuestionChange(i, `option_${optIndex}`, e.target.value)} />
                        </div>
                    ))}
                </div>

                <div style={{marginTop: '10px', padding: '15px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid #059669'}}>
                    <label style={{...styles.label, color: '#34D399', fontWeight: 'bold'}}>Đáp án đúng là?</label>
                    <select 
                        style={{...styles.select, borderColor: '#059669'}} 
                        value={q.correctIndex} 
                        onChange={(e) => handleQuestionChange(i, 'correctIndex', e.target.value)}
                    >
                        <option value={0}>A. {q.options[0] || 'Lựa chọn A'}</option>
                        <option value={1}>B. {q.options[1] || 'Lựa chọn B'}</option>
                        <option value={2}>C. {q.options[2] || 'Lựa chọn C'}</option>
                        <option value={3}>D. {q.options[3] || 'Lựa chọn D'}</option>
                    </select>
                </div>
            </div>
        ))}

        <button type="button" onClick={addQuestion} style={styles.addButton}>+ Thêm câu hỏi mới</button>
        
        <button type="submit" disabled={isLoading} style={styles.submitButton}>
            {isLoading ? "⏳ Đang xử lý..." : "🚀 Xác Nhận Đăng Bài (Phí 20 vDIS)"}
        </button>
      </form>
      
      {message && <div style={{...styles.messageBox, backgroundColor: messageType === 'success' ? '#064E3B' : '#7F1D1D'}}>{message}</div>}
    </div>
  );
};

export default Upload;