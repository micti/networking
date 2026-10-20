import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import createDecoder from '../../src/hpack/decode.js'
import {
  hex,
  STATIC_TABLE,
  FIELD_EXAMPLES,
  REQUESTS_PLAIN,
  REQUESTS_HUFFMAN,
  RESPONSES_PLAIN,
  RESPONSES_HUFFMAN,
  RESPONSE_TABLE_SIZE
} from './fixtures/rfc7541.js'
import { assertDynamicTable, entrySize, FIRST_DYNAMIC_INDEX } from './helpers.js'

const literal = (str) => Buffer.concat([Buffer.from([str.length]), Buffer.from(str, 'ascii')])

describe('HPACK decoder - RFC 7541 Appendix C.2 header field representations', () => {
  for (const example of Object.values(FIELD_EXAMPLES)) {
    it(`${example.section}: decodes ${JSON.stringify(example.headers)}`, () => {
      const decoder = createDecoder()
      assert.deepEqual(decoder.decode(example.encoded), example.headers)
      assertDynamicTable(decoder.getTable(), example.dynamicTable, example.tableSize)
    })
  }
})

describe('HPACK decoder - RFC 7541 Appendix C.3 requests without Huffman coding', () => {
  const decoder = createDecoder()
  for (const example of REQUESTS_PLAIN) {
    it(`${example.section}: decodes header list and updates dynamic table`, () => {
      assert.deepEqual(decoder.decode(example.encoded), example.headers)
      assertDynamicTable(decoder.getTable(), example.dynamicTable, example.tableSize)
    })
  }
})

describe('HPACK decoder - RFC 7541 Appendix C.4 requests with Huffman coding', () => {
  const decoder = createDecoder()
  for (const example of REQUESTS_HUFFMAN) {
    it(`${example.section}: decodes header list and updates dynamic table`, () => {
      assert.deepEqual(decoder.decode(example.encoded), example.headers)
      assertDynamicTable(decoder.getTable(), example.dynamicTable, example.tableSize)
    })
  }
})

describe('HPACK decoder - RFC 7541 Appendix C.5 responses without Huffman coding', () => {
  const decoder = createDecoder()
  decoder.getTable().newSize(RESPONSE_TABLE_SIZE)
  for (const example of RESPONSES_PLAIN) {
    it(`${example.section}: decodes header list and evicts entries`, () => {
      assert.deepEqual(decoder.decode(example.encoded), example.headers)
      assertDynamicTable(decoder.getTable(), example.dynamicTable, example.tableSize)
    })
  }
})

describe('HPACK decoder - RFC 7541 Appendix C.6 responses with Huffman coding', () => {
  const decoder = createDecoder()
  decoder.getTable().newSize(RESPONSE_TABLE_SIZE)
  for (const example of RESPONSES_HUFFMAN) {
    it(`${example.section}: decodes header list and evicts entries`, () => {
      assert.deepEqual(decoder.decode(example.encoded), example.headers)
      assertDynamicTable(decoder.getTable(), example.dynamicTable, example.tableSize)
    })
  }
})

describe('HPACK decoder - Section 2.3 / Appendix A static table', () => {
  STATIC_TABLE.forEach(([name, value], i) => {
    const index = i + 1
    it(`indexed field ${index} decodes to "${name}: ${value}"`, () => {
      const decoder = createDecoder()
      assert.deepEqual(decoder.decode(Buffer.from([0x80 | index])), { [name]: value })
      assert.equal(decoder.getTable().size, 0, 'indexed representation must not modify the dynamic table')
    })
  })
})

describe('HPACK decoder - Section 6.1 indexed header field', () => {
  it('references dynamic table entries starting at index 62, newest first', () => {
    const decoder = createDecoder()
    // two literals with incremental indexing (new name)
    decoder.decode(Buffer.concat([
      hex('40'), literal('x-first'), literal('1'),
      hex('40'), literal('x-second'), literal('2')
    ]))
    assert.deepEqual(decoder.decode(Buffer.from([0x80 | FIRST_DYNAMIC_INDEX])), { 'x-second': '2' })
    assert.deepEqual(decoder.decode(Buffer.from([0x80 | (FIRST_DYNAMIC_INDEX + 1)])), { 'x-first': '1' })
  })

  it('index 0 is a decoding error', () => {
    const decoder = createDecoder()
    assert.throws(() => decoder.decode(hex('80')))
  })

  it('index beyond static + dynamic table is a decoding error (Section 2.3.3)', () => {
    const decoder = createDecoder()
    assert.throws(() => decoder.decode(Buffer.from([0x80 | FIRST_DYNAMIC_INDEX])))
  })

  it('index beyond the current dynamic table length is a decoding error', () => {
    const decoder = createDecoder()
    decoder.decode(Buffer.concat([hex('40'), literal('x-a'), literal('a')]))
    assert.throws(() => decoder.decode(Buffer.from([0x80 | (FIRST_DYNAMIC_INDEX + 1)])))
  })

  it('decodes a multi-byte index (Section 5.1 integer with continuation)', () => {
    const decoder = createDecoder()
    decoder.getTable().newSize(4096)
    // fill the dynamic table with 100 entries
    const block = []
    for (let i = 0; i < 100; i++) {
      block.push(hex('40'), literal(`x-h${i}`), literal(`${i}`))
    }
    decoder.decode(Buffer.concat(block))
    // index 61 + 100 = 161 is the oldest entry (x-h0)
    // 161 - 127 = 34 -> 0xff 0x22
    assert.deepEqual(decoder.decode(hex('ff22')), { 'x-h0': '0' })
    // index 127 is exactly 2^7 - 1 -> 0xff 0x00, entry #66 -> x-h(100 - 66) = x-h34
    assert.deepEqual(decoder.decode(hex('ff00')), { 'x-h34': '34' })
    // index 126 fits in prefix -> 0xfe
    assert.deepEqual(decoder.decode(hex('fe')), { 'x-h35': '35' })
  })
})

describe('HPACK decoder - Section 6.2.1 literal header field with incremental indexing', () => {
  it('indexed name from static table, literal value', () => {
    const decoder = createDecoder()
    // 0x40 | 1 -> :authority
    const headers = decoder.decode(Buffer.concat([hex('41'), literal('example.org')]))
    assert.deepEqual(headers, { ':authority': 'example.org' })
    assertDynamicTable(decoder.getTable(), [[':authority', 'example.org']], entrySize(':authority', 'example.org'))
  })

  it('indexed name from dynamic table, literal value', () => {
    const decoder = createDecoder()
    decoder.decode(Buffer.concat([hex('40'), literal('x-custom'), literal('one')]))
    const headers = decoder.decode(Buffer.concat([Buffer.from([0x40 | FIRST_DYNAMIC_INDEX]), literal('two')]))
    assert.deepEqual(headers, { 'x-custom': 'two' })
    assertDynamicTable(
      decoder.getTable(),
      [['x-custom', 'two'], ['x-custom', 'one']],
      entrySize('x-custom', 'two') + entrySize('x-custom', 'one')
    )
  })

  it('name index with 6-bit prefix overflow (index >= 63)', () => {
    const decoder = createDecoder()
    decoder.decode(Buffer.concat([
      hex('40'), literal('x-old'), literal('a'),
      hex('40'), literal('x-new'), literal('b')
    ]))
    // index 63 = x-old ; 63 - 63 = 0 -> 0x7f 0x00
    const headers = decoder.decode(Buffer.concat([hex('7f00'), literal('c')]))
    assert.deepEqual(headers, { 'x-old': 'c' })
  })

  it('empty value is allowed', () => {
    const decoder = createDecoder()
    const headers = decoder.decode(Buffer.concat([hex('40'), literal('x-empty'), literal('')]))
    assert.deepEqual(headers, { 'x-empty': '' })
    assert.equal(decoder.getTable().size, entrySize('x-empty', ''))
  })
})

describe('HPACK decoder - Section 6.2.2 literal header field without indexing', () => {
  it('new name is not added to the dynamic table', () => {
    const decoder = createDecoder()
    const headers = decoder.decode(Buffer.concat([hex('00'), literal('x-no-index'), literal('value')]))
    assert.deepEqual(headers, { 'x-no-index': 'value' })
    assert.equal(decoder.getTable().size, 0)
  })

  it('indexed name with 4-bit prefix overflow (index >= 15)', () => {
    const decoder = createDecoder()
    // index 16 (accept-encoding): 0x0f, 16 - 15 = 1
    const headers = decoder.decode(Buffer.concat([hex('0f01'), literal('br')]))
    assert.deepEqual(headers, { 'accept-encoding': 'br' })
    assert.equal(decoder.getTable().size, 0)
  })
})

describe('HPACK decoder - Section 6.2.3 literal header field never indexed', () => {
  it('indexed name is not added to the dynamic table', () => {
    const decoder = createDecoder()
    // index 23 (authorization): 0x1f, 23 - 15 = 8
    const headers = decoder.decode(Buffer.concat([hex('1f08'), literal('Bearer xyz')]))
    assert.deepEqual(headers, { authorization: 'Bearer xyz' })
    assert.equal(decoder.getTable().size, 0)
  })

  it('literal name is not added to the dynamic table', () => {
    const decoder = createDecoder()
    const headers = decoder.decode(Buffer.concat([hex('10'), literal('x-secret'), literal('s3cr3t')]))
    assert.deepEqual(headers, { 'x-secret': 's3cr3t' })
    assert.equal(decoder.getTable().size, 0)
  })
})

describe('HPACK decoder - Section 5.2 string literal representation', () => {
  it('decodes a raw literal whose length needs a multi-byte integer (>= 127)', () => {
    const decoder = createDecoder()
    const value = 'v'.repeat(200)
    // 200 - 127 = 73 -> 0x7f 0x49
    const block = Buffer.concat([hex('00'), literal('x-long'), hex('7f49'), Buffer.from(value)])
    assert.deepEqual(decoder.decode(block), { 'x-long': value })
  })

  it('decodes a raw literal of exactly 127 octets (0x7f 0x00)', () => {
    const decoder = createDecoder()
    const value = 'w'.repeat(127)
    const block = Buffer.concat([hex('00'), literal('x-127'), hex('7f00'), Buffer.from(value)])
    assert.deepEqual(decoder.decode(block), { 'x-127': value })
  })

  it('decodes a raw literal of 1337 octets (0x7f 0xba 0x09)', () => {
    const decoder = createDecoder()
    const value = 'z'.repeat(1337)
    const block = Buffer.concat([hex('00'), literal('x-1337'), hex('7fba09'), Buffer.from(value)])
    assert.deepEqual(decoder.decode(block), { 'x-1337': value })
  })

  it('decodes a Huffman-encoded name and value', () => {
    const decoder = createDecoder()
    // from C.4.3: custom-key / custom-value
    const block = hex('0088 25a8 49e9 5ba9 7d7f 8925 a849 e95b b8e8 b4bf')
    assert.deepEqual(decoder.decode(block), { 'custom-key': 'custom-value' })
  })

  it('decodes an empty Huffman string', () => {
    const decoder = createDecoder()
    const block = Buffer.concat([hex('00'), literal('x-empty'), hex('80')])
    assert.deepEqual(decoder.decode(block), { 'x-empty': '' })
  })
})

describe('HPACK decoder - Section 5.2 Huffman decoding errors', () => {
  // 'a' = 00011 (5 bits)
  it('accepts padding of up to 7 bits made of EOS MSBs', () => {
    const decoder = createDecoder()
    // 00011 111
    const block = Buffer.concat([hex('00'), literal('x-h'), hex('81 1f')])
    assert.deepEqual(decoder.decode(block), { 'x-h': 'a' })
  })

  it('padding longer than 7 bits is a decoding error', () => {
    const decoder = createDecoder()
    // 00011 111 11111111
    const block = Buffer.concat([hex('00'), literal('x-h'), hex('82 1f ff')])
    assert.throws(() => decoder.decode(block))
  })

  it('padding that is not the MSBs of EOS (contains a 0) is a decoding error', () => {
    const decoder = createDecoder()
    // 00011 000
    const block = Buffer.concat([hex('00'), literal('x-h'), hex('81 18')])
    assert.throws(() => decoder.decode(block))
  })

  it('a string containing the EOS symbol is a decoding error', () => {
    const decoder = createDecoder()
    // EOS (30 bits of 1) + 2 bits padding
    const block = Buffer.concat([hex('00'), literal('x-h'), hex('84 ff ff ff ff')])
    assert.throws(() => decoder.decode(block))
  })
})

describe('HPACK decoder - Section 6.3 / 4.2 dynamic table size update', () => {
  it('updates the maximum size of the dynamic table', () => {
    const decoder = createDecoder()
    // 100 with 5-bit prefix: 0x3f, 100 - 31 = 69 -> 0x45
    assert.deepEqual(decoder.decode(hex('3f45')), {})
    assert.equal(decoder.getTable().maxSize, 100)
  })

  it('encodes a size that fits in the 5-bit prefix (0x20 | 30)', () => {
    const decoder = createDecoder()
    decoder.decode(hex('3e'))
    assert.equal(decoder.getTable().maxSize, 30)
  })

  it('size exactly 31 uses a continuation byte (0x3f 0x00)', () => {
    const decoder = createDecoder()
    decoder.decode(hex('3f00'))
    assert.equal(decoder.getTable().maxSize, 31)
  })

  it('size update to 0 evicts every entry (Section 4.3)', () => {
    const decoder = createDecoder()
    decoder.decode(Buffer.concat([
      hex('40'), literal('x-a'), literal('a'),
      hex('40'), literal('x-b'), literal('b')
    ]))
    decoder.decode(hex('20'))
    assert.equal(decoder.getTable().size, 0)
    assert.throws(() => decoder.decode(Buffer.from([0x80 | FIRST_DYNAMIC_INDEX])))
  })

  it('reducing the size evicts the oldest entries first (Section 4.3)', () => {
    const decoder = createDecoder()
    decoder.decode(Buffer.concat([
      hex('40'), literal('x-a'), literal('a'), // 36
      hex('40'), literal('x-b'), literal('b') // 36
    ]))
    // new max 40 -> only x-b fits
    decoder.decode(hex('3f09'))
    assertDynamicTable(decoder.getTable(), [['x-b', 'b']], 36)
  })

  it('two size updates at the start of a block are allowed; the last wins', () => {
    const decoder = createDecoder()
    decoder.decode(Buffer.concat([hex('40'), literal('x-a'), literal('a')]))
    const headers = decoder.decode(Buffer.concat([hex('20'), hex('3f45'), hex('82')]))
    assert.deepEqual(headers, { ':method': 'GET' })
    assert.equal(decoder.getTable().maxSize, 100)
    assert.equal(decoder.getTable().size, 0, 'size 0 update must have flushed the table')
  })

  it('size update after a header field representation is a decoding error', () => {
    const decoder = createDecoder()
    assert.throws(() => decoder.decode(hex('82 3f45')))
  })

  it('size update above the protocol limit is a decoding error', () => {
    const decoder = createDecoder()
    const limit = decoder.getTable().maxSize
    const over = limit + 1 - 31
    const bytes = [0x3f]
    let i = over
    while (i >= 128) {
      bytes.push((i % 128) + 128)
      i = Math.floor(i / 128)
    }
    bytes.push(i)
    assert.throws(() => decoder.decode(Buffer.from(bytes)))
  })
})

describe('HPACK decoder - Section 4.4 entry eviction when adding new entries', () => {
  it('evicts oldest entries until the new entry fits', () => {
    const decoder = createDecoder()
    decoder.decode(hex('3f45')) // max 100
    decoder.decode(Buffer.concat([
      hex('40'), literal('x-1'), literal('1'), // 36
      hex('40'), literal('x-2'), literal('2'), // 36 -> 72
      hex('40'), literal('x-3'), literal('3') // 36 -> 108 > 100, evict x-1
    ]))
    assertDynamicTable(decoder.getTable(), [['x-3', '3'], ['x-2', '2']], 72)
  })

  it('an entry exactly the size of the table fills it', () => {
    const decoder = createDecoder()
    decoder.decode(hex('3f05')) // max 36
    decoder.decode(Buffer.concat([hex('40'), literal('x-1'), literal('1')]))
    assertDynamicTable(decoder.getTable(), [['x-1', '1']], 36)
  })

  it('an entry larger than the maximum size empties the table and is not an error', () => {
    const decoder = createDecoder()
    decoder.decode(hex('3f05')) // max 36
    decoder.decode(Buffer.concat([hex('40'), literal('x-1'), literal('1')]))
    const headers = decoder.decode(Buffer.concat([hex('40'), literal('x-too-big'), literal('value')]))
    assert.deepEqual(headers, { 'x-too-big': 'value' })
    assert.equal(decoder.getTable().size, 0)
    assert.throws(() => decoder.decode(Buffer.from([0x80 | FIRST_DYNAMIC_INDEX])))
  })

  it('entry referencing a name being evicted still decodes correctly', () => {
    const decoder = createDecoder()
    decoder.decode(hex('3f05')) // max 36: only one entry fits
    decoder.decode(Buffer.concat([hex('40'), literal('x-1'), literal('1')]))
    // literal with indexing, name = dynamic index 62 (x-1), which gets evicted by the insertion
    const headers = decoder.decode(Buffer.concat([Buffer.from([0x40 | FIRST_DYNAMIC_INDEX]), literal('2')]))
    assert.deepEqual(headers, { 'x-1': '2' })
    assertDynamicTable(decoder.getTable(), [['x-1', '2']], 36)
  })
})

describe('HPACK decoder - truncated input (Section 5 decoding errors)', () => {
  const cases = [
    ['integer continuation missing', hex('ff')],
    ['literal name length larger than remaining data', hex('40 0a 6375 7374')],
    ['literal value missing', Buffer.concat([hex('40'), literal('x-a')])],
    ['literal value length larger than remaining data', Buffer.concat([hex('40'), literal('x-a'), hex('05 61')])],
    ['Huffman string length larger than remaining data', Buffer.concat([hex('00'), literal('x-a'), hex('85 1f')])]
  ]
  for (const [name, block] of cases) {
    it(`${name} is a decoding error`, () => {
      const decoder = createDecoder()
      assert.throws(() => decoder.decode(block))
    })
  }
})

describe('HPACK decoder - empty header block', () => {
  it('returns no headers', () => {
    const decoder = createDecoder()
    assert.deepEqual(decoder.decode(Buffer.alloc(0)), {})
  })
})
