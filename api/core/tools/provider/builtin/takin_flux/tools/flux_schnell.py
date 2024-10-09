import random
from typing import Any, Union

import replicate

from core.tools.entities.tool_entities import ToolInvokeMessage
from core.tools.tool.builtin_tool import BuiltinTool


class FluxSchnellTool(BuiltinTool):
    def _invoke(
        self,
        user_id: str,
        tool_parameters: dict[str, Any],
    ) -> Union[ToolInvokeMessage, list[ToolInvokeMessage]]:
        """
        invoke tools
        """
        client = replicate.Client(
            api_token=self.runtime.credentials["replicate_api_key"]
        )

        # prompt
        prompt = tool_parameters.get("prompt", "")
        if not prompt:
            return self.create_text_message("Please input prompt")

        aspect_ratio = tool_parameters.get("size", "1:1")
        num_outputs = tool_parameters.get("num_outputs", 1)
        num_inference_steps = tool_parameters.get("steps", 50)
        seed = int(tool_parameters.get("seed", 50))

        response = client.run(
            "black-forest-labs/flux-schnell",
            input={
                "prompt": prompt,
                "aspect_ratio": aspect_ratio,
                "num_outputs": num_outputs,
                "num_inference_steps": num_inference_steps,
                "seed": random.randint(1, 100) if seed == 0 else seed,
                "output_format": "png",
                "num_inference_steps": 4
            },
        )

        result = []

        for image in response:
            result.append(self.create_image_message(image=image))
            result.append(
                self.create_json_message(
                    {
                        "url": image,
                    }
                )
            )
        return result
