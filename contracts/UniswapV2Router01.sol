    // ...existing code...

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/lib/contracts/libraries/TransferHelper.sol";

import "./libraries/UniswapV2Library.sol";
import "./interfaces/IUniswapV2Router01.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IWETH.sol";

/// @title UniswapV2Router01
/// @author Steven Dauplaise
/// @notice Uniswap V2 Router for adding/removing liquidity and swapping tokens/ETH. Extensible for custom blockchain use.
contract UniswapV2Router01 is IUniswapV2Router01 {

    // State variables
    address public immutable override factory;
    address public immutable WETH_;

    // Interface compliance stubs
    function WETH() public view override returns (address) {
        return WETH_;
    }

    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external payable override returns (uint256 amountToken, uint256 amountETH, uint256 liquidity) {
        revert("addLiquidityETH not implemented");
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity_,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external override returns (uint256 amountA, uint256 amountB) {
        revert("removeLiquidity not implemented");
    }

    function removeLiquidityETH(
        address token,
        uint256 liquidity_,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external override returns (uint256 amountToken, uint256 amountETH) {
        revert("removeLiquidityETH not implemented");
    }

    function removeLiquidityWithPermit(
        address tokenA,
        address tokenB,
        uint256 liquidity_,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline,
        bool approveMax,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override returns (uint256 amountA, uint256 amountB) {
        revert("removeLiquidityWithPermit not implemented");
    }

    function removeLiquidityETHWithPermit(
        address token,
        uint256 liquidity_,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline,
        bool approveMax,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override returns (uint256 amountToken, uint256 amountETH) {
        revert("removeLiquidityETHWithPermit not implemented");
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external override returns (uint256[] memory amounts) {
        revert("swapExactTokensForTokens not implemented");
    }

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external override returns (uint256[] memory amounts) {
        revert("swapTokensForExactTokens not implemented");
    }

    // Custom errors
    error InvalidPath();
    error InsufficientOutputAmount();
    error ExcessiveInputAmount();

    // Events
    event Swap(address indexed sender, address[] path, uint256[] amounts, address to);

    // Constructor
    constructor(address _factory, address _WETH) {
        factory = _factory;
        WETH_ = _WETH;
    }

    // Internal swap function
    function _swap(uint256[] memory amounts, address[] memory path, address _to) internal {
        uint256 len = path.length;
        for (uint256 i = 0; i < len - 1; ) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = UniswapV2Library.sortTokens(input, output);
            uint256 amountOut = amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) =
                input == token0 ? (uint256(0), amountOut) : (amountOut, uint256(0));
            address pair = UniswapV2Library.pairFor(factory, input, output);
            address to = i < len - 2 ? UniswapV2Library.pairFor(factory, output, path[i + 2]) : _to;
            IUniswapV2Pair(pair).swap(
                amount0Out, amount1Out, to, new bytes(0)
            );
            unchecked { ++i; }
        }
    }

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "UniswapV2Router: EXPIRED");
        _;
    }

    /// @inheritdoc IUniswapV2Router01
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external override returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        // Implementation goes here
        // TODO: Implement addLiquidity logic
        revert("addLiquidity not implemented");
    }

    /// @inheritdoc IUniswapV2Router01
    function swapExactETHForTokens(uint256 amountOutMin, address[] calldata path, address to, uint256 deadline)
        external
        payable
        override
        ensure(deadline)
        returns (uint256[] memory amounts)
    {
    if (path[0] != WETH_) revert InvalidPath();
    amounts = UniswapV2Library.getAmountsOut(factory, msg.value, path);
        if (amounts[amounts.length - 1] < amountOutMin) revert InsufficientOutputAmount();
    IWETH(WETH_).deposit{ value: amounts[0] }();
    assert(IWETH(WETH_).transfer(UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]));
        _swap(amounts, path, to);
        emit Swap(msg.sender, path, amounts, to);
    }

    /// @inheritdoc IUniswapV2Router01
    function swapTokensForExactETH(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external override ensure(deadline) returns (uint256[] memory amounts) {
    if (path[path.length - 1] != WETH_) revert InvalidPath();
    amounts = UniswapV2Library.getAmountsIn(factory, amountOut, path);
        if (amounts[0] > amountInMax) revert ExcessiveInputAmount();
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, address(this));
    IWETH(WETH_).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferETH(to, amounts[amounts.length - 1]);
        emit Swap(msg.sender, path, amounts, to);
    }

    /// @inheritdoc IUniswapV2Router01
    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external override ensure(deadline) returns (uint256[] memory amounts) {
    if (path[path.length - 1] != WETH_) revert InvalidPath();
    amounts = UniswapV2Library.getAmountsOut(factory, amountIn, path);
        if (amounts[amounts.length - 1] < amountOutMin) revert InsufficientOutputAmount();
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, address(this));
    IWETH(WETH_).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferETH(to, amounts[amounts.length - 1]);
        emit Swap(msg.sender, path, amounts, to);
    }

    /// @inheritdoc IUniswapV2Router01
    function swapETHForExactTokens(uint256 amountOut, address[] calldata path, address to, uint256 deadline)
        external
        payable
        override
        ensure(deadline)
        returns (uint256[] memory amounts)
    {
    if (path[0] != WETH_) revert InvalidPath();
    amounts = UniswapV2Library.getAmountsIn(factory, amountOut, path);
        if (amounts[0] > msg.value) revert ExcessiveInputAmount();
    IWETH(WETH_).deposit{ value: amounts[0] }();
    assert(IWETH(WETH_).transfer(UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]));
        _swap(amounts, path, to);
        if (msg.value > amounts[0]) TransferHelper.safeTransferETH(msg.sender, msg.value - amounts[0]); // refund dust eth, if any
        emit Swap(msg.sender, path, amounts, to);
    }

    /// @inheritdoc IUniswapV2Router01
    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB)
        public
        pure
        override
        returns (uint256 amountB)
    {
        return UniswapV2Library.quote(amountA, reserveA, reserveB);
    }

    /// @inheritdoc IUniswapV2Router01
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut)
        public
        pure
        override
        returns (uint256 amountOut)
    {
        return UniswapV2Library.getAmountOut(amountIn, reserveIn, reserveOut);
    }

    /// @inheritdoc IUniswapV2Router01
    function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut)
        public
        pure
        override
        returns (uint256 amountIn)
    {
        return UniswapV2Library.getAmountIn(amountOut, reserveIn, reserveOut);
    }

    /// @inheritdoc IUniswapV2Router01
    function getAmountsOut(uint256 amountIn, address[] memory path)
        public
        view
        override
        returns (uint256[] memory amounts)
    {
    return UniswapV2Library.getAmountsOut(factory, amountIn, path);
    }

    /// @inheritdoc IUniswapV2Router01
    function getAmountsIn(uint256 amountOut, address[] memory path)
        public
        view
        override
        returns (uint256[] memory amounts)
    {
    return UniswapV2Library.getAmountsIn(factory, amountOut, path);
    }
}

