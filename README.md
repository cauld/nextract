# Overview
Nextract is a Extract Transform Load (ETL) platform build on top of Node.js. 

## Setup
- npm install
- git rm --cached src/plugins/config/default.json
- git rm --cached build/plugins/config/default.json
- When changes are made we have a series of build tasks that must be run. To automate this we use grunt. When developing open a separate terminal window and run the following command:
```grunt dev```
