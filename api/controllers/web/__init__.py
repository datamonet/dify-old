from flask import Blueprint

from libs.external_api import ExternalApi

bp = Blueprint("web", __name__, url_prefix="/api")
api = ExternalApi(bp)


from . import (
    app as app,
)
from . import (
    audio as audio,
)
from . import (
    completion as completion,
)
from . import (
    conversation as conversation,
)
from . import (
    feature as feature,
)
from . import (
    file as file,
)
from . import (
    message as message,
)
from . import (
    passport as passport,
)
from . import (
    saved_message as saved_message,
)
from . import (
    site as site,
)
from . import (
    workflow as workflow,
)
