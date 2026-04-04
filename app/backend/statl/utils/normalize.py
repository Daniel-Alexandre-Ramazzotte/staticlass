"""
normalize.py — Normalização de texto de questões.

Converte numeração estilo lista `1)`, `2)`, `3)`... para `a)`, `b)`, `c)`...
quando aparecer como marcador de item (precedido por início de linha, espaço ou
parêntese de abertura, e seguido por espaço ou fim de linha).
"""
import re

_NUM_TO_LETTER = {'1': 'a', '2': 'b', '3': 'c', '4': 'd', '5': 'e'}

# Substitui N) quando N é dígito 1-5 não precedido de outro dígito
_PATTERN = re.compile(r'(?<!\d)([1-5])\)(?=\s|$)')


def normalize_numbering(text: str | None) -> str | None:
    """Troca 1) → a), 2) → b), ... 5) → e) em texto de questão/alternativa."""
    if not text:
        return text
    return _PATTERN.sub(lambda m: _NUM_TO_LETTER[m.group(1)] + ')', text)
