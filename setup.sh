#!/usr/bin/env bash

echo "Installing required npm packages..."
npm install

echo "Add default config files..."
mkdir src/plugins/config
mkdir build/plugins/config
node utils/add_default_config.js
