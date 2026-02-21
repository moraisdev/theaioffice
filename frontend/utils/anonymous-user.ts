import { v4 as uuidv4 } from 'uuid'

const ADJECTIVES = [
    'Happy', 'Brave', 'Clever', 'Swift', 'Calm',
    'Bold', 'Bright', 'Cool', 'Eager', 'Fair',
    'Gentle', 'Kind', 'Lucky', 'Noble', 'Quick',
    'Shy', 'Warm', 'Wild', 'Wise', 'Zen'
]

const NOUNS = [
    'Fox', 'Bear', 'Wolf', 'Owl', 'Hawk',
    'Deer', 'Otter', 'Lynx', 'Hare', 'Crow',
    'Panda', 'Tiger', 'Eagle', 'Moose', 'Seal',
    'Whale', 'Raven', 'Swan', 'Dove', 'Frog'
]

function generateRandomName(): string {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
    const num = Math.floor(Math.random() * 100)
    return `${adj}${noun}${num}`
}

export function getUserId(): string {
    if (typeof window === 'undefined') return ''
    let id = localStorage.getItem('gather_user_id')
    if (!id) {
        id = uuidv4()
        localStorage.setItem('gather_user_id', id)
    }
    return id
}

export function getUsername(): string {
    if (typeof window === 'undefined') return 'Anonymous'
    let name = localStorage.getItem('gather_username')
    if (!name) {
        name = generateRandomName()
        localStorage.setItem('gather_username', name)
    }
    return name
}

export function setUsername(name: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('gather_username', name)
}
