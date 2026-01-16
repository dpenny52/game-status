#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

for ((i=1; i<=$1; i++)); do
  echo "Iteration $i"
  echo "--------------------------------"
  
  result=$(claude --dangerously-skip-permissions -p "$(cat prompt.md)" --verbose --output-format text 2>/tmp/ralph.log) || true

  echo "$result"

  echo ""
  echo "--- End of iteration $i ---"
  echo ""
done

echo "Reached max iterations ($1)"
exit
