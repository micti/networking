# Networking

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)

A from-scratch HTTPS client for Node.js that implements TLS and HTTP itself instead of using `node:tls` / `node:https`, so that the ClientHello matches a real browser (Firefox) byte for byte.

Started in 2023 as a Proof of Concept to get past Cloudflare's TLS fingerprinting, inspired by [The Illustrated TLS Connection](https://tls12.xargs.org/). The first minimal version did get past the target protections. Since 2026 the project is being expanded, with AI-assisted workflows, into a learning resource for how TLS, HTTP/2 and related protocols work on the wire.

## Status

| Module | Spec | Local copy | State |
| --- | --- | --- | --- |
| TLS 1.3 | [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446) | [rfc8446.txt](rfc/rfc8446.txt) | Working |
| HTTP/1.1 | [RFC 9112](https://www.rfc-editor.org/rfc/rfc9112) | | Working |
| HPACK | [RFC 7541](https://www.rfc-editor.org/rfc/rfc7541) | [rfc7541.txt](rfc/rfc7541.txt) | In progress, see tests |
| HTTP/2 framing | [RFC 9113](https://www.rfc-editor.org/rfc/rfc9113) | [rfc9113.txt](rfc/rfc9113.txt) | In progress |
| HTTP/3 / QUIC | [RFC 9114](https://www.rfc-editor.org/rfc/rfc9114) | | Planned |

## Specs

Plain-text copies of the RFCs live in [`rfc/`](rfc/), so you can read and search them next to the code. Each one is also linked online.

| RFC | Topic | Local | Online |
| --- | --- | --- | --- |
| 8446 | TLS 1.3 | [rfc8446.txt](rfc/rfc8446.txt) | [rfc-editor.org](https://www.rfc-editor.org/rfc/rfc8446) |
| 7748 | X25519 / X448 elliptic curves | [rfc7748.txt](rfc/rfc7748.txt) | [rfc-editor.org](https://www.rfc-editor.org/rfc/rfc7748) |
| 7919 | ffdhe groups for TLS | [rfc7919.txt](rfc/rfc7919.txt) | [rfc-editor.org](https://www.rfc-editor.org/rfc/rfc7919) |
| 5280 | X.509 certificates and path validation | [rfc5280.txt](rfc/rfc5280.txt) | [rfc-editor.org](https://www.rfc-editor.org/rfc/rfc5280) |
| 7541 | HPACK header compression | [rfc7541.txt](rfc/rfc7541.txt) | [rfc-editor.org](https://www.rfc-editor.org/rfc/rfc7541) |
| 9113 | HTTP/2 | [rfc9113.txt](rfc/rfc9113.txt) | [rfc-editor.org](https://www.rfc-editor.org/rfc/rfc9113) |

## Requirements

- Node.js 24 or later
- No runtime dependencies, only `node:crypto` and `node:net`

## Usage

```js
import request from './src/http/request.js'

const res = await request('https://tools.scrapfly.io/api/fp/ja3?extended=1')

console.log(res.statusCode, res.statusText)
console.log(res.headers)
console.log(Buffer.concat(res.response).toString())
```

`request(url, options)` supports only `https:` URLs. It resolves with:

| Field | Description |
| --- | --- |
| `statusCode`, `statusText` | Status line |
| `headers` | Response headers |
| `response` | Body chunks (`Buffer[]`), unless `onData` is given |
| `time` | Arrival timestamp of each body chunk |

Pass `options.onData(chunk)` to stream the body instead of buffering it.

`node index.js` sends a request to a JA3 fingerprint echo service, so you can compare the result with a real Firefox.

## Project layout

```
src/
  net/      TCP connection
  tls/      TLS 1.3 records, handshake, key schedule, ciphers, extensions
  http/     HTTP/1.1 message builder, response parser, request()
  h2/       HTTP/2 frames
  hpack/    HPACK encoder, decoder, static/dynamic table, Huffman code
  preset/   Browser fingerprints (cipher suites, extensions, headers)
test/       Unit tests (node:test)
benchmark/  Benchmark against node:https and fetch
rfc/        Plain-text copies of the RFCs
```

## Development

```sh
npm install
npm test          # node:test, built in to Node 24
npm run lint      # eslint (neostandard)
node benchmark/bench.js [lib|https|fetch]
```

The HPACK tests are built from the RFC 7541 examples (Appendices A and C), not from the current implementation, so failing tests show where the code differs from the spec.

## Disclaimer

This is an educational project. Make sure you are allowed to access any site you use it against, and respect its terms of service.
