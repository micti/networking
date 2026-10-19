import http2 from 'node:http2'
import fs from 'node:fs'

const server = http2.createSecureServer({
  enableTrace: true,
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
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
