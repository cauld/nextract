#!/usr/bin/env bash

echo "Installing required npm packages..."
npm install grunt -g
npm install

echo "Add default config files..."
mkdir config
node utils/add_default_config.js

echo "Setting up internal database..."
chmod +w internal/db
touch internal/db/nextract.sqlite3
