import http from 'http'
import WebSocket from 'ws'
import pkg from '../package.json'

const server = http.createServer(function (req, res) {
  const pathname = req.url

  switch (pathname) {
    case '/hello':
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end(`Hello World, this is WalletConnect v${pkg.version}`)
      break
    case '/info':
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          name: pkg.name,
          description: pkg.description,
          version: pkg.version
        })
      )
      break
    default:
      break
  }
})

const wsServer = new WebSocket.Server({ server })

interface ISocketMessage {
  topic: string
  type: string
  payload: string
}

interface ISocketSub {
  topic: string
  socket: WebSocket
}

const subs: ISocketSub[] = []
const pubs: ISocketMessage[] = []

const setSub = (subscriber: ISocketSub) => subs.push(subscriber)
const getSub = (topic: string) =>
  subs.filter(subscriber => subscriber.topic === topic)

const setPub = (socketMessage: ISocketMessage) => pubs.push(socketMessage)
const getPub = (topic: string) =>
  pubs.filter(pending => pending.topic === topic)

function socketSend (socket: WebSocket, socketMessage: ISocketMessage) {
  if (socket.readyState === 1) {
    console.log('OUT =>', socketMessage)
    socket.send(JSON.stringify(socketMessage))
  }
}

const SubController = (socket: WebSocket, socketMessage: ISocketMessage) => {
  const topic = socketMessage.topic

  const subscriber = { topic, socket }

  setSub(subscriber)

  const pending = getPub(topic)

  if (pending && pending.length) {
    pending.forEach((pendingMessage: ISocketMessage) =>
      socketSend(socket, pendingMessage)
    )
  }
}

const PubController = (socketMessage: ISocketMessage) => {
  const subscribers = getSub(socketMessage.topic)

  if (subscribers.length) {
    subscribers.forEach((subscriber: ISocketSub) =>
      socketSend(subscriber.socket, socketMessage)
    )
  } else {
    setPub(socketMessage)
  }
}

wsServer.on('connection', (socket: WebSocket) => {
  socket.on('message', async data => {
    const message: string = String(data)

    if (message) {
      let socketMessage: ISocketMessage

      try {
        socketMessage = JSON.parse(message)

        console.log('IN  =>', socketMessage)

        if (socketMessage.type === 'sub') {
          SubController(socket, socketMessage)
        } else if (socketMessage.type === 'pub') {
          PubController(socketMessage)
        }
      } catch (e) {
        console.error(e)
      }
    }
  })
})

const port = Number(process.env.PORT) || 5000
server.listen(port, (error: Error) => {
  if (error) {
    return console.log('Something went wrong', error)
  }

  console.log('Server listening on port', port)
})
