#!/bin/bash

#Run all grunt tasks (e.g.) eslint, generate updated api docs, etc
node_modules/.bin/grunt

#We need to add any updated API doc files create by grunt
git add apidocs
