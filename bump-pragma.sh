#!/bin/bash

# Script to update Solidity 0.6.6 to 0.8.x compatibility

# 1. Fix constructors - remove 'public' from constructors since it's ignored in 0.8.x
find contracts -name "*.sol" -exec sed -i 's/ constructor([^)]*) public {/ constructor\1 {/' {} +

# 2. Fix uint(-1) conversions - replace with type(uint256).max
find contracts -name "*.sol" -exec sed -i 's/(uint(-1))/type(uint256).max/g' {} +

echo "Updated Solidity compatibility for 0.8.x"
