import os
import random
import logging
from decimal import Decimal
import requests
import flask
from flask import Flask, send_file
from flask_cors import CORS
from PIL import Image, ExifTags
from yaml import load

logging.basicConfig()
logging.getLogger("").setLevel(logging.DEBUG)
logger = logging.getLogger(__name__)

with open("config.yml") as f:
    config = load(f)

RESIZED_IMG_PATH = config["resized_img_path"]
PICTURES_DIRECTORY = config["pictures_directory"]
THUMB_SIZE = config["thumb_size"]

random.seed()


def get_fnames(dir_):
    all_files = []
    for root, _, files in os.walk(dir_):
        for name in files:
            _, ext = os.path.splitext(name)
            ext = ext.lower()[1:]
            if ext not in ["png", "jpg", "jpeg"]:
                continue
            if ext == "jpeg":
                ext = "jpg"
            all_files.append((os.path.join(root, name), ext))
    return all_files


def orient(image):
    orientation = None
    for orientation in ExifTags.TAGS:
        if ExifTags.TAGS[orientation] == "Orientation":
            break
    exif = dict(image._getexif().items())  # pylint: disable=protected-access
    if exif[orientation] == 3:
        return image.rotate(180, expand=True)
    elif exif[orientation] == 6:
        return image.rotate(270, expand=True)
    elif exif[orientation] == 8:
        return image.rotate(90, expand=True)
    return image


def resize(img):
    with open(img, "rb") as f:
        with Image.open(f) as image:
            image = orient(image)
            image.thumbnail(THUMB_SIZE, Image.ANTIALIAS)
            image.save(RESIZED_IMG_PATH)


to_show = []
shown = []
app = Flask(__name__)
CORS(app, resources={"*": {"origins": "*"}})


def resize_and_send(img):
    resize(img[0])
    return send_file(RESIZED_IMG_PATH, mimetype="image/" + img[1])


@app.route("/")
def get_img():
    global to_show
    if not to_show:
        to_show = get_fnames(PICTURES_DIRECTORY)
        random.shuffle(to_show)
    img = to_show.pop(0)
    shown.append(img)
    if len(shown) > 10:
        shown.pop(0)
    return resize_and_send(img)


@app.route("/rewind")
def rewind():
    # shown[-1] is the one currently on the screen. shown[-2] is the one they
    # actually want to see.
    if len(shown) < 2:
        flask.abort(404)
    to_show.insert(0, shown.pop())
    return resize_and_send(shown[-1])

ynab_cache = {}


def ynab_request(path):
    url = "https://api.youneedabudget.com/v1/" + path.lstrip("/")
    token = config["ynab"]["token"]
    headers = {"Authorization": "Bearer {}".format(token)}
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    return resp.json()


def _cache_all_budgets():
    if "budgets" in ynab_cache:
        return
    ynab_cache["budgets"] = {}
    budgets = ynab_request("/budgets")["data"]["budgets"]
    for json_ in budgets:
        ynab_cache["budgets"][json_["id"]] = json_


def _get_all_categories():
    unique_budget_ids = {cat["budget_id"]
                         for cat in config["ynab"]["balances"]}
    ret = {}
    for budget_id in unique_budget_ids:
        resp = ynab_request("/budgets/{}/categories".format(budget_id))["data"]
        for group in resp["category_groups"]:
            for category in (group.get("categories") or []):
                ret[(budget_id, category["id"])] = category
    return ret


@app.route("/ynab")
def ynab():
    _cache_all_budgets()
    budgets = ynab_cache["budgets"]
    categories = _get_all_categories()
    balances = []
    for cat in config["ynab"]["balances"]:
        json_ = categories[(cat["budget_id"], cat["category_id"])]
        # FIXME handle currency_format
        balance_dec = Decimal(json_["balance"]) / 1000
        balances.append({
            "category": json_["name"],
            "balance": json_["balance"],
            "balance_str": "{}${}".format("-" if balance_dec < 0 else "",
                                          abs(balance_dec)),
        })
    return flask.jsonify({
        "balances": balances,
    })
