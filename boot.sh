#!/bin/bash

# Run this script inside of SPACE_VIS at the same level as server.py
# Assumes that you have browserify installed globally with npm.  npm install -g browserify
# npm init sequence
#
#       npm init --y
#       npm install three
#       npm install satellite.js
# If you are using the update script found in satellite_data_fetch.py then you need curl
#

# pip3 install flask
# pip3 install sgp4
# pip3 install requests
# pip3 install python-dateutils

browserify static/js/template.js -o static/js/index.js
python3 server.py