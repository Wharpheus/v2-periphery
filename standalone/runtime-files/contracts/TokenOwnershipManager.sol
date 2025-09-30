// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Custom errors for gas-efficient reverts
error NotOwner();
error BadThreshold();
error ZeroOwner();
error BadId();
error Finalized();
error TimeLock();
error Expired();
error AlreadyVoted();
error NoWeight();
error NotGuardian();
error AlreadyVetoed();
error Cooldown();
error NoURI();
error BadWindows();
error BadGuardian();
error BadScore();
error NotPassed();
error RiskRejected();

/**
 * @title TokenOwnershipManager (SOVCLINE Governance Engine)
 * @notice Sovereign governance contract backing the SOVCLINE runtime protocol.
 *         Features:
 *           - AI-powered proposal risk scoring (off-chain oracle/admin hook)
 *           - Quadratic voting using on-chain reputation scores
 *           - Timelock + expiry windows with cooldown pacing
 *           - Reputation-weighted voting
 *           - Multi-signature emergency veto (guardian set with threshold)
 *           - Cross-chain governance signal events for integration
 *           - Lineage-friendly proposal metadata (URI)
 *
 * @dev This contract is dependency-free for portability. Integrate with
 *      your preferred toolchain (Hardhat/Foundry) for deployment.
 */
contract TokenOwnershipManager {
    // --------------------------
    // Events
    // --------------------------
    event ProposalCreated(
        uint256 indexed id,
        address indexed proposer,
        string uri,
        uint64 timelockEnd,
        uint64 expiry
    );
    event VoteCast(uint256 indexed id, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed id);
    event ProposalCanceled(uint256 indexed id, string reason);
    event RiskScoreUpdated(uint256 indexed id, uint16 riskScoreBps, string note);
    event ReputationUpdated(address indexed account, uint256 newReputation);
    event GuardianAdded(address indexed guardian);
    event GuardianRemoved(address indexed guardian);
    event CrossChainSignal(uint256 indexed id, uint64 dstChainId, string action, string data);

    // --------------------------
    // Roles & Access
    // --------------------------
    address public owner;
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // Guardians for emergency veto
    mapping(address => bool) public guardians;
    uint256 public guardianCount;
    uint256 public guardianVetoThreshold; // e.g., 2 of 3

    // --------------------------
    // Reputation / Voting
    // --------------------------
    mapping(address => uint256) public reputation; // set by owner/off-chain pipeline

    // Quadratic voting helper
    function _isqrt(uint256 x) internal pure returns (uint256 y) {
        // Babylonian method
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    // --------------------------
    // Proposals
    // --------------------------
    struct Proposal {
        // lifecycle
        address proposer;
        uint64 createdAt;
        uint64 timelockEnd;
        uint64 expiry;
        bool executed;
        bool canceled;

        // metadata
        string uri; // off-chain metadata (IPFS/HTTPS)
        uint16 riskScoreBps; // 0-10000 basis points; provided by AI/off-chain

        // voting
        uint256 votesFor; // quadratic-weighted
        uint256 votesAgainst;
        mapping(address => bool) hasVoted; // per-proposal participation guard

        // veto
        uint256 vetoCount;
        mapping(address => bool) vetoSigned; // guardian signatures
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) private _proposals;

    // pacing
    uint64 public proposerCooldown = 1 hours; // cooldown period per proposer
    mapping(address => uint64) public lastProposedAt;

    constructor(address[] memory initialGuardians, uint256 vetoThreshold) {
        owner = msg.sender;
        for (uint256 i = 0; i < initialGuardians.length; i++) {
            address g = initialGuardians[i];
            if (!guardians[g] && g != address(0)) {
                guardians[g] = true;
                guardianCount++;
                emit GuardianAdded(g);
            }
        }
        if (!(vetoThreshold > 0 && vetoThreshold <= guardianCount)) revert BadThreshold();
        guardianVetoThreshold = vetoThreshold;
    }

    // --------------------------
    // Governance Admin
    // --------------------------
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroOwner();
        owner = newOwner;
    }

    function setReputation(address account, uint256 value) external onlyOwner {
        reputation[account] = value;
        emit ReputationUpdated(account, value);
    }

    function setProposerCooldown(uint64 seconds_) external onlyOwner {
        proposerCooldown = seconds_;
    }

    function addGuardian(address g) external onlyOwner {
        if (g == address(0) || guardians[g]) revert BadGuardian();
        guardians[g] = true;
        unchecked { guardianCount++; }
        emit GuardianAdded(g);
    }

    function removeGuardian(address g) external onlyOwner {
        if (!guardians[g]) revert NotGuardian();
        guardians[g] = false;
        unchecked { guardianCount--; }
        if (guardianVetoThreshold > guardianCount) {
            guardianVetoThreshold = guardianCount;
        }
        emit GuardianRemoved(g);
    }

    function setGuardianVetoThreshold(uint256 threshold) external onlyOwner {
        if (!(threshold > 0 && threshold <= guardianCount)) revert BadThreshold();
        guardianVetoThreshold = threshold;
    }

    // --------------------------
    // Propose / Vote / Execute
    // --------------------------
    function propose(
        string calldata uri,
        uint64 timelockSeconds,
        uint64 expirySeconds
    ) external returns (uint256 id) {
        uint64 nowTs = uint64(block.timestamp);
        if (nowTs - lastProposedAt[msg.sender] < proposerCooldown) revert Cooldown();
        if (bytes(uri).length == 0) revert NoURI();
        if (expirySeconds <= timelockSeconds) revert BadWindows();

        unchecked { id = ++proposalCount; }
        Proposal storage p = _proposals[id];
        p.proposer = msg.sender;
        p.createdAt = nowTs;
        p.timelockEnd = nowTs + timelockSeconds;
        p.expiry = nowTs + expirySeconds;
        p.uri = uri;
        p.executed = false;
        p.canceled = false;

        lastProposedAt[msg.sender] = nowTs;
        emit ProposalCreated(id, msg.sender, uri, p.timelockEnd, p.expiry);
    }

    function updateRiskScore(uint256 id, uint16 riskScoreBps, string calldata note) external onlyOwner {
        if (!(id > 0 && id <= proposalCount)) revert BadId();
        if (riskScoreBps > 10000) revert BadScore();
        Proposal storage p = _proposals[id];
        if (p.canceled || p.executed) revert Finalized();
        p.riskScoreBps = riskScoreBps;
        emit RiskScoreUpdated(id, riskScoreBps, note);
    }

    function vote(uint256 id, bool support) external {
        if (!(id > 0 && id <= proposalCount)) revert BadId();
        Proposal storage p = _proposals[id];
        if (p.canceled || p.executed) revert Finalized();
        if (block.timestamp < p.timelockEnd) revert TimeLock();
        if (block.timestamp >= p.expiry) revert Expired();
        if (p.hasVoted[msg.sender]) revert AlreadyVoted();

        // Quadratic weight using reputation. weight = sqrt(reputation + 1)
        uint256 rep = reputation[msg.sender];
        uint256 weight = _isqrt(rep + 1);
        if (weight == 0) revert NoWeight();

        p.hasVoted[msg.sender] = true;
        if (support) {
            p.votesFor += weight;
        } else {
            p.votesAgainst += weight;
        }
        emit VoteCast(id, msg.sender, support, weight);
    }

    function guardianVeto(uint256 id, string calldata reason) external {
        if (!(id > 0 && id <= proposalCount)) revert BadId();
        Proposal storage p = _proposals[id];
        if (p.canceled || p.executed) revert Finalized();
        if (!guardians[msg.sender]) revert NotGuardian();
        if (p.vetoSigned[msg.sender]) revert AlreadyVetoed();
        p.vetoSigned[msg.sender] = true;
        unchecked { p.vetoCount += 1; }
        if (p.vetoCount >= guardianVetoThreshold) {
            p.canceled = true;
            emit ProposalCanceled(id, reason);
        }
    }

    function execute(uint256 id) external {
        if (!(id > 0 && id <= proposalCount)) revert BadId();
        Proposal storage p = _proposals[id];
        if (p.canceled || p.executed) revert Finalized();
        if (block.timestamp < p.timelockEnd) revert TimeLock();
        if (block.timestamp >= p.expiry) revert Expired();
        if (p.votesFor <= p.votesAgainst) revert NotPassed();
        // Optional risk gate: disable if risk too high (e.g., > 8000 bps)
        if (p.riskScoreBps > 8000) revert RiskRejected();

        p.executed = true;
        emit ProposalExecuted(id);
        // NOTE: This contract does not perform arbitrary execution for safety.
        // Integrate with off-chain/DI pipeline to act on execution events.
    }

    // --------------------------
    // Cross-chain signaling (off-chain bridges listen & act)
    // --------------------------
    function signal(uint256 id, uint64 dstChainId, string calldata action, string calldata data) external onlyOwner {
        if (!(id > 0 && id <= proposalCount)) revert BadId();
        emit CrossChainSignal(id, dstChainId, action, data);
    }

    // --------------------------
    // Views
    // --------------------------
    struct ProposalView {
        address proposer;
        uint64 createdAt;
        uint64 timelockEnd;
        uint64 expiry;
        bool executed;
        bool canceled;
        string uri;
        uint16 riskScoreBps;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 vetoCount;
    }

    function getProposal(uint256 id) external view returns (ProposalView memory v) {
        if (!(id > 0 && id <= proposalCount)) revert BadId();
        Proposal storage p = _proposals[id];
        v = ProposalView({
            proposer: p.proposer,
            createdAt: p.createdAt,
            timelockEnd: p.timelockEnd,
            expiry: p.expiry,
            executed: p.executed,
            canceled: p.canceled,
            uri: p.uri,
            riskScoreBps: p.riskScoreBps,
            votesFor: p.votesFor,
            votesAgainst: p.votesAgainst,
            vetoCount: p.vetoCount
        });
    }
}
