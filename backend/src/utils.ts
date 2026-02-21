import { RealmData } from './session'

export function removeExtraSpaces(text: string) {
    let value = text.replace(/\s\s+/g, ' ')
    if (value.startsWith(' ')) {
        value = value.substring(1)
    }
    value = value.trim()
    return value
}

export function formatForComaprison(text: string) {
    return removeExtraSpaces(text.toLowerCase())
}

export function getRoomFromName(mapData: RealmData, name: string) {
    const room = mapData.rooms.find(room => formatForComaprison(room.name) === formatForComaprison(name))
    return room
}

export function getRoomNames(mapData: RealmData) {
    return mapData.rooms.map(room => room.name)
}
