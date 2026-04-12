from __future__ import annotations

from collections.abc import Mapping
from decimal import Decimal
from numbers import Integral, Real
from typing import Any

from ..repositories.student_analytics_repository import (
    get_student_activity_days,
    get_student_dashboard,
)


def _json_safe(value: Any) -> Any:
    if isinstance(value, bool) or value is None:
        return value
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)
    if isinstance(value, Integral):
        return int(value)
    if isinstance(value, Real):
        return float(value)
    if isinstance(value, Mapping):
        return {key: _json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    if isinstance(value, tuple):
        return [_json_safe(item) for item in value]
    return value


def student_dashboard_service(student_id: int) -> dict[str, Any]:
    return _json_safe(get_student_dashboard(int(student_id)))


def student_activity_service(student_id: int) -> dict[str, list[str]]:
    return {"days": _json_safe(get_student_activity_days(int(student_id)))}
