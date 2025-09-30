pragma solidity ^0.8.28;

interface IERC20 {
    /// @notice See event details
event Approval(address indexed owner, address indexed spender, uint256 value);
    event Transfer(address indexed from, address indexed to, uint256 value);

    /// @notice See function details
function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    /// @notice See function details
function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);
    /// @notice See function details
function balanceOf(address owner) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);

    /// @notice See function details
function approve(address spender, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    /// @notice See function details
function transferFrom(address from, address to, uint256 value) external returns (bool);
}
