import WebSocket from 'ws'

const port = Number(process.env.PORT) || 5000
const wsServer = new WebSocket.Server({ port })

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

console.log('WebSocket server running on port', port)
