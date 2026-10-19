import http2 from 'node:http2'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const server = http2.createSecureServer({
  enableTrace: true,
  key: fs.readFileSync(__dirname + '/server.key'),
  cert: fs.readFileSync(__dirname + '/server.cert')
})

server.on('error', (err) => console.error(err))

server.on('stream', (stream, headers) => {
  stream.respond({
    'content-type': 'text/html; charset=utf-8',
    ':status': 200
  })
  stream.end('<h1>Hello World</h1>')
})

server.listen(8443)
