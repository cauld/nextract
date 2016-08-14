# Overview

## Setup
- npm install
- git rm --cached plugins/config/default.json
- To make sure we don't introduce syntax errors enable JavaScript linting via ESlint. This is a githook that should be enabled in your env so that failed a failed lint stops the commit. Run the following:
```
cp {path/to/nextract}/githooks/pre-commit.warn.sh {path/to/nextract}/.git/hooks/pre-commit
```
