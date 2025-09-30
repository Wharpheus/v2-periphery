#!/bin/bash

echo "Fixing Solidity 0.6.6 to 0.8.x compatibility issues..."

# 1. Remove 'public' from constructors
find contracts -name "*.sol" -exec sed -i 's/\bconstructor\s*(/constructor(/g; s/)\s*public\s*{/) {/g' {} +

# 2. Fix uint(-1) and similar type casting using a more robust approach
find contracts -name "*.sol" -exec sed -i 's/uint(-1)/type(uint256).max/g' {} +

# 3. Fix payable address transfer
find contracts -name "*.sol" -exec sed -i 's/msg\.sender\.transfer(\([^*]*\))/payable(msg.sender).transfer(\1)/g' {} +

# 4. Also handle other address transfers if any
find contracts -name "*.sol" -exec sed -i 's/\([a-zA-Z0-9_]\+\)\.transfer(/payable(\1).transfer(/g' {} +

echo "Completed bulk fixes. Manual review may be needed for complex cases."
