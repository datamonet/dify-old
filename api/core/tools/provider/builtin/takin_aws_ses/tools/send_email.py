from typing import Any, Union

import boto3

from core.tools.entities.tool_entities import ToolInvokeMessage
from core.tools.tool.builtin_tool import BuiltinTool


class SendEmailTool(BuiltinTool):
    def _invoke(self,
                user_id: str,
                tool_parameters: dict[str, Any],
                ) -> Union[ToolInvokeMessage, list[ToolInvokeMessage]]:
        """
            invoke tools
        """
        client = boto3.client(
            'ses',
            aws_access_key_id=self.runtime.credentials['access_key'],
            aws_secret_access_key=self.runtime.credentials['secret_access_key'],
            region_name=self.runtime.credentials['region_name']
        )
        # prompt
        to_email = tool_parameters.get('to_email', '')
        subject = tool_parameters.get('subject', '')
        content = tool_parameters.get('content', '')

        if not to_email:
            return self.create_text_message('Please input email')
        if not subject:
            return self.create_text_message('Please input subject')
        if not content:
            return self.create_text_message('Please input content')
        # 先用英文逗号分割
        emails = to_email.split(',')

        # 然后对每个部分使用中文逗号分割，并将结果扁平化
        emails = [email.strip() for part in emails for email in part.split('，')]
        response = client.send_email(
            Source="Takin.AI <norely@takin.ai>",
            Destination={
                'ToAddresses': emails
            },
            Message={
                'Subject': {
                    'Data': subject
                },
                'Body': {
                    'Text': {
                        'Data': content
                    }
                }
            }
        )
        result = []

        result.append(self.create_json_message({
            "response": response,
            "count": len(emails)

        }))
        return result
        # return
