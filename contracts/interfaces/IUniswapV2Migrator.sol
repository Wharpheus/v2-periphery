pragma solidity ^0.8.28;

interface IUniswapV2Migrator {
    /// @notice See function details
function migrate(address token, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline)
        external;
}
