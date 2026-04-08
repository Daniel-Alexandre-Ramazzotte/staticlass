import re

_REGEX_EMAIL = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")


def email_valido(email: str) -> bool:
    return bool(_REGEX_EMAIL.match(email or ""))
