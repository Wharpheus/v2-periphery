#!/usr/bin/env bash

# Batch NatSpec and import fixer for Solidity files
find src/ -name "*.sol" | while read -r file; do
  # Add @title to contract if missing
  sed -i '/contract /{
    N
    /@title/!{
      s/contract \([A-Za-z0-9_]*\)/\/\/\/ @title \1\n&/
    }
  }' "$file"

  # Add @author to contract if missing
  sed -i '/contract /{
    N
    /@author/!{
      s/contract \([A-Za-z0-9_]*\)/\/\/\/ @author YourName\n&/
    }
  }' "$file"

  # Add @notice to contract if missing
  sed -i '/contract /{
    N
    /@notice/!{
      s/contract \([A-Za-z0-9_]*\)/\/\/\/ @notice See contract details below\n&/
    }
  }' "$file"

  # Add @notice to public variables if missing
  sed -i '/public /{
    N
    /@notice/!{
      s/\(public [A-Za-z0-9_ ]*;\)/\/\/\/ @notice See variable details\n\1/
    }
  }' "$file"

  # Add @notice to events if missing
  sed -i '/event /{
    N
    /@notice/!{
      s/event \([A-Za-z0-9_]*\)/\/\/\/ @notice See event details\n&/
    }
  }' "$file"

  # Add @notice to functions if missing
  sed -i '/function /{
    N
    /@notice/!{
      s/function \([A-Za-z0-9_]*\)/\/\/\/ @notice See function details\n&/
    }
  }' "$file"

  # Replace global imports with named imports
  sed -i 's/import "\(.*\)";/import { } from \1;/' "$file"
done