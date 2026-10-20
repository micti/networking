/**
 * Run benchmarks for all client implementations
 * - node benchmark/bench.js
 *
 * Run benchmarks for a specific client implementation
 * - node benchmark/bench.js https
 * - node benchmark/bench.js fetch
 * - node benchmark/bench.js lib
 */

import https from 'node:https'
import { fork, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import request from '../src/http/request.js'

const CASES = {
  small: { path: '/', n: 300, concurrency: 1 },
  big: { path: '/big', n: 40, concurrency: 1 },
  chunked: { path: '/chunked', n: 40, concurrency: 1 },
  parallel: { path: '/', n: 400, concurrency: 25 }
}
const CLIENTS = ['lib', 'https', 'fetch']

// const bodySize = (r) => {
//   const body = r.response ?? r
//   return Array.isArray(body) ? body.reduce((n, b) => n + b.length, 0) : body.length
// }

const makeClient = async (name) => {
  if (name === 'lib') {
    return async (url) => await request(url, {
      onData: (d) => {}
    })
  }

  if (name === 'https') {
    return (url) => new Promise((resolve, reject) => {
      https.get(url, { rejectUnauthorized: false, agent: false }, res => {
        let n = 0
        res.on('data', d => { n += d.length })
        res.on('end', () => resolve(n))
      }).on('error', reject)
    })
  }

  return async (url) => (await (await fetch(url)).arrayBuffer()).byteLength
}

const measure = async (clientName, caseName, port) => {
  const { path, n, concurrency } = CASES[caseName]
  const url = `https://127.0.0.1:${port}${path}`
  const run = await makeClient(clientName)

  for (let i = 0; i < 5; i++) await run(url)
  global.gc()

  let peakHeap = 0
  let peakBuffers = 0
  let next = 0
  const sample = () => {
    const m = process.memoryUsage()
    peakHeap = Math.max(peakHeap, m.heapUsed)
    peakBuffers = Math.max(peakBuffers, m.arrayBuffers)
  }
  const worker = async () => {
    while (next++ < n) {
      await run(url)
      sample()
    }
  }

  const cpu = process.cpuUsage()
  const start = process.hrtime.bigint()
  await Promise.all(Array.from({ length: concurrency }, worker))
  const ms = Number(process.hrtime.bigint() - start) / 1e6
  const used = process.cpuUsage(cpu)

  console.log(JSON.stringify({
    client: clientName,
    case: caseName,
    msPerReq: ms / n,
    cpuMsPerReq: (used.user + used.system) / 1000 / n,
    peakHeapMB: peakHeap / 2 ** 20,
    peakBuffersMB: peakBuffers / 2 ** 20,
    maxRssMB: process.resourceUsage().maxRSS / 1024
  }))
  process.exit(0)
}

const main = async () => {
  const server = fork(fileURLToPath(new URL('server_http1.js', import.meta.url)))
  const port = await new Promise(resolve => server.once('message', resolve))
  const self = fileURLToPath(import.meta.url)
  console.log(self)
  const only = process.argv[2]
  console.log(only)

  console.log('client  case       ms/req  cpu ms/req  heap MB  buffers MB  rss MB')
  for (const caseName of Object.keys(CASES)) {
    for (const clientName of CLIENTS.filter(c => !only || c === only)) {
      const out = execFileSync(process.execPath, ['--expose-gc', '--no-warnings', self, '--run', clientName, caseName, port], {
        env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: '0' }
      }).toString().trim().split('\n').pop()
      const r = JSON.parse(out)
      console.log([
        r.client.padEnd(7),
        r.case.padEnd(9),
        r.msPerReq.toFixed(2).padStart(7),
        r.cpuMsPerReq.toFixed(2).padStart(11),
        r.peakHeapMB.toFixed(1).padStart(8),
        r.peakBuffersMB.toFixed(1).padStart(11),
        r.maxRssMB.toFixed(0).padStart(7)
      ].join(' '))
    }
  }

  server.kill()
}

if (process.argv[2] === '--run') {
  measure(process.argv[3], process.argv[4], process.argv[5])
} else {
  main()
}
