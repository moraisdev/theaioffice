from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class CreateRealmBody(BaseModel):
    owner_id: str
    name: str
    map_data: Any | None = None


class UpdateRealmBody(BaseModel):
    map_data: Any | None = None
    only_owner: bool | None = None
    name: str | None = None
    share_id: str | None = None
