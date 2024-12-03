from flask import Blueprint

from libs.external_api import ExternalApi

from .app.app_import import AppImportApi, AppImportConfirmApi
from .files import FileApi, FilePreviewApi, FileSupportTypeApi
from .remote_files import RemoteFileInfoApi, RemoteFileUploadApi

bp = Blueprint("console", __name__, url_prefix="/console/api")
api = ExternalApi(bp)

# File
api.add_resource(FileApi, "/files/upload")
api.add_resource(FilePreviewApi, "/files/<uuid:file_id>/preview")
api.add_resource(FileSupportTypeApi, "/files/support-type")

# Remote files
api.add_resource(RemoteFileInfoApi, "/remote-files/<path:url>")
api.add_resource(RemoteFileUploadApi, "/remote-files/upload")

# Import App
api.add_resource(AppImportApi, "/apps/imports")
api.add_resource(AppImportConfirmApi, "/apps/imports/<string:import_id>/confirm")

# Import other controllers
from . import admin as admin
from . import apikey as apikey
from . import extension as extension
from . import feature as feature
from . import ping as ping
from . import setup as setup
from . import version as version

# Import app controllers
from .app import (
    advanced_prompt_template as advanced_prompt_template,
)
from .app import (
    agent as agent,
)
from .app import (
    annotation as annotation,
)
from .app import (
    app as app,
)
from .app import (
    audio,
    completion,
    conversation,
    message,
    workflow,
)
from .app import (
    conversation_variables as conversation_variables,
)
from .app import (
    generator as generator,
)
from .app import (
    model_config as model_config,
)
from .app import (
    ops_trace as ops_trace,
)
from .app import (
    site as site,
)
from .app import (
    statistic as statistic,
)
from .app import (
    workflow_app_log as workflow_app_log,
)
from .app import (
    workflow_run as workflow_run,
)
from .app import (
    workflow_statistic as workflow_statistic,
)

# Import auth controllers
from .auth import (
    activate as activate,
)
from .auth import (
    data_source_bearer_auth as data_source_bearer_auth,
)
from .auth import (
    data_source_oauth as data_source_oauth,
)
from .auth import (
    forgot_password as forgot_password,
)
from .auth import (
    login as login,
)
from .auth import (
    oauth as oauth,
)

# Import billing controllers
from .billing import billing as billing

# Import datasets controllers
from .datasets import (
    data_source as data_source,
)
from .datasets import (
    datasets as datasets,
)
from .datasets import (
    datasets_document as datasets_document,
)
from .datasets import (
    datasets_segments as datasets_segments,
)
from .datasets import (
    external as external,
)
from .datasets import (
    file as file,
)
from .datasets import (
    hit_testing as hit_testing,
)
from .datasets import (
    website as website,
)

# Import explore controllers
from .explore import (
    audio as audio,
)
from .explore import (
    completion as completion,
)
from .explore import (
    conversation as conversation,
)
from .explore import (
    installed_app as installed_app,
)
from .explore import (
    message as message,
)
from .explore import (
    parameter as parameter,
)
from .explore import (
    recommended_app as recommended_app,
)
from .explore import (
    saved_message as saved_message,
)
from .explore import (
    workflow as workflow,
)

# Import tag controllers
from .tag import tags as tags

# Import workspace controllers
from .workspace import (
    account as account,
)
from .workspace import (
    load_balancing_config as load_balancing_config,
)
from .workspace import (
    members as members,
)
from .workspace import (
    model_providers as model_providers,
)
from .workspace import (
    models as models,
)
from .workspace import (
    tool_providers as tool_providers,
)
from .workspace import (
    workspace as workspace,
)
