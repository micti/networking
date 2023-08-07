import https from 'node:https'
import fs from 'node:fs'

https.createServer({
  enableTrace: true,
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert'),
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.3'
}, (_, res) => {
  res.writeHead(200)
  res.end('hello world\n')
}).listen(8000)
