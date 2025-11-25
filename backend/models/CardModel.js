const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  card_id: { type: String, required: true, unique: true },
  user_id: { 
      type: String, 
      required: true, 
      unique: true, // Đã có index ở đây
      description: "Địa chỉ ví" 
  },
  
  public_key: { type: String, required: true },
  token: { type: String, required: true },
  qr_code: { type: String, required: true },
  signature: { type: String, required: true },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  balance: { type: Number, min: 0, default: 0 },
  remaining_attempts: { type: Number, min: 0, default: 2 },
  hashed_studentID: { type: String, required: true, unique: true },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: true,
  _id: false 
});

// CardSchema.index({ user_id: 1 });  <-- ĐÃ XÓA DÒNG NÀY

module.exports = mongoose.model('Card', CardSchema, 'collection_cards');