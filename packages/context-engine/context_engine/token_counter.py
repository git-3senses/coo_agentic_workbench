"""
Token Counter (Sprint 2 — S2-003)

Counts tokens using tiktoken for budget management.
Supports per-model tokenization and batch counting.

Blueprint Section 6 — Budget stage of the 7-stage pipeline.

Status: IMPLEMENTED
"""

from __future__ import annotations

import json
from typing import Any

import tiktoken

# Cache encodings to avoid repeated lookups
_encoder_cache: dict[str, tiktoken.Encoding] = {}


def _get_encoder(model: str) -> tiktoken.Encoding:
    """Get tiktoken encoding for the model, initializing via cache."""
    # Since AC says default is 'cl100k_base', handle direct encoding strings vs model names.
    if model not in _encoder_cache:
        try:
            # If the string is already an encoding name like 'cl100k_base'
            _encoder_cache[model] = tiktoken.get_encoding(model)
        except ValueError:
            # If it's a model name like 'gpt-4'
            _encoder_cache[model] = tiktoken.encoding_for_model(model)
    return _encoder_cache[model]


def reset_cache() -> None:
    """Clear the globally cached tiktoken encoders (used for testing)."""
    global _encoder_cache
    _encoder_cache.clear()


def count_tokens(text: str, model: str = "cl100k_base") -> int:
    """
    Count tokens in text using tiktoken for the given model/encoding.

    Args:
        text (str): The string to count tokens for.
        model (str, optional): The tiktoken encoding or model string. Defaults to "cl100k_base".

    Returns:
        int: The precise token count.
    """
    if not text:
        return 0
    enc = _get_encoder(model)
    return len(enc.encode(text))


def count_tokens_for_object(obj: Any, model: str = "cl100k_base") -> int:
    """
    Serialize an object to JSON and count its tokens.
    
    Args:
        obj (Any): The object to serialize and count.
        model (str, optional): The tiktoken encoding or model string. Defaults to "cl100k_base".

    Returns:
        int: The precise token count of the serialized object.
    """
    if obj is None:
        return 0
    obj_str = json.dumps(obj)
    return count_tokens(obj_str, model)


def estimate_tokens(char_count: int) -> int:
    """
    Fast estimation of tokens based purely on a given character count.

    Args:
        char_count (int): The length of characters in a document/string.

    Returns:
        int: Estimated token amount (assumes ~4 chars per token).
    """
    if char_count < 0:
        return 0
    return char_count // 4


def truncate_to_tokens(text: str, max_tokens: int, model: str = "cl100k_base") -> str:
    """
    Truncate a string down to fit within a specific max_tokens length.

    Args:
        text (str): The text to truncate.
        max_tokens (int): The absolute token limit.
        model (str, optional): The tiktoken encoding or model string. Defaults to "cl100k_base".

    Returns:
        str: Truncated text (decoded from tiktoken slice).
    """
    if not text:
        return ""
    if max_tokens <= 0:
        return ""
        
    enc = _get_encoder(model)
    tokens = enc.encode(text)
    
    if len(tokens) <= max_tokens:
        return text
        
    return enc.decode(tokens[:max_tokens])


def count_tokens_batch(items: list[str], model: str = "gpt-4") -> list[int]:
    """Count tokens for a list of text items."""
    return [count_tokens(item, model) for item in items]


def estimate_context_tokens(context_package: dict, model: str = "gpt-4") -> dict[str, int]:
    """Estimate token counts per slot in a context package."""
    result = {}
    for slot, data in context_package.items():
        if isinstance(data, str):
            result[slot] = count_tokens(data, model)
        else:
            result[slot] = count_tokens_for_object(data, model)
    return result


def get_model_limit(model: str = "gpt-4") -> int:
    """Return the token limit for a model."""
    limits = {
        "gpt-4": 8192,
        "gpt-4-turbo-preview": 128000,
        "cl100k_base": 128000
    }
    return limits.get(model, 8192)
