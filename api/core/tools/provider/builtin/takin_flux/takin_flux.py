from typing import Any

from core.tools.errors import ToolProviderCredentialValidationError
from core.tools.provider.builtin.takin_flux.tools.flux_dev import FluxDevTool
from core.tools.provider.builtin_tool_provider import BuiltinToolProviderController


class FLUXProvider(BuiltinToolProviderController):
    def _validate_credentials(self, credentials: dict[str, Any]) -> None:
        try:
            FluxDevTool().fork_tool_runtime(
                runtime={
                    "credentials": credentials,
                }
            ).invoke(
                user_id='',
                tool_parameters={
                    "prompt": "cute girl, blue eyes, white hair, anime style",
                },
            )
        except Exception as e:
            raise ToolProviderCredentialValidationError(str(e))
        