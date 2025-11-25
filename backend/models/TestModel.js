// models/TestModel.js
const mongoose = require('mongoose');

// Schema cho câu hỏi con
const QuestionSchema = new mongoose.Schema({
  question_id: { type: String }, // Có thể dùng index làm ID
  question_text: { type: String, required: true },
  options: { type: [String], required: true }, // Mảng 4 đáp án [A, B, C, D]
  correct_answer: { type: String, required: true }, // Đáp án đúng (VD: "A" hoặc nội dung string)
}, { _id: false });

// Schema chính
const TestSchema = new mongoose.Schema({
  _id: { type: String, required: true }, 
  test_id: { type: String, required: true, unique: true },
  
  title: { type: String, required: true }, // Thêm Title để hiển thị đẹp hơn
  test_type: { type: String, enum: ['Reading', 'Listening'], required: true },
  level: { type: String, enum: ['B1', 'B2', 'C1'], required: true },
  
  ipfsHash: { type: String, required: true },
  questions: [QuestionSchema], // Lưu mảng câu hỏi
  
  proposal_id: { type: Number, required: true },
  proposer_address: { type: String, required: true }, // QUAN TRỌNG: Để trả thưởng cho tác giả
  
  status: { type: String, enum: ['pending_vote', 'approved'], default: 'pending_vote' },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: true,
  _id: false 
});

module.exports = mongoose.model('Test', TestSchema, 'collection_tests');