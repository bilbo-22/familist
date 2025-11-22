#!/bin/bash

# Add all changes
git add .

# Ask for commit message
echo "Enter commit message:"
read commit_message

if [ -z "$commit_message" ]; then
  echo "Commit message cannot be empty. Aborting."
  exit 1
fi

git commit -m "$commit_message"

# Check if a remote exists before pushing
if git remote | grep -q .; then
    echo "Pushing to remote..."
    git push
else
    echo "-------------------------------------------------------"
    echo "WARNING: No remote repository configured."
    echo "Changes have been committed locally."
    echo "To push to GitHub/GitLab, run: git remote add origin <url>"
    echo "-------------------------------------------------------"
fi
