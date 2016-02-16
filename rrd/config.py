#-*-coding:utf8-*-
import os

#-- dashboard db config --
DASHBOARD_DB_HOST = "192.168.1.33"
DASHBOARD_DB_PORT = 3306
DASHBOARD_DB_USER = "root"
DASHBOARD_DB_PASSWD = "701701"
DASHBOARD_DB_NAME = "dashboard"

#-- graph db config --
GRAPH_DB_HOST = "192.168.1.33"
GRAPH_DB_PORT = 3306
GRAPH_DB_USER = "root"
GRAPH_DB_PASSWD = "701701"
GRAPH_DB_NAME = "graph"

#-- app config --
DEBUG = True
SECRET_KEY = "secret-key"
SESSION_COOKIE_NAME = "open-falcon"
PERMANENT_SESSION_LIFETIME = 3600 * 24 * 30
SITE_COOKIE = "open-falcon-ck"

#-- query config --
QUERY_ADDR = "http://192.168.1.33:9966"

BASE_DIR = "/home/cooltime/falcon/dashboard/"
LOG_PATH = os.path.join(BASE_DIR,"log/")

try:
    from rrd.local_config import *
except:
    pass

