#!/usr/bin/env bash

echo "Installing required npm packages..."
npm install

echo "Excluding config file changes from git index to prevent committing sensitive data..."
git rm --cached "/src/plugins/config/default.json" > /dev/null 2>&1
git rm --cached "/build/plugins/config/default.json" > /dev/null 2>&1
