from __future__ import annotations

import re

import socketio

from app.database import get_pool
from app.models.game import JoinRealmData, MovePlayerData, TeleportData
from app.services.users import AnonymousUser, users
from app.session import session_manager
from app.sockets.helpers import kick_player

_joining_in_progress: set[str] = set()


def _remove_extra_spaces(text: str) -> str:
    value = re.sub(r"\s\s+", " ", text)
    if value.startswith(" "):
        value = value[1:]
    return value.strip()


def _emit_to_room(sio: socketio.AsyncServer, session, uid: str, event: str, data):
    """Build a list of coroutines that emit to all players in the same game-room except uid."""
    room_index = session.get_player_room(uid)
    players = session.get_players_in_room(room_index)
    coros = []
    for player in players:
        if player.socket_id != _get_sid_for_uid(session, uid):
            coros.append(sio.emit(event, data, to=player.socket_id))
    return coros


def _get_sid_for_uid(session, uid: str) -> str | None:
    player = session.players.get(uid)
    return player.socket_id if player else None


async def _emit_to_room_await(sio: socketio.AsyncServer, session, uid: str, event: str, data):
    """Emit event to all players in the same game-room except the player with uid."""
    room_index = session.get_player_room(uid)
    players = session.get_players_in_room(room_index)
    sid = _get_sid_for_uid(session, uid)
    for player in players:
        if player.socket_id != sid:
            await sio.emit(event, data, to=player.socket_id)


def register_handlers(sio: socketio.AsyncServer) -> None:

    @sio.event
    async def connect(sid, environ, auth):
        """Validate connection: extract uid and username from query string."""
        from urllib.parse import parse_qs

        query_string = environ.get("QUERY_STRING", "") or environ.get("asgi.scope", {}).get("query_string", b"").decode()
        # python-socketio may also put it in scope
        if not query_string:
            scope = environ.get("asgi.scope", {})
            qs = scope.get("query_string", b"")
            if isinstance(qs, bytes):
                query_string = qs.decode()

        params = parse_qs(query_string)
        uid = params.get("uid", [None])[0]
        username = params.get("username", [None])[0]

        if not uid or not username:
            raise socketio.exceptions.ConnectionRefusedError("uid and username are required.")

        # Store uid/username in session
        await sio.save_session(sid, {"uid": uid, "username": username})

        # Upsert profile
        pool = get_pool()
        try:
            await pool.execute(
                "INSERT INTO profiles (id, username) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET username = $2",
                uid, username,
            )
        except Exception:
            pass  # Profile upsert failed, but we can still proceed

        users.add_user(uid, AnonymousUser(id=uid, username=username))

    @sio.event
    async def joinRealm(sid, data):
        session_data = await sio.get_session(sid)
        uid = session_data["uid"]

        async def reject_join(reason: str):
            await sio.emit("failedToJoinRoom", reason, to=sid)
            _joining_in_progress.discard(uid)

        # Validate data
        try:
            realm_data = JoinRealmData(**data) if isinstance(data, dict) else None
        except Exception:
            realm_data = None

        if not realm_data:
            await reject_join("Invalid request data.")
            return

        if uid in _joining_in_progress:
            await reject_join("Already joining a space.")
            return

        _joining_in_progress.add(uid)

        session = session_manager.get_session(realm_data.realmId)
        if session:
            if session.get_player_count() >= 30:
                await reject_join("Space is full. It's 30 players max.")
                return

        pool = get_pool()
        try:
            row = await pool.fetchrow(
                "SELECT owner_id, share_id, map_data, only_owner FROM realms WHERE id = $1::uuid",
                realm_data.realmId,
            )

            if not row:
                await reject_join("Space not found.")
                return

            realm = dict(row)

            profile_row = await pool.fetchrow(
                "SELECT skin FROM profiles WHERE id = $1",
                uid,
            )
            skin = profile_row["skin"] if profile_row else "009"

            async def join():
                if not session_manager.get_session(realm_data.realmId):
                    session_manager.create_session(realm_data.realmId, realm["map_data"])

                current_session = session_manager.get_player_session(uid)
                if current_session:
                    await kick_player(uid, "You have logged in from another location.")

                user = users.get_user(uid)
                if not user:
                    await reject_join("User not found.")
                    return

                session_manager.add_player_to_session(sid, realm_data.realmId, uid, user.username, skin)
                new_session = session_manager.get_player_session(uid)
                player = new_session.get_player(uid)

                await sio.enter_room(sid, realm_data.realmId)
                await sio.emit("joinedRealm", to=sid)
                await _emit_to_room_await(sio, new_session, uid, "playerJoinedRoom", player.to_dict())
                _joining_in_progress.discard(uid)

            owner_id = str(realm["owner_id"])
            if owner_id == uid:
                await join()
                return

            if realm["only_owner"]:
                await reject_join("This realm is private right now. Come back later!")
                return

            if str(realm["share_id"]) == realm_data.shareId:
                await join()
                return
            else:
                await reject_join("The share link has been changed.")
                return

        except Exception:
            await reject_join("Server error.")
            return

    @sio.event
    async def disconnect(sid):
        session_data = await sio.get_session(sid)
        uid = session_data.get("uid") if session_data else None
        if not uid:
            return

        session = session_manager.get_player_session(uid)
        if not session:
            return

        socket_ids = session_manager.get_socket_ids_in_room(session.id, session.get_player_room(uid))
        success = session_manager.log_out_by_socket_id(sid)
        if success:
            for socket_id in socket_ids:
                if socket_id != sid:
                    await sio.emit("playerLeftRoom", uid, to=socket_id)
            users.remove_user(uid)

    @sio.event
    async def movePlayer(sid, data):
        session_data = await sio.get_session(sid)
        uid = session_data.get("uid") if session_data else None
        if not uid:
            return

        session = session_manager.get_player_session(uid)
        if not session:
            return

        try:
            move_data = MovePlayerData(**data) if isinstance(data, dict) else None
        except Exception:
            return
        if not move_data:
            return

        player = session.get_player(uid)
        session.move_player(player.uid, move_data.x, move_data.y)

        await _emit_to_room_await(sio, session, uid, "playerMoved", {
            "uid": player.uid,
            "x": player.x,
            "y": player.y,
        })

    @sio.event
    async def teleport(sid, data):
        session_data = await sio.get_session(sid)
        uid = session_data.get("uid") if session_data else None
        if not uid:
            return

        session = session_manager.get_player_session(uid)
        if not session:
            return

        try:
            tp_data = TeleportData(**data) if isinstance(data, dict) else None
        except Exception:
            return
        if not tp_data:
            return

        player = session.get_player(uid)
        if player.room != tp_data.roomIndex:
            # Leaving current room - notify current room players
            await _emit_to_room_await(sio, session, uid, "playerLeftRoom", uid)
            # Change room
            session.change_room(uid, tp_data.roomIndex, tp_data.x, tp_data.y)
            # Notify new room players
            await _emit_to_room_await(sio, session, uid, "playerJoinedRoom", player.to_dict())
        else:
            session.move_player(player.uid, tp_data.x, tp_data.y)
            await _emit_to_room_await(sio, session, uid, "playerTeleported", {
                "uid": uid,
                "x": player.x,
                "y": player.y,
            })

    @sio.event
    async def changedSkin(sid, data):
        session_data = await sio.get_session(sid)
        uid = session_data.get("uid") if session_data else None
        if not uid:
            return

        session = session_manager.get_player_session(uid)
        if not session:
            return

        if not isinstance(data, str):
            return

        player = session.get_player(uid)
        player.skin = data

        await _emit_to_room_await(sio, session, uid, "playerChangedSkin", {
            "uid": uid,
            "skin": player.skin,
        })

    @sio.event
    async def sendMessage(sid, data):
        session_data = await sio.get_session(sid)
        uid = session_data.get("uid") if session_data else None
        if not uid:
            return

        session = session_manager.get_player_session(uid)
        if not session:
            return

        if not isinstance(data, str):
            return

        if len(data) > 300 or data.strip() == "":
            return

        message = _remove_extra_spaces(data)

        await _emit_to_room_await(sio, session, uid, "receiveMessage", {
            "uid": uid,
            "message": message,
        })
