const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB đã kết nối thành công!");
  } catch (err) {
    console.error("❌ Lỗi kết nối MongoDB:", err.message);
    // Thoát tiến trình nếu không thể kết nối DB
    process.exit(1);
  }
};

module.exports = connectDB;