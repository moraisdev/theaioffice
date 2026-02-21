import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { sockets } from './sockets/sockets'
import routes from './routes/routes'

require('dotenv').config()

const app = express()
const server = http.createServer(app)

app.use(cors({
    origin: process.env.FRONTEND_URL
}))

app.use(express.json({ limit: '10mb' }))

// Initialize Socket.IO server
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL
  }
})

app.use(routes())

sockets(io)

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`)
})


export { io }
