from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, TypedDict


class SpawnPoint(TypedDict):
    roomIndex: int
    x: int
    y: int


class RealmData(TypedDict):
    spawnpoint: SpawnPoint
    rooms: list[dict[str, Any]]


DEFAULT_SKIN = "009"


@dataclass
class Player:
    uid: str
    username: str
    x: int
    y: int
    room: int
    socket_id: str
    skin: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "uid": self.uid,
            "username": self.username,
            "x": self.x,
            "y": self.y,
            "room": self.room,
            "socketId": self.socket_id,
            "skin": self.skin,
        }


class Session:
    def __init__(self, id: str, map_data: RealmData) -> None:
        self.id = id
        self.map_data = map_data
        self.players: dict[str, Player] = {}
        # roomIndex -> set of uids
        self._player_rooms: dict[int, set[str]] = {}
        # roomIndex -> "x, y" -> set of uids
        self._player_positions: dict[int, dict[str, set[str]]] = {}

        for i in range(len(map_data["rooms"])):
            self._player_rooms[i] = set()
            self._player_positions[i] = {}

    def add_player(self, socket_id: str, uid: str, username: str, skin: str) -> None:
        self.remove_player(uid)

        spawn = self.map_data["spawnpoint"]
        spawn_index = spawn["roomIndex"]
        spawn_x = spawn["x"]
        spawn_y = spawn["y"]

        player = Player(
            uid=uid,
            username=username,
            x=spawn_x,
            y=spawn_y,
            room=spawn_index,
            socket_id=socket_id,
            skin=skin,
        )

        self._player_rooms[spawn_index].add(uid)
        coord_key = f"{spawn_x}, {spawn_y}"
        if coord_key not in self._player_positions[spawn_index]:
            self._player_positions[spawn_index][coord_key] = set()
        self._player_positions[spawn_index][coord_key].add(uid)
        self.players[uid] = player

    def remove_player(self, uid: str) -> None:
        if uid not in self.players:
            return

        player = self.players[uid]
        self._player_rooms[player.room].discard(uid)

        coord_key = f"{player.x}, {player.y}"
        if coord_key in self._player_positions[player.room]:
            self._player_positions[player.room][coord_key].discard(uid)

        del self.players[uid]

    def change_room(self, uid: str, room_index: int, x: int, y: int) -> None:
        if uid not in self.players:
            return

        player = self.players[uid]

        self._player_rooms[player.room].discard(uid)
        self._player_rooms[room_index].add(uid)

        coord_key = f"{player.x}, {player.y}"
        if coord_key in self._player_positions[player.room]:
            self._player_positions[player.room][coord_key].discard(uid)

        player.room = room_index
        self.move_player(uid, x, y)

    def get_players_in_room(self, room_index: int) -> list[Player]:
        uids = self._player_rooms.get(room_index, set())
        return [self.players[uid] for uid in uids if uid in self.players]

    def get_player_count(self) -> int:
        return len(self.players)

    def get_player(self, uid: str) -> Player:
        return self.players[uid]

    def get_player_ids(self) -> list[str]:
        return list(self.players.keys())

    def get_player_room(self, uid: str) -> int:
        return self.players[uid].room

    def move_player(self, uid: str, x: int, y: int) -> None:
        player = self.players[uid]
        old_coord_key = f"{player.x}, {player.y}"
        if old_coord_key in self._player_positions[player.room]:
            self._player_positions[player.room][old_coord_key].discard(uid)

        player.x = x
        player.y = y

        coord_key = f"{x}, {y}"
        if coord_key not in self._player_positions[player.room]:
            self._player_positions[player.room][coord_key] = set()
        self._player_positions[player.room][coord_key].add(uid)
