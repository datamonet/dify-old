from flask import Blueprint

from libs.external_api import ExternalApi

bp = Blueprint("service_api", __name__, url_prefix="/v1")
api = ExternalApi(bp)


from . import index as index
from .app import app as app
from .app import audio as audio
from .app import completion as completion
from .app import conversation as conversation
from .app import file as file
from .app import message as message
from .app import workflow as workflow
from .dataset import dataset as dataset
from .dataset import document as document
from .dataset import segment as segment
