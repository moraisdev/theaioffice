from __future__ import annotations

import socketio

from app.session import session_manager

# Set via set_sio() from main.py to avoid circular imports
_sio: socketio.AsyncServer | None = None


def set_sio(sio: socketio.AsyncServer) -> None:
    global _sio
    _sio = sio


async def kick_player(uid: str, reason: str) -> None:
    sio = _sio
    assert sio is not None, "Socket.IO server not initialized"

    session = session_manager.get_player_session(uid)
    if not session:
        return

    room_index = session.get_player_room(uid)
    players = session.get_players_in_room(room_index)

    for player in players:
        if player.uid == uid:
            await sio.emit("kicked", reason, to=player.socket_id)
        else:
            await sio.emit("playerLeftRoom", uid, to=player.socket_id)

    player = session.get_player(uid)
    await sio.leave_room(player.socket_id, session.id)
    session_manager.log_out_player(uid)
