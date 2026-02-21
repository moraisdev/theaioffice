from __future__ import annotations

from typing import TYPE_CHECKING, Callable

from app.session.session import RealmData, Session

if TYPE_CHECKING:
    pass


class SessionManager:
    def __init__(self) -> None:
        self._sessions: dict[str, Session] = {}
        self._player_id_to_realm_id: dict[str, str] = {}
        self._socket_id_to_player_id: dict[str, str] = {}
        self._kick_fn: Callable[[str, str], None] | None = None

    def set_kick_fn(self, fn: Callable[[str, str], None]) -> None:
        """Inject kick_player to avoid circular imports."""
        self._kick_fn = fn

    def create_session(self, id: str, map_data: RealmData) -> None:
        self._sessions[id] = Session(id, map_data)

    def get_session(self, id: str) -> Session | None:
        return self._sessions.get(id)

    def get_player_session(self, uid: str) -> Session | None:
        realm_id = self._player_id_to_realm_id.get(uid)
        if realm_id is None:
            return None
        return self._sessions.get(realm_id)

    def add_player_to_session(
        self,
        socket_id: str,
        realm_id: str,
        uid: str,
        username: str,
        skin: str,
    ) -> None:
        self._sessions[realm_id].add_player(socket_id, uid, username, skin)
        self._player_id_to_realm_id[uid] = realm_id
        self._socket_id_to_player_id[socket_id] = uid

    def log_out_player(self, uid: str) -> None:
        realm_id = self._player_id_to_realm_id.get(uid)
        if not realm_id:
            return

        session = self._sessions.get(realm_id)
        if not session:
            return

        player = session.get_player(uid)
        if player:
            self._socket_id_to_player_id.pop(player.socket_id, None)

        self._player_id_to_realm_id.pop(uid, None)
        session.remove_player(uid)

    def get_socket_ids_in_room(self, realm_id: str, room_index: int) -> list[str]:
        session = self._sessions.get(realm_id)
        if not session:
            return []
        return [p.socket_id for p in session.get_players_in_room(room_index)]

    def log_out_by_socket_id(self, socket_id: str) -> bool:
        uid = self._socket_id_to_player_id.get(socket_id)
        if not uid:
            return False
        self.log_out_player(uid)
        return True

    def terminate_session(self, id: str, reason: str) -> None:
        session = self._sessions.get(id)
        if not session:
            return

        player_ids = session.get_player_ids()
        for uid in player_ids:
            if self._kick_fn:
                self._kick_fn(uid, reason)

        self._sessions.pop(id, None)


session_manager = SessionManager()
