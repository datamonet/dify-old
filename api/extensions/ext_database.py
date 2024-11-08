import os

import dotenv
from flask_sqlalchemy import SQLAlchemy
from pymongo import MongoClient
from sqlalchemy import MetaData

dotenv.load_dotenv()

def create_mongo_client():
    """ 创建并返回 MongoDB 客户端 """
    client = MongoClient(os.getenv("MONGODB_URI"),connect=False)
    return client

def get_users_collection():
    """ 获取用户集合 """
    client = create_mongo_client()  # 每次调用都创建新的 MongoClient 实例
    mongodb = client.get_database(os.getenv("MONGODB_NAME"))
    return mongodb["users"]

collection = get_users_collection()

POSTGRES_INDEXES_NAMING_CONVENTION = {
    "ix": "%(column_0_label)s_idx",
    "uq": "%(table_name)s_%(column_0_name)s_key",
    "ck": "%(table_name)s_%(constraint_name)s_check",
    "fk": "%(table_name)s_%(column_0_name)s_fkey",
    "pk": "%(table_name)s_pkey",
}

metadata = MetaData(naming_convention=POSTGRES_INDEXES_NAMING_CONVENTION)
db = SQLAlchemy(metadata=metadata)


def init_app(app):
    db.init_app(app)
