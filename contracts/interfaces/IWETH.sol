pragma solidity ^0.8.28;

interface IWETH {
    /// @notice See function details
function deposit() external payable;
    function transfer(address to, uint256 value) external returns (bool);
    /// @notice See function details
function withdraw(uint256) external;
}
