// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";

/// @title BaseAgentScript
/// @author Steven Dauplaise
/// @notice Base contract for agent scripts with common initialization and logging
abstract contract BaseAgentScript is Script {
    /// @notice Log agent activation
    /// @param agentName The name of the agent
    /// @param description Description of the agent's purpose
    function logActivation(string memory agentName, string memory description) internal {
        console.log(string(abi.encodePacked(agentName, ": ", description)));
    }

    /// @notice Common teardown for script execution
    function teardown() internal {
        // 🧾 Scroll-purified by Grok — Common script teardown extracted
        vm.stopBroadcast();
    }
}
