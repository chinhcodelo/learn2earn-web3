const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/database');
const { ethers } = require('ethers'); 

// Import Handlers
const { pipelineHandlers, handleTestApproved, initBackendContract, syncPastEvents } = require('./pipelines/pipelineHandlers');

const app = express();
app.use(cors());
app.use(express.json());

// --- KHỞI ĐỘNG HỆ THỐNG ---
const startServer = async () => {
    try {
        // 1. Kết nối DB MongoDB
        await connectDB();

        // 2. Kết nối Blockchain (SỬA LỖI Ở ĐÂY)
        // Lấy cấu hình từ file .env
        const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
        const RPC_URL = process.env.SEPOLIA_RPC; // <-- Sửa lại: Dùng trực tiếp link Alchemy
        const PRIVATE_KEY = process.env.BACKEND_ISSUER_PRIVATE_KEY;

        // Kiểm tra biến môi trường
        if (!CONTRACT_ADDRESS || !RPC_URL || !PRIVATE_KEY) {
            throw new Error("❌ Thiếu cấu hình (CONTRACT_ADDRESS, SEPOLIA_RPC hoặc PRIVATE_KEY) trong .env");
        }

        // ABI Rút gọn (Chỉ cần những hàm Server dùng để tương tác)
        const ABI = [
            "function issueReward(address to, uint256 amount) external",
            "function proposals(uint256) view returns (uint256, address, string, uint256, bool)",
            "event TestApproved(uint256 id, string ipfsHash)"
        ];

        // Khởi tạo Provider và Wallet
        // Lưu ý: Alchemy RPC URL đã bao gồm key, nên đưa thẳng vào JsonRpcProvider
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const daoContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

        // Gửi contract instance sang pipeline handler
        initBackendContract(daoContract, wallet.address);
        
        // Kiểm tra kết nối mạng (Optional)
        const network = await provider.getNetwork();
        console.log(`✅ [BLOCKCHAIN] Kết nối thành công mạng: ${network.name} (Chain ID: ${network.chainId})`);
        console.log(`   🔗 Contract: ${CONTRACT_ADDRESS}`);

        // 3. LẮNG NGHE SỰ KIỆN (REAL-TIME)
        // Bắt sự kiện khi một bài thi được duyệt để lưu ngay vào DB
        daoContract.on("TestApproved", async (id, ipfsHash) => {
            console.log(`🔔 [EVENT] Phát hiện bài thi mới được duyệt: #${id}`);
            await handleTestApproved(id, ipfsHash);
        });

        // 4. CHẠY AUTO-SYNC (QUÉT LẠI QUÁ KHỨ)
        // Để đảm bảo không sót bài thi nào khi server tắt
        syncPastEvents();

        // 5. API ROUTE CHO FRONTEND GỌI
        app.post('/api/execute', async (req, res) => {
            const { action, payload } = req.body; 
            // Mapping action (code cũ) hoặc pipeline (code mới)
            const pipelineName = action || req.body.pipeline;
            const handler = pipelineHandlers[pipelineName];

            if (!handler) {
                return res.status(400).json({ success: false, message: `Action '${pipelineName}' không tồn tại.` });
            }

            try {
                // Gọi handler xử lý logic
                const result = await handler(payload);
                res.json(result);
            } catch (err) {
                console.error(`❌ Lỗi API [${pipelineName}]:`, err.message);
                res.status(500).json({ success: false, message: err.message });
            }
        });

        // Khởi động Server Express
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("❌ LỖI KHỞI ĐỘNG SERVER:", error.message);
        process.exit(1); // Tắt server nếu lỗi nghiêm trọng
    }
};

startServer();