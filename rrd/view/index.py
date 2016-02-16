#-*- coding:utf-8 -*-
from flask import render_template
from rrd import app
from rrd.model.endpoint import Endpoint

@app.route("/")
def index():
    raw_endpoints = Endpoint.search("");
    endpoints = [e.endpoint for e in raw_endpoints]
    endpoints.sort()

    return render_template("index.html", **locals())
