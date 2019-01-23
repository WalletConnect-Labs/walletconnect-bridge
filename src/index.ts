import http from 'http'
import WebSocket from 'ws'
import router from './router'
import config from './config'
import pubsub from './pubsub'

const server = http.createServer(function (req, res) {
  router(req, res)
})

const wsServer = new WebSocket.Server({ server })

wsServer.on('connection', (socket: WebSocket) => {
  socket.on('message', async data => {
    pubsub(socket, data)
  })
})

server.listen(config.port, (error: Error) => {
  if (error) {
    return console.log('Something went wrong', error)
  }

  console.log('Server listening on port', config.port)
})
