import https from 'node:https'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const big = Buffer.alloc(1024 * 1024, 97)
const small = Buffer.from('hello world')
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

https.createServer({
  key: fs.readFileSync(__dirname + '/server.key'),
  cert: fs.readFileSync(__dirname + '/server.cert')
}, (req, res) => {
  if (req.url === '/big') {
    res.setHeader('Content-Length', big.length)
    return res.end(big)
  }

  if (req.url === '/chunked') {
    // no Content-Length: Node sends Transfer-Encoding: chunked
    for (let i = 0; i < 64; i++) res.write(big.subarray(i * 16384, (i + 1) * 16384))
    return res.end()
  }

  res.setHeader('Content-Length', small.length)
  res.end(small)
}).listen(0, '127.0.0.1', function () {
  process.send(this.address().port)
})
