from typing import Any

from core.tools.errors import ToolProviderCredentialValidationError
from core.tools.provider.builtin.takin_aws_ses.tools.send_email import SendEmailTool
from core.tools.provider.builtin_tool_provider import BuiltinToolProviderController


class SendgridProvider(BuiltinToolProviderController):
    def _validate_credentials(self, credentials: dict[str, Any]) -> None:
        try:
            SendEmailTool().fork_tool_runtime(
                runtime={
                    "credentials": credentials,
                }
            ).invoke(
                user_id="",
                tool_parameters={
                    "subject": "Test",
                    "content": "This is a test email",
                },
            )
        except Exception as e:
            raise ToolProviderCredentialValidationError(str(e))
