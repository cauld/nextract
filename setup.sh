#!/usr/bin/env bash

echo "Installing required npm packages..."
npm install

echo "Add default config files..."
node utils/add_default_config.js
