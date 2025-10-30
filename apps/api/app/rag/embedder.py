from __future__ import annotations
import warnings
from typing import Optional, Dict
from langchain_core.embeddings import Embeddings
from langchain_huggingface import HuggingFaceEmbeddings
from app.core.config import settings


_EMBED_CACHE: Dict[str, Embeddings] = {}

def get_embeddings(model: Optional[str] = None) -> Embeddings:
    """
    Get embeddings model (cached singleton).
    Supports HuggingFace local models.
    For LangChain v1, using langchain-huggingface package.
    """
    name = model or settings.EMBED_MODEL
    if name in _EMBED_CACHE:
        return _EMBED_CACHE[name]

    # Prepare model_kwargs for device configuration
    model_kwargs = {}
    device = settings.EMBED_DEVICE
    
    if device:
        if device == "cuda":
            try:
                import torch
                if not torch.cuda.is_available():
                    warnings.warn("No CUDA detected! Falling back to CPU.")
                    model_kwargs["device"] = "cpu"
                else:
                    model_kwargs["device"] = "cuda"
            except ImportError:
                warnings.warn("PyTorch not installed! Falling back to CPU.")
                model_kwargs["device"] = "cpu"
            except Exception:
                warnings.warn(f"Unable to test CUDA! Using device={device} as configured.")
                model_kwargs["device"] = device
        else:
            model_kwargs["device"] = device

    # Create HuggingFace embeddings
    # For multilingual-e5-small: dimension=384, supports 100+ languages
    emb = HuggingFaceEmbeddings(
        model_name=name,
        encode_kwargs={
            "normalize_embeddings": settings.EMBED_NORMALIZE,
            "batch_size": settings.EMBED_BATCH,
        },
        model_kwargs=model_kwargs or None,
    )

    _EMBED_CACHE[name] = emb
    return emb
