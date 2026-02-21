from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.database import get_pool, record_to_dict
from app.session import session_manager

router = APIRouter(prefix="/api/realms")


@router.post("")
async def create_realm(request: Request) -> JSONResponse:
    body = await request.json()
    owner_id = body.get("owner_id")
    name = body.get("name")
    map_data = body.get("map_data")

    if not owner_id or not name:
        return JSONResponse({"message": "owner_id and name are required"}, status_code=400)

    pool = get_pool()
    try:
        if map_data is not None:
            row = await pool.fetchrow(
                "INSERT INTO realms (owner_id, name, map_data) VALUES ($1, $2, $3) RETURNING *",
                owner_id, name, map_data,
            )
        else:
            row = await pool.fetchrow(
                "INSERT INTO realms (owner_id, name) VALUES ($1, $2) RETURNING *",
                owner_id, name,
            )
        return JSONResponse(record_to_dict(row))
    except Exception as e:
        return JSONResponse({"message": str(e)}, status_code=500)


@router.get("")
async def get_realms(ownerId: Optional[str] = None) -> JSONResponse:
    if not ownerId:
        return JSONResponse({"message": "ownerId is required"}, status_code=400)

    pool = get_pool()
    try:
        rows = await pool.fetch(
            "SELECT id, name, share_id FROM realms WHERE owner_id = $1",
            ownerId,
        )
        return JSONResponse([record_to_dict(r) for r in rows])
    except Exception as e:
        return JSONResponse({"message": str(e)}, status_code=500)


@router.get("/by-share/{share_id}")
async def get_realm_by_share(share_id: str) -> JSONResponse:
    pool = get_pool()
    try:
        row = await pool.fetchrow(
            "SELECT id, name, map_data, owner_id, only_owner FROM realms WHERE share_id = $1::uuid",
            share_id,
        )
        if not row:
            return JSONResponse({"message": "Realm not found"}, status_code=404)
        return JSONResponse(record_to_dict(row))
    except Exception as e:
        return JSONResponse({"message": str(e)}, status_code=500)


@router.get("/{realm_id}")
async def get_realm(realm_id: str) -> JSONResponse:
    pool = get_pool()
    try:
        row = await pool.fetchrow(
            "SELECT id, name, owner_id, map_data, share_id, only_owner FROM realms WHERE id = $1::uuid",
            realm_id,
        )
        if not row:
            return JSONResponse({"message": "Realm not found"}, status_code=404)
        return JSONResponse(record_to_dict(row))
    except Exception as e:
        return JSONResponse({"message": str(e)}, status_code=500)


@router.put("/{realm_id}")
async def update_realm(realm_id: str, request: Request) -> JSONResponse:
    body = await request.json()
    map_data = body.get("map_data")
    only_owner = body.get("only_owner")
    name = body.get("name")
    share_id = body.get("share_id")

    set_clauses = []
    values = []
    param_index = 1

    if map_data is not None:
        set_clauses.append(f"map_data = ${param_index}")
        values.append(map_data)
        param_index += 1
    if only_owner is not None:
        set_clauses.append(f"only_owner = ${param_index}")
        values.append(only_owner)
        param_index += 1
    if name is not None:
        set_clauses.append(f"name = ${param_index}")
        values.append(name)
        param_index += 1
    if share_id is not None:
        set_clauses.append(f"share_id = ${param_index}::uuid")
        values.append(share_id)
        param_index += 1

    if not set_clauses:
        return JSONResponse({"message": "No fields to update"}, status_code=400)

    values.append(realm_id)

    pool = get_pool()
    try:
        old_row = await pool.fetchrow(
            "SELECT map_data, share_id, only_owner FROM realms WHERE id = $1::uuid",
            realm_id,
        )
        row = await pool.fetchrow(
            f"UPDATE realms SET {', '.join(set_clauses)} WHERE id = ${param_index}::uuid RETURNING *",
            *values,
        )
        if not row:
            return JSONResponse({"message": "Realm not found"}, status_code=404)

        result = record_to_dict(row)

        # Terminate session if relevant fields changed
        if old_row:
            old = dict(old_row)
            should_terminate = False
            if map_data is not None and json.dumps(old["map_data"], sort_keys=True) != json.dumps(result["map_data"], sort_keys=True):
                should_terminate = True
            if share_id is not None and str(old["share_id"]) != str(result["share_id"]):
                should_terminate = True
            if only_owner is not None and result["only_owner"]:
                should_terminate = True
            if should_terminate:
                session_manager.terminate_session(realm_id, "This realm has been changed by the owner.")

        return JSONResponse(result)
    except Exception as e:
        return JSONResponse({"message": str(e)}, status_code=500)


@router.delete("/{realm_id}")
async def delete_realm(realm_id: str) -> JSONResponse:
    pool = get_pool()
    try:
        row = await pool.fetchrow(
            "DELETE FROM realms WHERE id = $1::uuid RETURNING id",
            realm_id,
        )
        if not row:
            return JSONResponse({"message": "Realm not found"}, status_code=404)

        session_manager.terminate_session(realm_id, "This realm is no longer available.")
        return JSONResponse({"success": True})
    except Exception as e:
        return JSONResponse({"message": str(e)}, status_code=500)
