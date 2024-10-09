from flask import Blueprint

from libs.external_api import ExternalApi

bp = Blueprint("files", __name__)
api = ExternalApi(bp)


from . import image_preview as image_preview
from . import tool_files as tool_files
