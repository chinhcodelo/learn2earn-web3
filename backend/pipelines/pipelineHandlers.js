const crypto = require('crypto');
const { ethers } = require('ethers');
const mongoose = require('mongoose');
const axios = require('axios');

// Import Models
const Card = require('../models/CardModel');
const Test = require('../models/TestModel');

// --- CẤU HÌNH TOÀN CỤC ---
let daoContract;
let backendWalletAddress;
const PINATA_JWT = process.env.PINATA_JWT;

const initBackendContract = (contractInstance, walletAddress) => {
    daoContract = contractInstance;
    backendWalletAddress = walletAddress;
    console.log("✅ [PIPELINE] Đã kết nối Smart Contract.");
};

// --- HELPER IPFS ---
const uploadJsonToPinata = async (jsonData) => {
    if (!PINATA_JWT) throw new Error("Thiếu PINATA_JWT trong .env");
    try {
        const res = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS",
            { pinataMetadata: { name: `VSTEP_${Date.now()}` }, pinataContent: jsonData },
            { headers: { 'Authorization': `Bearer ${PINATA_JWT}`, 'Content-Type': 'application/json' } }
        );
        return res.data.IpfsHash;
    } catch (err) {
        throw new Error("Lỗi Upload Pinata: " + err.message);
    }
};

const fetchTestContentFromIPFS = async (ipfsHash) => {
    try {
        const res = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
        return res.data;
    } catch (err) {
        console.error(`❌ Lỗi tải IPFS ${ipfsHash}:`, err.message);
        return null;
    }
};

// ==========================================================
// 🔽 XỬ LÝ SỰ KIỆN & SYNC 🔽
// ==========================================================

const handleTestApproved = async (id, ipfsHash) => {
    try {
        const testIdStr = `TEST_${id}`;
        console.log(`\n🔄 [SYNC] Đang xử lý bài thi ID: ${id} ...`);

        // 1. Kiểm tra trùng
        const exists = await Test.findOne({ test_id: testIdStr });
        if (exists) {
            console.log(`   ⚠️ Bài thi ${testIdStr} đã tồn tại. Bỏ qua.`);
            return;
        }

        if (!daoContract) {
            console.error("❌ Lỗi: Chưa kết nối Contract.");
            return;
        }

        // 2. Lấy thông tin tác giả
        const proposal = await daoContract.proposals(id);
        const proposerAddress = proposal[1]; // Index 1 là proposer

        // 3. Tải nội dung
        const content = await fetchTestContentFromIPFS(ipfsHash);
        if (!content || !content.questions) {
            console.error(`   ❌ IPFS lỗi: ${ipfsHash}`);
            return;
        }

        // 4. Lưu DB
        const newTest = new Test({
            _id: testIdStr,
            test_id: testIdStr,
            title: content.title || `Bài thi #${id}`,
            test_type: content.type || 'Reading',
            level: content.level || 'B1',
            ipfsHash: ipfsHash,
            questions: content.questions,
            proposal_id: Number(id),
            proposer_address: proposerAddress,
            status: 'approved'
        });

        await newTest.save();
        console.log(`   ✅ [SUCCESS] Đã lưu bài thi ${testIdStr} vào MongoDB.`);

    } catch (error) {
        console.error("❌ LỖI XỬ LÝ TestApproved:", error.message);
    }
};

const syncPastEvents = async () => {
    if (!daoContract) return;
    console.log("🔄 [AUTO-SYNC] Đang quét các sự kiện gần nhất...");
    try {
        const currentBlock = await daoContract.runner.provider.getBlockNumber();
        const startBlock = currentBlock - 9 > 0 ? currentBlock - 9 : 0;
        console.log(`   ↳ Quét từ Block ${startBlock} đến ${currentBlock} (Gói Free)`);

        const filter = daoContract.filters.TestApproved();
        const events = await daoContract.queryFilter(filter, startBlock, "latest");

        if (events.length === 0) console.log("   ↳ Không có sự kiện mới.");

        for (const event of events) {
            await handleTestApproved(event.args[0], event.args[1]);
        }
        console.log("✅ [AUTO-SYNC] Hoàn tất.");
    } catch (err) {
        console.error("❌ Lỗi Auto-Sync:", err.message);
    }
};

// ==========================================================
// PIPELINE HANDLERS (XỬ LÝ YÊU CẦU TỪ FRONTEND)
// ==========================================================

const pipelineHandlers = {

    // 1. UPLOAD CONTENT (Đăng bài lên IPFS)
    'upload_content': async (payload) => {
        const ipfsHash = await uploadJsonToPinata(payload.testContent);
        return { success: true, ipfsHash: ipfsHash };
    },

    // 2. LẤY NỘI DUNG BÀI THI (Bảo mật: Xóa đáp án đúng)
    'fetch_test_content': async (payload) => {
        // Ưu tiên tìm trong DB (Nhanh hơn)
        const test = await Test.findOne({ ipfsHash: payload.ipfsHash });
        
        let content;
        if (test) {
            content = { title: test.title, level: test.level, type: test.test_type, questions: test.questions };
        } else {
            // Fallback: Tải từ IPFS nếu DB chưa kịp sync
            content = await fetchTestContentFromIPFS(payload.ipfsHash);
        }

        if (!content) throw new Error("Không tìm thấy nội dung bài thi.");

        // QUAN TRỌNG: Xóa trường 'correct_answer' trước khi gửi về Client để tránh lộ đề
        const sanitizedQuestions = content.questions.map(q => ({
            question_text: q.question_text,
            options: q.options
            // Không trả về correct_answer
        }));

        return { success: true, content: { ...content, questions: sanitizedQuestions } };
    },

    // 3. LẤY DANH SÁCH TẤT CẢ BÀI THI (Đã duyệt)
    'get_all_tests': async () => {
        const tests = await Test.find({ status: 'approved' }).sort({ created_at: -1 });
        
        const formatted = tests.map(t => ({
            test_id: t.test_id,
            title: t.title,
            level: t.level,
            test_type: t.test_type,
            ipfsHash: t.ipfsHash,
            // Tính toán phần thưởng hiển thị
            reward: t.level === 'B1' ? 10 : (t.level === 'B2' ? 15 : 20)
        }));
        
        return { success: true, data: formatted };
    },

    // 4. NỘP BÀI & CHẤM ĐIỂM (Logic cốt lõi)
    'submit_test': async (payload) => {
        const { userId, testId, userAnswers } = payload;

        if (!daoContract) throw new Error("Server lỗi kết nối Blockchain.");

        // A. Kiểm tra User
        const userCard = await Card.findOne({ user_id: userId });
        if (!userCard) throw new Error("Chưa đăng ký tài khoản sinh viên.");
        if (userCard.remaining_attempts <= 0) 
            return { success: false, message: "Bạn đã hết lượt làm bài. Vui lòng mua thêm lượt." };

        // B. Xử lý ID bài thi (Fix lỗi ID bị trùng lặp tiền tố 'TEST_')
        const dbTestId = testId.toString().startsWith('TEST_') ? testId : `TEST_${testId}`;
        
        // Tìm bài thi trong DB
        const test = await Test.findOne({ test_id: dbTestId });
        if (!test) throw new Error("Bài thi không tồn tại trong hệ thống.");

        // C. Chấm điểm
        let correctCount = 0;
        test.questions.forEach((q, i) => {
            // So sánh không phân biệt hoa thường, cắt khoảng trắng thừa
            const userAns = userAnswers[i] ? userAnswers[i].toString().trim().toUpperCase() : "";
            const trueAns = q.correct_answer ? q.correct_answer.toString().trim().toUpperCase() : "";
            if (userAns === trueAns) correctCount++;
        });

        const scorePercent = (correctCount / test.questions.length) * 100;
        const isPass = scorePercent >= 70; // Đậu nếu >= 70%

        // D. Trừ lượt (Luôn trừ dù đậu hay rớt)
        userCard.remaining_attempts -= 1;
        await userCard.save();

        let rewardMsg = "0 vDIS";

        // E. Trả thưởng (Nếu đậu)
        if (isPass) {
            try {
                const rewardVal = test.level === 'B1' ? 10 : (test.level === 'B2' ? 15 : 20);
                const rewardWei = ethers.parseUnits(rewardVal.toString(), 18);

                // 1. Thưởng cho User (Người làm bài)
                const txUser = await daoContract.issueReward(userId, rewardWei);
                await txUser.wait(); // Chờ giao dịch hoàn tất
                rewardMsg = `${rewardVal} vDIS`;

                // 2. Thưởng Hoa hồng cho Tác giả (Create-to-Earn)
                // Chỉ thưởng nếu Tác giả khác với Người làm bài
                if (test.proposer_address && test.proposer_address.toLowerCase() !== userId.toLowerCase()) {
                    const bonusWei = ethers.parseUnits("2", 18); // Hoa hồng cố định 2 vDIS
                    // Gửi async để không làm user phải chờ lâu
                    daoContract.issueReward(test.proposer_address, bonusWei).catch(err => 
                        console.error("⚠️ Lỗi gửi hoa hồng tác giả:", err.message)
                    );
                }
            } catch (err) {
                console.error("❌ Lỗi Blockchain trả thưởng:", err.message);
                rewardMsg = "Lỗi mạng (Token chưa được gửi)";
            }
        }

        return {
            success: true,
            score: scorePercent,
            correctCount,
            totalQuestions: test.questions.length,
            isPass,
            reward: rewardMsg,
            remainingAttempts: userCard.remaining_attempts
        };
    },

    // 5. ĐĂNG KÝ / ĐĂNG NHẬP
    'register_or_login': async (payload) => {
        const { user_id, studentID } = payload;
        
        // Login: Nếu đã có thẻ thì trả về
        let card = await Card.findOne({ user_id });
        if (card) return { success: true, status: 'login', data: card };

        // Register: Kiểm tra MSSV trùng lặp
        const hashed = crypto.createHash('sha256').update(studentID).digest('hex');
        if (await Card.findOne({ hashed_studentID: hashed })) 
            throw new Error("Mã sinh viên này đã được liên kết với ví khác.");

        // Tạo thẻ mới
        const newCard = new Card({
            _id: new mongoose.Types.ObjectId().toString(),
            card_id: `STU_${Date.now()}`, 
            user_id, 
            hashed_studentID: hashed,
            public_key: 'N/A', token: 'N/A', qr_code: 'N/A', signature: 'N/A',
            remaining_attempts: 2 // Tặng 2 lượt miễn phí
        });
        await newCard.save();
        return { success: true, status: 'register', data: newCard };
    },

    // 6. LẤY THÔNG TIN PROFILE
    'get_user_profile': async (payload) => {
        const card = await Card.findOne({ user_id: payload.userId });
        return card ? { success: true, status: 'found', data: card } 
                    : { success: true, status: 'not_found', data: null };
    },

    // 7. XÁC NHẬN MUA LƯỢT (Từ Blockchain)
    'confirm_purchase': async (payload) => {
        const card = await Card.findOne({ user_id: payload.userId });
        if (!card) throw new Error("User không tồn tại.");
        
        card.remaining_attempts += 5; // Cộng 5 lượt theo gói
        await card.save();
        return { success: true, newBalance: card.remaining_attempts };
    },

    // 8. [MỚI] LẤY BẢNG XẾP HẠNG (LEADERBOARD)
    'get_leaderboard': async () => {
        // Lấy Top 10 người dùng có số lượt còn lại nhiều nhất (giả lập xếp hạng tài sản/hoạt động)
        const topUsers = await Card.find({})
            .sort({ remaining_attempts: -1 }) // Sắp xếp giảm dần
            .limit(10)
            .select('user_id remaining_attempts card_id'); // Chỉ lấy các trường cần thiết

        return { success: true, data: topUsers };
    },


    'get_admin_stats': async () => {
        const totalUsers = await Card.countDocuments();
        const totalTests = await Test.countDocuments();
        const approvedTests = await Test.countDocuments({ status: 'approved' });
        
        // --- THỐNG KÊ BIỂU ĐỒ (7 ngày gần nhất) ---
        // Lấy số lượng bài thi được tạo theo từng ngày
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const chartData = await Test.aggregate([
            { $match: { created_at: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return {
            success: true,
            stats: {
                totalUsers,
                totalTests,
                approvedTests,
                pendingTests: totalTests - approvedTests,
                chartData // Trả về dữ liệu biểu đồ
            }
        };
    }
};

module.exports = { pipelineHandlers, handleTestApproved, initBackendContract, syncPastEvents };