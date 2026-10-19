import https from 'node:https'
import fs from 'node:fs'

https.createServer({
  enableTrace: true,
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert'),
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.3'
}, (_, res) => {
  res.setHeader('Content-Type', 'text/plain')
  res.setHeader('Content-Length', 2)
  res.writeHead(404, 'Jello')
  res.end('hello world\n')
}).listen(8000)
