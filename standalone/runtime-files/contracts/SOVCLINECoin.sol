// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Custom errors for gas-efficient reverts
error NotOwner();
error ZeroOwner();
error NotMinter();
error AgentNotCoinBacked();
error BadParams();
error InsufficientBalance();
error AllowanceLow();
error ZeroTo();

/**
 * @title SOVCLINECoin
 * @notice ERC-20 compatible token for the SOVCLINE Runtime Sovereignty Protocol.
 *         Minting requires coin-backed agents (from off-chain dashboard) to be
 *         registered on-chain. Each mint includes runtime lineage collateral and
 *         emits audit events with embedded runtime hash for provenance.
 *
 * Features
 *  - Standard ERC-20: transfer/approve/transferFrom
 *  - Mint with runtime collateral (coin-backed agents only)
 *  - Burn to spawn validators/governance intents
 *  - Transfer with tag (runtime hash / memo)
 *  - Offline trade registry event for escrow scrolls
 *  - Governance sync hook to TokenOwnershipManager (reputation = balance)
 */
contract SOVCLINECoin {
    // ---------------------------
    // ERC-20 storage
    // ---------------------------
    string public name;
    string public symbol;
    uint8 public immutable decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // ownership + roles
    address public owner;
    mapping(address => bool) public isMinter; // operator accounts allowed to mint

    modifier onlyOwner() { if (msg.sender != owner) revert NotOwner(); _; }

    // ---------------------------
    // Agent gating and governance
    // ---------------------------
    // coin-backed agent registry (agent key derived from dashboard agent id)
    mapping(bytes32 => bool) public coinBackedAgent;

    // external governance hook (TokenOwnershipManager)
    interface IGovernance {
        function setReputation(address account, uint256 value) external;
    }
    IGovernance public governance;

    // ---------------------------
    // Runtime Collateral
    // ---------------------------
    struct RuntimeCollateral {
        string runtimeId;      // runtime_id
        string agentId;        // human-readable agent identifier
        uint256 entropyScore;  // scaled (e.g., 0..1000 or basis points off-chain)
        string lineageURI;     // URI to lineage bundle (ipfs/http)
        bool forensicClean;    // true if forensic sweep status refactored/clean
    }

    // ---------------------------
    // Events
    // ---------------------------
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    event AgentRegistered(bytes32 indexed agentKey, bool allowed);
    event GovernanceSet(address indexed governance);
    event MinterSet(address indexed account, bool allowed);

    event MintedWithRuntime(
        address indexed to,
        uint256 amount,
        bytes32 indexed agentKey,
        bytes32 runtimeHash,
        string runtimeId,
        string agentId,
        uint256 entropyScore,
        string lineageURI,
        bool forensicClean
    );

    event BurnedForValidator(
        address indexed from,
        uint256 amount,
        bytes32 indexed agentKey,
        string note
    );

    event TransferTagged(
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes32 indexed runtimeHash,
        string memo
    );

    event OfflineTradeRegistered(
        bytes32 indexed coinId,
        address indexed holder,
        string escrowURI
    );

    event GovernanceWeightSynced(address indexed holder, uint256 weight);
    event GovernanceWeightSyncFailed(address indexed holder, string reason);

    constructor(string memory _name, string memory _symbol, address _owner) {
        name = _name;
        symbol = _symbol;
        owner = _owner == address(0) ? msg.sender : _owner;
        isMinter[owner] = true;
        emit MinterSet(owner, true);
    }

    // ---------------------------
    // Admin
    // ---------------------------
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroOwner();
        owner = newOwner;
    }

    function setMinter(address account, bool allowed) external onlyOwner {
        isMinter[account] = allowed;
        emit MinterSet(account, allowed);
    }

    function setGovernance(address gov) external onlyOwner {
        governance = IGovernance(gov);
        emit GovernanceSet(gov);
    }

    function registerAgent(bytes32 agentKey, bool allowed) external onlyOwner {
        coinBackedAgent[agentKey] = allowed;
        emit AgentRegistered(agentKey, allowed);
    }

    function batchRegisterAgents(bytes32[] calldata keys, bool allowed) external onlyOwner {
        for (uint256 i = 0; i < keys.length; i++) {
            coinBackedAgent[keys[i]] = allowed;
            emit AgentRegistered(keys[i], allowed);
        }
    }

    // Utility for computing a runtime hash off/ on-chain
    function computeRuntimeHash(RuntimeCollateral memory c) public pure returns (bytes32) {
        return keccak256(abi.encode(c.runtimeId, c.agentId, c.entropyScore, c.lineageURI, c.forensicClean));
    }

    // ---------------------------
    // Mint / Burn
    // ---------------------------
    function _mint(address to, uint256 amount) internal {
        unchecked {
            totalSupply += amount;
            balanceOf[to] += amount;
        }
        emit Transfer(address(0), to, amount);
    }

    function _burn(address from, uint256 amount) internal {
        if (balanceOf[from] < amount) revert InsufficientBalance();
        unchecked {
            balanceOf[from] -= amount;
            totalSupply -= amount;
        }
        emit Transfer(from, address(0), amount);
    }

    // agentKey is bytes32 identifier of the coin-backed agent
    function mintWithRuntime(
        bytes32 agentKey,
        address to,
        uint256 amount,
        RuntimeCollateral calldata collateral
    ) external {
        if (!isMinter[msg.sender]) revert NotMinter();
        if (!coinBackedAgent[agentKey]) revert AgentNotCoinBacked();
        if (to == address(0) || amount == 0) revert BadParams();

        _mint(to, amount);
        bytes32 runtimeHash = computeRuntimeHash(collateral);
        emit MintedWithRuntime(
            to,
            amount,
            agentKey,
            runtimeHash,
            collateral.runtimeId,
            collateral.agentId,
            collateral.entropyScore,
            collateral.lineageURI,
            collateral.forensicClean
        );
    }

    function burnForValidator(bytes32 agentKey, uint256 amount, string calldata note) external {
        _burn(msg.sender, amount);
        emit BurnedForValidator(msg.sender, amount, agentKey, note);
    }

    // ---------------------------
    // Transfers
    // ---------------------------
    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed < amount) revert AllowanceLow();
        if (allowed != type(uint256).max) {
            unchecked { allowance[from][msg.sender] = allowed - amount; }
            emit Approval(from, msg.sender, allowance[from][msg.sender]);
        }
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        if (to == address(0)) revert ZeroTo();
        if (balanceOf[from] < amount) revert InsufficientBalance();
        unchecked {
            balanceOf[from] -= amount;
            balanceOf[to] += amount;
        }
        emit Transfer(from, to, amount);
    }

    // Optional transfer tagging with runtime hash and memo for audit trail
    function transferWithTag(address to, uint256 amount, bytes32 runtimeHash, string calldata memo) external returns (bool) {
        _transfer(msg.sender, to, amount);
        emit TransferTagged(msg.sender, to, amount, runtimeHash, memo);
        return true;
    }

    // ---------------------------
    // Offline trade registry
    // ---------------------------
    function registerOfflineTrade(bytes32 coinId, string calldata escrowURI) external {
        // permissionless registry for notarized escrow scrolls
        emit OfflineTradeRegistered(coinId, msg.sender, escrowURI);
    }

    // ---------------------------
    // Governance sync (best-effort)
    // ---------------------------
    function syncGovernanceWeight(address holder) external {
        if (address(governance) == address(0)) {
            emit GovernanceWeightSyncFailed(holder, "NO_GOVERNANCE");
            return;
        }
        uint256 weight = balanceOf[holder];
        // try/catch on interface call to avoid reverts if not owner
        try governance.setReputation(holder, weight) {
            emit GovernanceWeightSynced(holder, weight);
        } catch {
            emit GovernanceWeightSyncFailed(holder, "CALL_FAILED");
        }
    }
}
