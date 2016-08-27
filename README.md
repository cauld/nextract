# Overview
Nextract is a Extract Transform Load (ETL) platform build on top of Node.js.

## Features

 - Support for the following databases; PostgreSQL, MySQL, MariaDB, SQLite and MSSQL
 - Accepts input from CSV, JSON, and/or database queries.
 - Supported output to CSV, JSON, and/or database tables.
 - Core plugins with most common ETL operations included (i.e.) sorting, i/o, querying, etc.
 - Easily extendable 3rd party plugin system

## Setup

####OS X & Linux

 1. Install Node (preferrably 4.x)
 2. Open a terminal and run **./setup.sh**.  This will install all the necessary npm packages and generated a default configuration file.
 3. Open the default configuration file and customize to you needs by adding your databases, setting a log file path, etc.
