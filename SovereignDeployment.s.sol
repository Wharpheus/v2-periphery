// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "contracts/SovereignLiquidityRouter.sol";
import "contracts/MutationLedger.sol";

contract SovereignDeploymentScript is Script {
    function run() external {
        vm.startBroadcast();

        // Deploy MutationLedger
        MutationLedger ledger = new MutationLedger();

        // Deploy SovereignLiquidityRouter with Uniswap factory and WETH addresses from .env
        address factory = 0x4820B2866e1cF837Ba61f46D0a1EAAB2451d40ce; // Placeholder Uniswap factory on Sepolia
        address weth = 0xDD13E55209Fd76AfE204dBda4007C227904f0a81; // Sepolia WETH

        SovereignLiquidityRouter router = new SovereignLiquidityRouter(factory, weth);

        console.log("MutationLedger deployed at:", address(ledger));
        console.log("SovereignLiquidityRouter deployed at:", address(router));

        vm.stopBroadcast();
    }
}
