import { cipherSuites, curves, alos } from '../tls/contanst.mjs'

export default {
  agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0',
  headers: {
    http2: {
      ':method': 'GET',
      ':path': '',
      ':authority': '',
      ':scheme': 'https',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'accept-language': 'en-US,en;q=0.5',
      'accept-encoding': 'gzip, deflate, br',
      'upgrade-insecure-requests': '1',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'cross-site',
      te: 'trailers'
    },
    http1_1: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      Pragma: 'no-cache',
      'Cache-Control': 'no-cache',
      TE: 'trailers'
    }
  },
  ciphers: [
    cipherSuites.TLS_AES_128_GCM_SHA256,
    cipherSuites.TLS_CHACHA20_POLY1305_SHA256,
    cipherSuites.TLS_AES_256_GCM_SHA384,
    cipherSuites.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
    cipherSuites.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
    cipherSuites.TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256,
    cipherSuites.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256,
    cipherSuites.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
    cipherSuites.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
    cipherSuites.TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA,
    cipherSuites.TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA,
    cipherSuites.TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA,
    cipherSuites.TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA,
    cipherSuites.TLS_RSA_WITH_AES_128_GCM_SHA256,
    cipherSuites.TLS_RSA_WITH_AES_256_GCM_SHA384,
    cipherSuites.TLS_RSA_WITH_AES_128_CBC_SHA,
    cipherSuites.TLS_RSA_WITH_AES_256_CBC_SHA
  ],
  curves: [
    curves.X25519,
    curves.secp256r1,
    curves.secp384r1,
    curves.secp521r1,
    curves.ffdhe2048,
    curves.ffdhe3072
  ],
  alos: [
    alos.ecdsa_secp256r1_sha256,
    alos.ecdsa_secp384r1_sha384,
    alos.ecdsa_secp521r1_sha512,
    alos.rsa_pss_rsae_sha256,
    alos.rsa_pss_rsae_sha384,
    alos.rsa_pss_rsae_sha512,
    alos.rsa_pkcs1_sha256,
    alos.rsa_pkcs1_sha384,
    alos.rsa_pkcs1_sha512,
    alos.ecdsa_sha1,
    alos.rsa_pkcs1_sha1
  ]
}
