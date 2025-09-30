#!/bin/bash

echo "Bulk updating Solidity 0.6.6 syntax to 0.8.x..."

# 1. Remove 'public' from constructor declarations in contracts directory only
find contracts -name "*.sol" -type f -exec sed -i 's/\bconstructor\s*(.*)\s*public\s*{/\1{/g' {} +

# 2. Replace all uint(-1) with type(uint256).max in contracts only
find contracts -name "*.sol" -type f -exec sed -i 's/uint(-1)/type(uint256).max/g' {} +

# 3. Handle the WETH payable transfer issue
find contracts -name "*WETH9.sol" -type f -exec sed -i 's/msg\.sender\.transfer(\([^*]*\))/payable(msg.sender).transfer(\1)/g' {} +

echo "Completed bulk updates for contracts directory (preserving lib dependencies)"
