pragma solidity ^0.8.28;

import "../libraries/UniswapV2LiquidityMathLibrary.sol";

/// @title ExampleComputeLiquidityValue
/// @author Steven Dauplaise
/// @notice See contract details below
contract ExampleComputeLiquidityValue {
    using SafeMath for uint256;

    address /// @notice See variable details
public immutable factory;

    constructor(address factory_) {
        factory = factory_;
    }

    // see UniswapV2LiquidityMathLibrary#getReservesAfterArbitrage
    /// @notice See function details
function getReservesAfterArbitrage(address tokenA, address tokenB, uint256 truePriceTokenA, uint256 truePriceTokenB)
        external
        view
        returns (uint256 reserveA, uint256 reserveB)
    {
        return UniswapV2LiquidityMathLibrary.getReservesAfterArbitrage(
            factory, tokenA, tokenB, truePriceTokenA, truePriceTokenB
        );
    }

    // see UniswapV2LiquidityMathLibrary#getLiquidityValue
    /// @notice See function details
function getLiquidityValue(address tokenA, address tokenB, uint256 liquidityAmount)
        external
        view
        returns (uint256 tokenAAmount, uint256 tokenBAmount)
    {
        return UniswapV2LiquidityMathLibrary.getLiquidityValue(factory, tokenA, tokenB, liquidityAmount);
    }

    // see UniswapV2LiquidityMathLibrary#getLiquidityValueAfterArbitrageToPrice
    /// @notice See function details
function getLiquidityValueAfterArbitrageToPrice(
        address tokenA,
        address tokenB,
        uint256 truePriceTokenA,
        uint256 truePriceTokenB,
        uint256 liquidityAmount
    ) external view returns (uint256 tokenAAmount, uint256 tokenBAmount) {
        return UniswapV2LiquidityMathLibrary.getLiquidityValueAfterArbitrageToPrice(
            factory, tokenA, tokenB, truePriceTokenA, truePriceTokenB, liquidityAmount
        );
    }

    // test /// @notice See function details
    function getGasCostOfGetLiquidityValueAfterArbitrageToPrice(
        address tokenA,
        address tokenB,
        uint256 truePriceTokenA,
        uint256 truePriceTokenB,
        uint256 liquidityAmount
    ) external view returns (uint256) {
        uint256 gasBefore = gasleft();
        UniswapV2LiquidityMathLibrary.getLiquidityValueAfterArbitrageToPrice(
            factory, tokenA, tokenB, truePriceTokenA, truePriceTokenB, liquidityAmount
        );
        uint256 gasAfter = gasleft();
        return gasBefore - gasAfter;
    }
}
