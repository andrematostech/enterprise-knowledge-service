from openai import OpenAI

from app.core.config import Settings


class OpenAIService:
    def __init__(self, settings: Settings) -> None:
        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is not set")
        self._client = OpenAI(api_key=settings.openai_api_key)
        self._embed_model = settings.openai_embed_model
        self._gen_model = settings.openai_gen_model

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        response = self._client.embeddings.create(model=self._embed_model, input=texts)
        return [item.embedding for item in response.data]

    def generate_answer(self, system_prompt: str, user_prompt: str) -> tuple[str, dict | None]:
        if not self._gen_model:
            raise ValueError("OPENAI_GEN_MODEL is not set")
        response = self._client.chat.completions.create(
            model=self._gen_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
        )
        content = response.choices[0].message.content or ""
        usage = None
        if response.usage:
            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            }
        return content.strip(), usage
