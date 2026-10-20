// Test vectors taken verbatim from RFC 7541 (HPACK), Appendix A and Appendix C.

export const hex = (str) => Buffer.from(str.replace(/\s+/g, ''), 'hex')

// Appendix A. Static Table Definition (index 1..61)
export const STATIC_TABLE = [
  [':authority', ''],
  [':method', 'GET'],
  [':method', 'POST'],
  [':path', '/'],
  [':path', '/index.html'],
  [':scheme', 'http'],
  [':scheme', 'https'],
  [':status', '200'],
  [':status', '204'],
  [':status', '206'],
  [':status', '304'],
  [':status', '400'],
  [':status', '404'],
  [':status', '500'],
  ['accept-charset', ''],
  ['accept-encoding', 'gzip, deflate'],
  ['accept-language', ''],
  ['accept-ranges', ''],
  ['accept', ''],
  ['access-control-allow-origin', ''],
  ['age', ''],
  ['allow', ''],
  ['authorization', ''],
  ['cache-control', ''],
  ['content-disposition', ''],
  ['content-encoding', ''],
  ['content-language', ''],
  ['content-length', ''],
  ['content-location', ''],
  ['content-range', ''],
  ['content-type', ''],
  ['cookie', ''],
  ['date', ''],
  ['etag', ''],
  ['expect', ''],
  ['expires', ''],
  ['from', ''],
  ['host', ''],
  ['if-match', ''],
  ['if-modified-since', ''],
  ['if-none-match', ''],
  ['if-range', ''],
  ['if-unmodified-since', ''],
  ['last-modified', ''],
  ['link', ''],
  ['location', ''],
  ['max-forwards', ''],
  ['proxy-authenticate', ''],
  ['proxy-authorization', ''],
  ['range', ''],
  ['referer', ''],
  ['refresh', ''],
  ['retry-after', ''],
  ['server', ''],
  ['set-cookie', ''],
  ['strict-transport-security', ''],
  ['transfer-encoding', ''],
  ['user-agent', ''],
  ['vary', ''],
  ['via', ''],
  ['www-authenticate', '']
]

// C.1. Integer Representation Examples
export const INTEGER_EXAMPLES = [
  { section: 'C.1.1', value: 10, prefix: 5, encoded: hex('0a') },
  { section: 'C.1.2', value: 1337, prefix: 5, encoded: hex('1f 9a 0a') },
  { section: 'C.1.3', value: 42, prefix: 8, encoded: hex('2a') }
]

// C.2. Header Field Representation Examples (each one independent, fresh context)
export const FIELD_EXAMPLES = {
  literalWithIndexing: {
    section: 'C.2.1',
    encoded: hex('400a 6375 7374 6f6d 2d6b 6579 0d63 7573 746f 6d2d 6865 6164 6572'),
    headers: { 'custom-key': 'custom-header' },
    dynamicTable: [['custom-key', 'custom-header']],
    tableSize: 55
  },
  literalWithoutIndexing: {
    section: 'C.2.2',
    encoded: hex('040c 2f73 616d 706c 652f 7061 7468'),
    headers: { ':path': '/sample/path' },
    dynamicTable: [],
    tableSize: 0
  },
  literalNeverIndexed: {
    section: 'C.2.3',
    encoded: hex('1008 7061 7373 776f 7264 0673 6563 7265 74'),
    headers: { password: 'secret' },
    dynamicTable: [],
    tableSize: 0
  },
  indexed: {
    section: 'C.2.4',
    encoded: hex('82'),
    headers: { ':method': 'GET' },
    dynamicTable: [],
    tableSize: 0
  }
}

const REQUEST_HEADERS = [
  {
    ':method': 'GET',
    ':scheme': 'http',
    ':path': '/',
    ':authority': 'www.example.com'
  },
  {
    ':method': 'GET',
    ':scheme': 'http',
    ':path': '/',
    ':authority': 'www.example.com',
    'cache-control': 'no-cache'
  },
  {
    ':method': 'GET',
    ':scheme': 'https',
    ':path': '/index.html',
    ':authority': 'www.example.com',
    'custom-key': 'custom-value'
  }
]

const REQUEST_TABLES = [
  { dynamicTable: [[':authority', 'www.example.com']], tableSize: 57 },
  {
    dynamicTable: [
      ['cache-control', 'no-cache'],
      [':authority', 'www.example.com']
    ],
    tableSize: 110
  },
  {
    dynamicTable: [
      ['custom-key', 'custom-value'],
      ['cache-control', 'no-cache'],
      [':authority', 'www.example.com']
    ],
    tableSize: 164
  }
]

// C.3. Request Examples without Huffman Coding
export const REQUESTS_PLAIN = [
  {
    section: 'C.3.1',
    encoded: hex('8286 8441 0f77 7777 2e65 7861 6d70 6c65 2e63 6f6d'),
    headers: REQUEST_HEADERS[0],
    ...REQUEST_TABLES[0]
  },
  {
    section: 'C.3.2',
    encoded: hex('8286 84be 5808 6e6f 2d63 6163 6865'),
    headers: REQUEST_HEADERS[1],
    ...REQUEST_TABLES[1]
  },
  {
    section: 'C.3.3',
    encoded: hex('8287 85bf 400a 6375 7374 6f6d 2d6b 6579 0c63 7573 746f 6d2d 7661 6c75 65'),
    headers: REQUEST_HEADERS[2],
    ...REQUEST_TABLES[2]
  }
]

// C.4. Request Examples with Huffman Coding
export const REQUESTS_HUFFMAN = [
  {
    section: 'C.4.1',
    encoded: hex('8286 8441 8cf1 e3c2 e5f2 3a6b a0ab 90f4 ff'),
    headers: REQUEST_HEADERS[0],
    ...REQUEST_TABLES[0]
  },
  {
    section: 'C.4.2',
    encoded: hex('8286 84be 5886 a8eb 1064 9cbf'),
    headers: REQUEST_HEADERS[1],
    ...REQUEST_TABLES[1]
  },
  {
    section: 'C.4.3',
    encoded: hex('8287 85bf 4088 25a8 49e9 5ba9 7d7f 8925 a849 e95b b8e8 b4bf'),
    headers: REQUEST_HEADERS[2],
    ...REQUEST_TABLES[2]
  }
]

// C.5 / C.6 use SETTINGS_HEADER_TABLE_SIZE = 256
export const RESPONSE_TABLE_SIZE = 256

const SET_COOKIE = 'foo=ASDJKHQKBZXOQWEOPIUAXQWEOIU; max-age=3600; version=1'

const RESPONSE_HEADERS = [
  {
    ':status': '302',
    'cache-control': 'private',
    date: 'Mon, 21 Oct 2013 20:13:21 GMT',
    location: 'https://www.example.com'
  },
  {
    ':status': '307',
    'cache-control': 'private',
    date: 'Mon, 21 Oct 2013 20:13:21 GMT',
    location: 'https://www.example.com'
  },
  {
    ':status': '200',
    'cache-control': 'private',
    date: 'Mon, 21 Oct 2013 20:13:22 GMT',
    location: 'https://www.example.com',
    'content-encoding': 'gzip',
    'set-cookie': SET_COOKIE
  }
]

const RESPONSE_TABLES = [
  {
    dynamicTable: [
      ['location', 'https://www.example.com'],
      ['date', 'Mon, 21 Oct 2013 20:13:21 GMT'],
      ['cache-control', 'private'],
      [':status', '302']
    ],
    tableSize: 222
  },
  {
    dynamicTable: [
      [':status', '307'],
      ['location', 'https://www.example.com'],
      ['date', 'Mon, 21 Oct 2013 20:13:21 GMT'],
      ['cache-control', 'private']
    ],
    tableSize: 222
  },
  {
    dynamicTable: [
      ['set-cookie', SET_COOKIE],
      ['content-encoding', 'gzip'],
      ['date', 'Mon, 21 Oct 2013 20:13:22 GMT']
    ],
    tableSize: 215
  }
]

// C.5. Response Examples without Huffman Coding
export const RESPONSES_PLAIN = [
  {
    section: 'C.5.1',
    encoded: hex(`
      4803 3330 3258 0770 7269 7661 7465 611d
      4d6f 6e2c 2032 3120 4f63 7420 3230 3133
      2032 303a 3133 3a32 3120 474d 546e 1768
      7474 7073 3a2f 2f77 7777 2e65 7861 6d70
      6c65 2e63 6f6d`),
    headers: RESPONSE_HEADERS[0],
    ...RESPONSE_TABLES[0]
  },
  {
    section: 'C.5.2',
    encoded: hex('4803 3330 37c1 c0bf'),
    headers: RESPONSE_HEADERS[1],
    ...RESPONSE_TABLES[1]
  },
  {
    section: 'C.5.3',
    encoded: hex(`
      88c1 611d 4d6f 6e2c 2032 3120 4f63 7420
      3230 3133 2032 303a 3133 3a32 3220 474d
      54c0 5a04 677a 6970 7738 666f 6f3d 4153
      444a 4b48 514b 425a 584f 5157 454f 5049
      5541 5851 5745 4f49 553b 206d 6178 2d61
      6765 3d33 3630 303b 2076 6572 7369 6f6e
      3d31`),
    headers: RESPONSE_HEADERS[2],
    ...RESPONSE_TABLES[2]
  }
]

// C.6. Response Examples with Huffman Coding
export const RESPONSES_HUFFMAN = [
  {
    section: 'C.6.1',
    encoded: hex(`
      4882 6402 5885 aec3 771a 4b61 96d0 7abe
      9410 54d4 44a8 2005 9504 0b81 66e0 82a6
      2d1b ff6e 919d 29ad 1718 63c7 8f0b 97c8
      e9ae 82ae 43d3`),
    headers: RESPONSE_HEADERS[0],
    ...RESPONSE_TABLES[0]
  },
  {
    section: 'C.6.2',
    encoded: hex('4883 640e ffc1 c0bf'),
    headers: RESPONSE_HEADERS[1],
    ...RESPONSE_TABLES[1]
  },
  {
    section: 'C.6.3',
    encoded: hex(`
      88c1 6196 d07a be94 1054 d444 a820 0595
      040b 8166 e084 a62d 1bff c05a 839b d9ab
      77ad 94e7 821d d7f2 e6c7 b335 dfdf cd5b
      3960 d5af 2708 7f36 72c1 ab27 0fb5 291f
      9587 3160 65c0 03ed 4ee5 b106 3d50 07`),
    headers: RESPONSE_HEADERS[2],
    ...RESPONSE_TABLES[2]
  }
]
