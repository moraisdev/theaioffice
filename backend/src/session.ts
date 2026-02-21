import { z } from 'zod'
import { kickPlayer } from './sockets/helpers'

export type RealmData = {
    spawnpoint: {
        roomIndex: number,
        x: number,
        y: number,
    },
    rooms: Room[],
}

export interface Room {
    name: string,
    tilemap: {
        [key: `${number}, ${number}`]: {
            floor?: string,
            above_floor?: string,
            object?: string,
            impassable?: boolean
            teleporter?: {
                roomIndex: number,
                x: number,
                y: number,
            }
        }
    }
}

export interface Player {
    uid: string,
    username: string,
    x: number,
    y: number,
    room: number,
    socketId: string,
    skin: string,
}

export const defaultSkin = '009'

export const Spawnpoint = z.object({
    roomIndex: z.number(),
    x: z.number(),
    y: z.number(),
})

export type RoomData = { [key: number]: Player[] }

export class SessionManager {
    private sessions: { [key: string]: Session } = {}
    private playerIdToRealmId: { [key: string]: string } = {}
    private socketIdToPlayerId: { [key: string]: string } = {}

    public createSession(id: string, mapData: RealmData): void {
        const realm = new Session(id, mapData)

        this.sessions[id] = realm
    }

    public getSession(id: string): Session {
        return this.sessions[id]
    }

    public getPlayerSession(uid: string): Session {
        const realmId = this.playerIdToRealmId[uid]
        return this.sessions[realmId]
    }

    public addPlayerToSession(socketId: string, realmId: string, uid: string, username: string, skin: string) {
        this.sessions[realmId].addPlayer(socketId, uid, username, skin)
        this.playerIdToRealmId[uid] = realmId
        this.socketIdToPlayerId[socketId] = uid
    }

    public logOutPlayer(uid: string) {
        const realmId = this.playerIdToRealmId[uid]
        // If the player is not in a realm, do nothing
        if (!realmId) return

        const player = this.sessions[realmId].getPlayer(uid)
        delete this.socketIdToPlayerId[player.socketId]
        delete this.playerIdToRealmId[uid]
        this.sessions[realmId].removePlayer(uid)
    }

    public getSocketIdsInRoom(realmId: string, roomIndex: number): string[] {
        return this.sessions[realmId].getPlayersInRoom(roomIndex).map(player => player.socketId)
    }

    public logOutBySocketId(socketId: string) {
        const uid = this.socketIdToPlayerId[socketId]
        if (!uid) return false

        this.logOutPlayer(uid)
        return true
    }

    public terminateSession(id: string, reason: string) {
        const session = this.sessions[id]
        if (!session) return

        const players = session.getPlayerIds()
        players.forEach(player => {
            kickPlayer(player, reason)
        })

        delete this.sessions[id]
    }
}

export class Session {
    private playerRooms: { [key: number]: Set<string> } = {}

    // roomIndex -> position -> uid
    private playerPositions: { [key: number]: { [key: string]: Set<string> } } = {}

    public players: { [key: string]: Player } = {}
    public id: string
    public map_data: RealmData 

    constructor(id: string, mapData: RealmData) {
        this.id = id
        this.map_data = mapData 

        for (let i = 0; i < mapData.rooms.length; i++) {
            this.playerRooms[i] = new Set<string>()
            this.playerPositions[i] = {}
        }
    }

    public addPlayer(socketId: string, uid: string, username: string, skin: string) {
        this.removePlayer(uid)
        const spawnIndex = this.map_data.spawnpoint.roomIndex
        const spawnX = this.map_data.spawnpoint.x
        const spawnY = this.map_data.spawnpoint.y

        const player: Player = {
            uid,
            username,
            x: spawnX,
            y: spawnY,
            room: spawnIndex,
            socketId: socketId,
            skin,
        }

        this.playerRooms[spawnIndex].add(uid)
        const coordKey = `${spawnX}, ${spawnY}`
        if (!this.playerPositions[spawnIndex][coordKey]) {
            this.playerPositions[spawnIndex][coordKey] = new Set<string>()
        }
        this.playerPositions[spawnIndex][coordKey].add(uid)
        this.players[uid] = player
    }

    public removePlayer(uid: string): void {
        if (!this.players[uid]) return

        const player = this.players[uid]
        this.playerRooms[player.room].delete(uid)

        const coordKey = `${player.x}, ${player.y}`
        delete this.playerPositions[player.room][coordKey]

        delete this.players[uid]
    }

    public changeRoom(uid: string, roomIndex: number, x: number, y: number): void {
        if (!this.players[uid]) return

        const player = this.players[uid]

        this.playerRooms[player.room].delete(uid)
        this.playerRooms[roomIndex].add(uid)

        const coordKey = `${player.x}, ${player.y}`
        if (this.playerPositions[player.room][coordKey]) {
            this.playerPositions[player.room][coordKey].delete(uid)
        }

        player.room = roomIndex
        this.movePlayer(uid, x, y)
    }

    public getPlayersInRoom(roomIndex: number): Player[] {
        const players = Array.from(this.playerRooms[roomIndex] || [])
            .map(uid => this.players[uid])

        return players
    }

    public getPlayerCount() {
        return Object.keys(this.players).length
    }

    public getPlayer(uid: string): Player {
        return this.players[uid]
    }

    public getPlayerIds(): string[] {
        return Object.keys(this.players)
    }

    public getPlayerRoom(uid: string): number {
        return this.players[uid].room
    }

    public movePlayer(uid: string, x: number, y: number): void {
        const oldCoordKey = `${this.players[uid].x}, ${this.players[uid].y}`
        if (this.playerPositions[this.players[uid].room][oldCoordKey]) {
            this.playerPositions[this.players[uid].room][oldCoordKey].delete(uid)
        }

        this.players[uid].x = x
        this.players[uid].y = y

        const coordKey = `${x}, ${y}`
        if (!this.playerPositions[this.players[uid].room][coordKey]) {
            this.playerPositions[this.players[uid].room][coordKey] = new Set<string>()
        }

        this.playerPositions[this.players[uid].room][coordKey].add(uid)
    }
}

const sessionManager = new SessionManager()

export { sessionManager }
