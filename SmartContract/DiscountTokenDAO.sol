// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract DiscountTokenDAO is ERC20, ERC20Burnable, AccessControl {
    
    bytes32 public constant REWARD_ISSUER_ROLE = keccak256("REWARD_ISSUER_ROLE");

    // --- CẤU HÌNH KINH TẾ (TOKENOMICS) ---
    // Tỷ giá: 1 ETH = 1,000,000 vDIS
    uint256 public constant SWAP_RATE = 1000000; 

    // Giá mua lượt
    uint256 public constant ETH_PRICE_PER_5_ATTEMPTS = 0.0001 ether;
    uint256 public constant VDIS_PRICE_PER_5_ATTEMPTS = 50 * 10**18; // 50 vDIS

    // Phí dịch vụ (Sẽ bị đốt)
    uint256 public constant VDIS_FEE_PROPOSE = 20 * 10**18;          // 20 vDIS
    uint256 public constant VDIS_FEE_VOTE = 5 * 10**18;              // 5 vDIS

    uint256 public nextProposalId = 1;
    uint256 public constant VOTE_THRESHOLD = 3;

    struct Proposal {
        uint256 id;
        address proposer;
        string ipfsHash;
        uint256 voteCount;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => Proposal) public proposals;

    // --- EVENTS ---
    event ProposalCreated(uint256 id, address proposer, string ipfsHash);
    event VotedOn(uint256 id, address voter);
    event TestApproved(uint256 id, string ipfsHash);
    event AttemptsPurchased(address indexed user, uint256 amount, string currency);
    event TokensBought(address indexed buyer, uint256 amountETH, uint256 amountVDIS);
    event TokensSold(address indexed seller, uint256 amountVDIS, uint256 amountETH);

    constructor(address initialRewardIssuer) ERC20("Vstep Discount Token", "vDIS") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REWARD_ISSUER_ROLE, initialRewardIssuer);
    }

    // --- 1. PHÁT THƯỞNG (Backend gọi) ---
    function issueReward(address to, uint256 amount) external onlyRole(REWARD_ISSUER_ROLE) {
        _mint(to, amount);
    }

    // --- 2. SÀN GIAO DỊCH (SWAP) ---
    
    // Mua vDIS bằng ETH
    function swapETHForVDIS() external payable {
        require(msg.value > 0, "Must send ETH");
        uint256 vdisAmount = msg.value * SWAP_RATE;
        _mint(msg.sender, vdisAmount);
        emit TokensBought(msg.sender, msg.value, vdisAmount);
    }

    // Bán vDIS lấy ETH
    function swapVDISForETH(uint256 _vdisAmount) external {
        require(_vdisAmount > 0, "Amount must be > 0");
        require(balanceOf(msg.sender) >= _vdisAmount, "Insufficient vDIS balance");
        
        uint256 ethAmount = _vdisAmount / SWAP_RATE;
        require(address(this).balance >= ethAmount, "Contract has insufficient ETH liquidity");

        burn(_vdisAmount); // Đốt token bán
        payable(msg.sender).transfer(ethAmount); // Trả ETH

        emit TokensSold(msg.sender, _vdisAmount, ethAmount);
    }

    // --- 3. MUA LƯỢT LÀM BÀI ---
    
    function buyAttemptsWithETH() external payable {
        require(msg.value == ETH_PRICE_PER_5_ATTEMPTS, "Incorrect ETH amount");
        emit AttemptsPurchased(msg.sender, 5, "ETH");
    }

    function buyAttemptsWithVDIS() external {
        require(balanceOf(msg.sender) >= VDIS_PRICE_PER_5_ATTEMPTS, "Insufficient vDIS balance");
        burn(VDIS_PRICE_PER_5_ATTEMPTS); // Đốt token để mua dịch vụ
        emit AttemptsPurchased(msg.sender, 5, "vDIS");
    }

    // --- 4. QUẢN TRỊ (BẮT BUỘC ĐỐT vDIS) ---

    function proposeTest(string memory _ipfsHash) external {
        require(balanceOf(msg.sender) >= VDIS_FEE_PROPOSE, "Need 20 vDIS to propose");
        burn(VDIS_FEE_PROPOSE); // Phí chống spam

        Proposal storage p = proposals[nextProposalId];
        p.id = nextProposalId;
        p.proposer = msg.sender;
        p.ipfsHash = _ipfsHash;
        p.voteCount = 0;
        p.executed = false;

        emit ProposalCreated(nextProposalId, msg.sender, _ipfsHash);
        nextProposalId++;
    }

    function voteOnTest(uint256 _proposalId) external {
        require(balanceOf(msg.sender) >= VDIS_FEE_VOTE, "Need 5 vDIS to vote");
        burn(VDIS_FEE_VOTE); // Phí trách nhiệm

        Proposal storage p = proposals[_proposalId];
        require(p.id != 0, "Proposal does not exist");
        require(!p.executed, "Already executed");
        require(!p.hasVoted[msg.sender], "Already voted");

        p.hasVoted[msg.sender] = true;
        p.voteCount++;
        
        emit VotedOn(_proposalId, msg.sender);

        if (p.voteCount >= VOTE_THRESHOLD) {
            p.executed = true;
            emit TestApproved(p.id, p.ipfsHash);
        }
    }
    
    // Nhận ETH để tạo thanh khoản
    receive() external payable {}
}