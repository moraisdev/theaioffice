from __future__ import annotations

from dataclasses import dataclass


@dataclass
class AnonymousUser:
    id: str
    username: str


class Users:
    def __init__(self) -> None:
        self._users: dict[str, AnonymousUser] = {}

    def add_user(self, uid: str, user: AnonymousUser) -> None:
        self._users[uid] = user

    def get_user(self, uid: str) -> AnonymousUser | None:
        return self._users.get(uid)

    def remove_user(self, uid: str) -> None:
        self._users.pop(uid, None)


users = Users()
