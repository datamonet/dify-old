import os

import dotenv
from flask_sqlalchemy import SQLAlchemy
from pymongo import MongoClient

dotenv.load_dotenv()

client = MongoClient(os.getenv("MONGODB_URI"))
mongodb = client.get_database(os.getenv("MONGODB_NAME"))
collection = mongodb["users"]

db = SQLAlchemy()


def init_app(app):
    db.init_app(app)

