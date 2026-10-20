import assert from 'node:assert/strict'

import { STATIC_TABLE } from './fixtures/rfc7541.js'

// RFC 7541 Section 2.3.3: dynamic table entries are addressed right after the static table
export const FIRST_DYNAMIC_INDEX = STATIC_TABLE.length + 1

export const assertDynamicTable = (table, expectedEntries, expectedSize) => {
  expectedEntries.forEach(([name, value], i) => {
    const entry = table.get(FIRST_DYNAMIC_INDEX + i)
    assert.ok(entry, `missing dynamic entry at index ${FIRST_DYNAMIC_INDEX + i}`)
    assert.deepEqual([entry[0], entry[1]], [name, value], `dynamic entry at index ${FIRST_DYNAMIC_INDEX + i}`)
  })
  assert.equal(table.size, expectedSize, 'dynamic table size')
}

// Section 4.1: size of an entry = name length + value length + 32
export const entrySize = (name, value) => Buffer.byteLength(name) + Buffer.byteLength(value) + 32

export const encodeBlock = (encoder, headers) => {
  encoder.build(headers)
  return Buffer.from(encoder.buffer.subarray(0, encoder.current))
}
