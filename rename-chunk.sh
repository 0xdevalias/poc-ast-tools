#!/usr/bin/env zsh

# Check if the correct number of arguments is provided
if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <old_file> <new_file>"
  exit 1
fi

old_file=$1
new_file=$2

# Check if both arguments are regular files
if [ ! -f "$old_file" ]; then
  echo "Error: $old_file is not a file."
  exit 1
fi

if [ ! -f "$new_file" ]; then
  echo "Error: $new_file is not a file."
  exit 1
fi

# Check if the old file is tracked by Git
if ! git ls-files --error-unmatch "$old_file" &> /dev/null; then
  echo "Error: $old_file is not tracked by Git."
  exit 1
fi

echo "Starting the file renaming process..."

# Temporarily rename the new file to preserve it
mv $new_file $new_file.new

# Use git mv to rename the old file to the new file's original name
git mv $old_file $new_file

# Restore the originally new file from its temporary name
mv $new_file.new $new_file

echo "File renaming complete. $old_file has been renamed to $new_file."
