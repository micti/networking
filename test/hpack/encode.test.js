import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import createEncoder from '../../src/hpack/encode.js'
import createDecoder from '../../src/hpack/decode.js'
import {
  hex,
  STATIC_TABLE,
  INTEGER_EXAMPLES,
  FIELD_EXAMPLES,
  REQUESTS_PLAIN,
  REQUESTS_HUFFMAN,
  RESPONSES_PLAIN,
  RESPONSES_HUFFMAN,
  RESPONSE_TABLE_SIZE
} from './fixtures/rfc7541.js'
import { assertDynamicTable, encodeBlock } from './helpers.js'

const writeInt = (mask, value, prefix) => {
  const encoder = createEncoder()
  encoder.writeInt(mask, value, prefix)
  return Buffer.from(encoder.buffer.subarray(0, encoder.current))
}

const writeLiteral = (value, huff) => {
  const encoder = createEncoder({ huff })
  encoder.writeLiteral(value)
  return Buffer.from(encoder.buffer.subarray(0, encoder.current))
}

describe('HPACK encoder - RFC 7541 Appendix C.1 integer representation', () => {
  for (const { section, value, prefix, encoded } of INTEGER_EXAMPLES) {
    it(`${section}: encodes ${value} with a ${prefix}-bit prefix`, () => {
      assert.deepEqual(writeInt(0, value, prefix), encoded)
    })
  }
})

describe('HPACK encoder - Section 5.1 integer representation', () => {
  const cases = [
    // [description, mask, value, prefix, expected]
    ['0 with 5-bit prefix', 0x00, 0, 5, '00'],
    ['30 (2^5 - 2) with 5-bit prefix', 0x00, 30, 5, '1e'],
    ['31 (2^5 - 1) with 5-bit prefix needs a continuation byte', 0x00, 31, 5, '1f00'],
    ['32 with 5-bit prefix', 0x00, 32, 5, '1f01'],
    ['158 (31 + 127) with 5-bit prefix', 0x00, 158, 5, '1f7f'],
    ['159 (31 + 128) with 5-bit prefix', 0x00, 159, 5, '1f8001'],
    ['126 with 7-bit prefix', 0x00, 126, 7, '7e'],
    ['127 (2^7 - 1) with 7-bit prefix needs a continuation byte', 0x00, 127, 7, '7f00'],
    ['1337 with 7-bit prefix', 0x00, 1337, 7, '7fba09'],
    ['254 with 8-bit prefix', 0x00, 254, 8, 'fe'],
    ['255 with 8-bit prefix needs a continuation byte', 0x00, 255, 8, 'ff00'],
    ['62 with 6-bit prefix', 0x00, 62, 6, '3e'],
    ['63 with 6-bit prefix', 0x00, 63, 6, '3f00'],
    ['4096 with 5-bit prefix', 0x00, 4096, 5, '1fe11f'],
    ['2^21 with 7-bit prefix (3 continuation bytes)', 0x00, 2 ** 21, 7, '7f81ff7f'],
    ['1337 with 5-bit prefix keeps size-update flag 001', 0x20, 1337, 5, '3f9a0a'],
    ['1337 with 7-bit prefix keeps indexed flag 1', 0x80, 1337, 7, 'ffba09'],
    ['1337 with 6-bit prefix keeps incremental-indexing flag 01', 0x40, 1337, 6, '7ffa09'],
    ['1337 with 4-bit prefix keeps never-indexed flag 0001', 0x10, 1337, 4, '1faa0a'],
    ['1337 with 4-bit prefix keeps without-indexing flag 0000', 0x00, 1337, 4, '0faa0a'],
    ['10 with 7-bit prefix keeps Huffman flag', 0x80, 10, 7, '8a']
  ]
  for (const [description, mask, value, prefix, expected] of cases) {
    it(description, () => {
      assert.deepEqual(writeInt(mask, value, prefix), hex(expected))
    })
  }
})

describe('HPACK encoder - Section 5.2 string literal representation', () => {
  it('raw literal: H bit 0, 7-bit length, raw octets', () => {
    assert.deepEqual(writeLiteral('custom-key', false), hex('0a 6375 7374 6f6d 2d6b 6579'))
  })

  it('raw empty literal', () => {
    assert.deepEqual(writeLiteral('', false), hex('00'))
  })

  it('raw literal of 127 octets uses a continuation byte', () => {
    const value = 'a'.repeat(127)
    assert.deepEqual(writeLiteral(value, false), Buffer.concat([hex('7f00'), Buffer.from(value)]))
  })

  it('raw literal of 1337 octets', () => {
    const value = 'b'.repeat(1337)
    assert.deepEqual(writeLiteral(value, false), Buffer.concat([hex('7fba09'), Buffer.from(value)]))
  })

  const huffmanCases = [
    ['www.example.com', '8c f1e3 c2e5 f23a 6ba0 ab90 f4ff'], // C.4.1
    ['no-cache', '86 a8eb 1064 9cbf'], // C.4.2
    ['custom-key', '88 25a8 49e9 5ba9 7d7f'], // C.4.3
    ['custom-value', '89 25a8 49e9 5bb8 e8b4 bf'], // C.4.3
    ['302', '82 6402'], // C.6.1
    ['private', '85 aec3 771a 4b'], // C.6.1
    ['Mon, 21 Oct 2013 20:13:21 GMT', '96 d07a be94 1054 d444 a820 0595 040b 8166 e082 a62d 1bff'], // C.6.1
    ['https://www.example.com', '91 9d29 ad17 1863 c78f 0b97 c8e9 ae82 ae43 d3'], // C.6.1
    ['307', '83 640e ff'], // C.6.2
    ['Mon, 21 Oct 2013 20:13:22 GMT', '96 d07a be94 1054 d444 a820 0595 040b 8166 e084 a62d 1bff'], // C.6.3
    ['gzip', '83 9bd9 ab'], // C.6.3
    [
      'foo=ASDJKHQKBZXOQWEOPIUAXQWEOIU; max-age=3600; version=1',
      `ad 94e7 821d d7f2 e6c7 b335 dfdf cd5b 3960
       d5af 2708 7f36 72c1 ab27 0fb5 291f 9587
       3160 65c0 03ed 4ee5 b106 3d50 07`
    ], // C.6.3
    ['', '80'],
    ['a', '81 1f'] // 00011 + 111 padding
  ]
  for (const [value, expected] of huffmanCases) {
    it(`Huffman literal ${JSON.stringify(value)}: H bit 1, length in octets, EOS-prefix padding`, () => {
      assert.deepEqual(writeLiteral(value, true), hex(expected))
    })
  }
})

describe('HPACK encoder - RFC 7541 Appendix C.2 header field representations', () => {
  it(`${FIELD_EXAMPLES.literalWithIndexing.section}: literal header field with incremental indexing (new name)`, () => {
    const example = FIELD_EXAMPLES.literalWithIndexing
    const encoder = createEncoder()
    assert.deepEqual(encodeBlock(encoder, example.headers), example.encoded)
    assertDynamicTable(encoder.getTable(), example.dynamicTable, example.tableSize)
  })

  it(`${FIELD_EXAMPLES.indexed.section}: indexed header field from static table`, () => {
    const example = FIELD_EXAMPLES.indexed
    const encoder = createEncoder()
    assert.deepEqual(encodeBlock(encoder, example.headers), example.encoded)
    assertDynamicTable(encoder.getTable(), example.dynamicTable, example.tableSize)
  })
})

describe('HPACK encoder - static table matches (Section 2.3.1 / Appendix A)', () => {
  STATIC_TABLE.forEach(([name, value], i) => {
    const index = i + 1
    if (value === '') return
    it(`"${name}: ${value}" encodes as indexed field ${index}`, () => {
      const encoder = createEncoder()
      assert.deepEqual(encodeBlock(encoder, { [name]: value }), Buffer.from([0x80 | index]))
      assert.equal(encoder.getTable().size, 0)
    })
  })
})

const sequence = (title, examples, options, tableSize) => {
  describe(title, () => {
    const encoder = createEncoder(options)
    if (tableSize) encoder.getTable().newSize(tableSize)
    for (const example of examples) {
      it(`${example.section}: produces the RFC header block and dynamic table`, () => {
        assert.deepEqual(encodeBlock(encoder, example.headers).toString('hex'), example.encoded.toString('hex'))
        assertDynamicTable(encoder.getTable(), example.dynamicTable, example.tableSize)
      })
    }
  })
}

sequence('HPACK encoder - RFC 7541 Appendix C.3 requests without Huffman coding', REQUESTS_PLAIN, { huff: false })
sequence('HPACK encoder - RFC 7541 Appendix C.4 requests with Huffman coding', REQUESTS_HUFFMAN, { huff: true })
sequence('HPACK encoder - RFC 7541 Appendix C.5 responses without Huffman coding', RESPONSES_PLAIN, { huff: false }, RESPONSE_TABLE_SIZE)
sequence('HPACK encoder - RFC 7541 Appendix C.6 responses with Huffman coding', RESPONSES_HUFFMAN, { huff: true }, RESPONSE_TABLE_SIZE)

describe('HPACK encoder/decoder round trip', () => {
  const printable = Array.from({ length: 0x7e - 0x20 + 1 }, (_, i) => String.fromCharCode(0x20 + i)).join('')

  for (const huff of [false, true]) {
    const mode = huff ? 'Huffman' : 'raw'

    it(`${mode}: every printable ASCII character survives`, () => {
      const headers = { 'x-printable': printable }
      assert.deepEqual(createDecoder().decode(encodeBlock(createEncoder({ huff }), headers)), headers)
    })

    it(`${mode}: every Huffman code length (5..30 bits) via all octets 0x00-0xff`, () => {
      const all = Array.from({ length: 256 }, (_, i) => String.fromCharCode(i)).join('')
      const encoder = createEncoder({ huff })
      encoder.writeLiteral(all)
      const decoder = createDecoder()
      decoder.buffer = encoder.buffer.subarray(0, encoder.current)
      decoder.current = 0
      assert.equal(Buffer.from(decoder.readLiteral(), 'latin1').toString('hex'), Buffer.from(all, 'latin1').toString('hex'))
    })

    it(`${mode}: consecutive blocks keep encoder and decoder tables in sync`, () => {
      const encoder = createEncoder({ huff })
      const decoder = createDecoder()
      const blocks = [
        { ':method': 'GET', ':path': '/a', 'user-agent': 'test/1.0', 'x-req': '1' },
        { ':method': 'GET', ':path': '/b', 'user-agent': 'test/1.0', 'x-req': '2' },
        { ':method': 'POST', ':path': '/a', 'user-agent': 'test/1.0', 'x-req': '1', 'content-type': 'application/json' },
        { ':method': 'GET', ':path': '/a', 'user-agent': 'test/1.0', 'x-req': '1' }
      ]
      for (const headers of blocks) {
        assert.deepEqual(decoder.decode(encodeBlock(encoder, headers)), headers)
        const et = encoder.getTable()
        const dt = decoder.getTable()
        assert.equal(dt.size, et.size, 'tables must have the same size')
      }
    })

    it(`${mode}: long values (length integer with several continuation bytes)`, () => {
      const headers = { 'x-long': 'q'.repeat(5000) }
      const encoder = createEncoder({ huff })
      const decoder = createDecoder()
      assert.deepEqual(decoder.decode(encodeBlock(encoder, headers)), headers)
    })

    it(`${mode}: many dynamic entries (index integer with continuation bytes)`, () => {
      const encoder = createEncoder({ huff })
      const decoder = createDecoder()
      encoder.getTable().newSize(4096)
      decoder.getTable().newSize(4096)
      const headers = {}
      for (let i = 0; i < 90; i++) headers[`x-h${i}`] = `${i}`
      assert.deepEqual(decoder.decode(encodeBlock(encoder, headers)), headers)
      // second pass: every field is now an indexed dynamic entry, indices 62..151
      const second = encodeBlock(encoder, headers)
      assert.deepEqual(decoder.decode(second), headers)
    })
  }
})
