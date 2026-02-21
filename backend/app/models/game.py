from pydantic import BaseModel


class JoinRealmData(BaseModel):
    realmId: str
    shareId: str


class MovePlayerData(BaseModel):
    x: int
    y: int


class TeleportData(BaseModel):
    x: int
    y: int
    roomIndex: int
