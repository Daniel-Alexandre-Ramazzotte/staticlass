import os


def _optional_int(name: str):
    value = os.getenv(name)
    if value in (None, ""):
        return None
    return int(value)


def _optional_bool(name: str):
    value = os.getenv(name)
    if value in (None, ""):
        return None
    return value.strip().lower() in {"1", "true", "yes", "on"}


class Config:
    APP_BASE_URL = os.getenv("APP_BASE_URL") or None
    MAIL_SERVER = os.getenv("MAIL_SERVER") or None
    MAIL_PORT = _optional_int("MAIL_PORT")
    MAIL_USE_TLS = _optional_bool("MAIL_USE_TLS")
    MAIL_USE_SSL = False
    MAIL_USERNAME = os.getenv("MAIL_USERNAME") or None
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD") or None
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER") or None
