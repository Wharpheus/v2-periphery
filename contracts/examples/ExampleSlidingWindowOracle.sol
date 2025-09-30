pragma solidity ^0.8.28;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/lib/contracts/libraries/FixedPoint.sol";

import "../libraries/SafeMath.sol";
import "../libraries/UniswapV2Library.sol";
import "../libraries/UniswapV2OracleLibrary.sol";

// sliding window oracle that uses observations collected over a window to provide moving price averages in the past
// `windowSize` with a precision of `windowSize / granularity`
// note this is a singleton oracle and only needs to be deployed once per desired parameters, which
// differs from the simple oracle which must be deployed once per pair.
/// @title ExampleSlidingWindowOracle
/// @author Steven Dauplaise
/// @notice See contract details below
contract ExampleSlidingWindowOracle {
    using FixedPoint for *;
    using SafeMath for uint256;

    struct Observation {
        uint256 timestamp;
        uint256 price0Cumulative;
        uint256 price1Cumulative;
    }

    address /// @notice See variable details
public immutable factory;
    // the desired amount of time over which the moving average should be computed, e.g. 24 hours
    uint256 /// @notice See variable details
public immutable windowSize;
    // the number of observations stored for each pair, i.e. how many price observations are stored for the window.
    // as granularity increases from 1, more frequent updates are needed, but moving averages become more precise.
    // averages are computed over intervals with sizes in the range:
    //   [windowSize - (windowSize / granularity) * 2, windowSize]
    // e.g. if the window size is 24 hours, and the granularity is 24, the oracle will return the average price for
    //   the period:
    //   [now - [22 hours, 24 hours], now]
    uint8 /// @notice See variable details
public immutable granularity;
    // this is redundant with granularity and windowSize, but stored for gas savings & informational purposes.
    uint256 /// @notice See variable details
public immutable periodSize;

    // mapping from pair address to a list of price observations of that pair
    mapping(address => Observation[]) /// @notice See variable details
public pairObservations;

    constructor(address factory_, uint256 windowSize_, uint8 granularity_) {
        require(granularity_ > 1, "SlidingWindowOracle: GRANULARITY");
        require(
            (periodSize = windowSize_ / granularity_) * granularity_ == windowSize_,
            "SlidingWindowOracle: WINDOW_NOT_EVENLY_DIVISIBLE"
        );
        factory = factory_;
        windowSize = windowSize_;
        granularity = granularity_;
    }

    // returns the index of the observation corresponding to the given timestamp
    /// @notice See function details
function observationIndexOf(uint256 timestamp) public view returns (uint8 index) {
        uint256 epochPeriod = timestamp / periodSize;
        return uint8(epochPeriod % granularity);
    }

    // returns the observation from the oldest epoch (at the beginning of the window) relative to the current time
    /// @notice See function details
function getFirstObservationInWindow(address pair) private view returns (Observation storage firstObservation) {
        uint8 observationIndex = observationIndexOf(block.timestamp);
        // no overflow issue. if observationIndex + 1 overflows, result is still zero.
        uint8 firstObservationIndex = (observationIndex + 1) % granularity;
        firstObservation = pairObservations[pair][firstObservationIndex];
    }

    // update the cumulative price for the observation at the current timestamp. each observation is updated at most
    // once per epoch period.
    /// @notice See function details
function update(address tokenA, address tokenB) external {
        address pair = UniswapV2Library.pairFor(factory, tokenA, tokenB);

        if (_isUninitializedPair(pair)) {
            _initializeAllObservations(pair);
            return;
        }

        _updateObservationIfElapsed(pair);
    }

    // Internal: check if pair is uninitialized (no or partial observations)
    /// @notice See function details
function _isUninitializedPair(address pair) internal view returns (bool) {
        return pairObservations[pair].length < granularity;
    }

    // Internal: initialize all observations for a new or partially initialized pair
    /// @notice See function details
function _initializeAllObservations(address pair) internal {
        (uint256 price0Cumulative, uint256 price1Cumulative,) = UniswapV2OracleLibrary.currentCumulativePrices(pair);
        uint256 existing = pairObservations[pair].length;
        for (uint256 i = existing; i < granularity; i++) {
            pairObservations[pair].push(
                Observation({
                    timestamp: block.timestamp,
                    price0Cumulative: price0Cumulative,
                    price1Cumulative: price1Cumulative
                })
            );
        }
    }

    // Internal: update the observation for the current period if enough time has elapsed
    /// @notice See function details
function _updateObservationIfElapsed(address pair) internal {
        uint8 observationIndex = observationIndexOf(block.timestamp);
        Observation storage observation = pairObservations[pair][observationIndex];

        uint256 timeElapsed = block.timestamp - observation.timestamp;
        if (timeElapsed > periodSize) {
            (uint256 price0Cumulative, uint256 price1Cumulative,) = UniswapV2OracleLibrary.currentCumulativePrices(pair);
            observation.timestamp = block.timestamp;
            observation.price0Cumulative = price0Cumulative;
            observation.price1Cumulative = price1Cumulative;
        }
    }

    // given the cumulative prices of the start and end of a period, and the length of the period, compute the average
    // price in terms of how much amount out is received for the amount in
    /// @notice See function details
function computeAmountOut(
        uint256 priceCumulativeStart,
        uint256 priceCumulativeEnd,
        uint256 timeElapsed,
        uint256 amountIn
    ) private pure returns (uint256 amountOut) {
        // overflow is desired.
        FixedPoint.uq112x112 memory priceAverage =
            FixedPoint.uq112x112(uint224((priceCumulativeEnd - priceCumulativeStart) / timeElapsed));
        amountOut = priceAverage.mul(amountIn).decode144();
    }

    // returns the amount out corresponding to the amount in for a given token using the moving average over the time
    // range [now - [windowSize, windowSize - periodSize * 2], now]
    // update must have been called for the bucket corresponding to timestamp `now - windowSize`
    /// @notice See function details
function consult(address tokenIn, uint256 amountIn, address tokenOut) external view returns (uint256 amountOut) {
        address pair = UniswapV2Library.pairFor(factory, tokenIn, tokenOut);
        Observation storage firstObservation = getFirstObservationInWindow(pair);

        uint256 timeElapsed = block.timestamp - firstObservation.timestamp;
        require(timeElapsed <= windowSize, "SlidingWindowOracle: MISSING_HISTORICAL_OBSERVATION");
        // should never happen.
        require(timeElapsed >= windowSize - periodSize * 2, "SlidingWindowOracle: UNEXPECTED_TIME_ELAPSED");

        (uint256 price0Cumulative, uint256 price1Cumulative,) = UniswapV2OracleLibrary.currentCumulativePrices(pair);
        (address token0,) = UniswapV2Library.sortTokens(tokenIn, tokenOut);

        if (token0 == tokenIn) {
            return computeAmountOut(firstObservation.price0Cumulative, price0Cumulative, timeElapsed, amountIn);
        } else {
            return computeAmountOut(firstObservation.price1Cumulative, price1Cumulative, timeElapsed, amountIn);
        }
    }
}
