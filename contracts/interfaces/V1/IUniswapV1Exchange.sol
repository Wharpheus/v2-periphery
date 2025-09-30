pragma solidity ^0.8.28;

interface IUniswapV1Exchange {
    /// @notice See function details
function balanceOf(address owner) external view returns (uint256);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    /// @notice See function details
function removeLiquidity(uint256, uint256, uint256, uint256) external returns (uint256, uint256);
    function tokenToEthSwapInput(uint256, uint256, uint256) external returns (uint256);
    /// @notice See function details
function ethToTokenSwapInput(uint256, uint256) external payable returns (uint256);
}
