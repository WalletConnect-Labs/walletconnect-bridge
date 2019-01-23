import http from 'http'
import pkg from '../package.json'

function router (req: http.IncomingMessage, res: http.ServerResponse) {
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
    case '/subscribe':
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end(`Subscribed `)
      break
    default:
      break
  }
}

export default router
