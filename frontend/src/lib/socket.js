import { io } from 'socket.io-client'
import { getToken } from './auth'

let socket

export const getSocket = () => {
    const token = getToken()

    if (!token) {
        return null
    }

    if (!socket) {
        const url = import.meta.env.VITE_SOCKET_URL || undefined

        socket = io(url, {
            transports: ['websocket', 'polling'],
            auth: {
                token
            },
            autoConnect: true
        })
    }

    return socket
}

export const closeSocket = () => {
    if (socket) {
        socket.disconnect()
        socket = undefined
    }
}