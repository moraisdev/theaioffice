export type AnonymousUser = {
    id: string
    username: string
}

class Users {
    private users: { [key: string]: AnonymousUser } = {}

    addUser(id: string, user: AnonymousUser) {
        this.users[id] = user
    }

    getUser(id: string): AnonymousUser | undefined {
        return this.users[id]
    }

    removeUser(id: string) {
        delete this.users[id]
    }
}

const users = new Users()

export { users }
