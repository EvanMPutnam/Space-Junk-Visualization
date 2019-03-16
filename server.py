from flask import Flask, render_template, jsonify, request, json, send_file
import sys
import satellite_data
import os
import utils.utils as utilities


app = Flask(__name__)



@app.route("/")
def index():
      return render_template("index.html")

@app.route("/init", methods=['GET'])
def get_initial_satellites():
      sat_vals = satellite_data.get_initial_satellites()
      return jsonify(sat_vals)

@app.route("/earth")
def get_earth_image():
      return send_file('static/js/earth.jpg')

@app.route("/glow")
def get_glow_image():
      return send_file('static/js/glow1.png')

if __name__ == '__main__':
      app.run(host='0.0.0.0', port=8080)