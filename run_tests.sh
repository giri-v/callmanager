#!/bin/bash

# Script to run all test files

echo "Starting test execution..."

# Find all test files in src/ and run them
for test_file in src/test-*.js; do
  if [ -f "$test_file" ]; then
    echo ""
    echo "Running $test_file..."
    node "$test_file"
    echo "Finished $test_file."
  else
    echo "Warning: Test file $test_file not found."
  fi
done

echo ""
echo "All tests finished."
