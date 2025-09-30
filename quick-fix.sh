# Fix foundry.toml remappings
echo '[profile.default]
remappings = [
  "@uniswap/v2-core/=lib/v2-core/",
  "@uniswap/lib/=lib/lib/",
  "@openzeppelin/=lib/openzeppelin-contracts/"
]
' > foundry.toml

# Find corrupted lines in Solidity files
grep -r 'function to ' contracts/ agents/
grep -r 'function that ' contracts/ agents/
grep -r '^contract to ' contracts/ agents/
grep -r '^contract that ' contracts/ agents/