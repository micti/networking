import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import createTable from '../../src/hpack/table.js'
import { STATIC_TABLE } from './fixtures/rfc7541.js'
import { assertDynamicTable, entrySize, FIRST_DYNAMIC_INDEX } from './helpers.js'

describe('HPACK table - Section 2.3.1 / Appendix A static table', () => {
  it('contains the 61 RFC entries at indices 1..61', () => {
    const table = createTable(4096)
    STATIC_TABLE.forEach(([name, value], i) => {
      const entry = table.get(i + 1)
      assert.deepEqual([entry[0], entry[1]], [name, value], `static index ${i + 1}`)
    })
  })

  it('static entries do not count toward the dynamic table size', () => {
    const table = createTable(4096)
    assert.equal(table.size, 0)
  })
})

describe('HPACK table - Section 2.3.3 index address space', () => {
  it('first dynamic entry is at index 62 (static length + 1)', () => {
    const table = createTable(4096)
    table.add('x-a', 'a')
    assertDynamicTable(table, [['x-a', 'a']], entrySize('x-a', 'a'))
  })

  it('new entries are inserted at the lowest dynamic index (FIFO)', () => {
    const table = createTable(4096)
    table.add('x-a', 'a')
    table.add('x-b', 'b')
    table.add('x-c', 'c')
    assertDynamicTable(
      table,
      [['x-c', 'c'], ['x-b', 'b'], ['x-a', 'a']],
      3 * entrySize('x-a', 'a')
    )
  })

  it('duplicate entries are allowed', () => {
    const table = createTable(4096)
    table.add('x-a', 'a')
    table.add('x-a', 'a')
    assertDynamicTable(table, [['x-a', 'a'], ['x-a', 'a']], 2 * entrySize('x-a', 'a'))
  })
})

describe('HPACK table - Section 4.1 entry size', () => {
  const cases = [
    ['custom-key', 'custom-header', 55],
    [':authority', 'www.example.com', 57],
    ['cache-control', 'no-cache', 53],
    ['custom-key', 'custom-value', 54],
    [':status', '302', 42],
    ['cache-control', 'private', 52],
    ['date', 'Mon, 21 Oct 2013 20:13:21 GMT', 65],
    ['location', 'https://www.example.com', 63],
    ['content-encoding', 'gzip', 52],
    ['set-cookie', 'foo=ASDJKHQKBZXOQWEOPIUAXQWEOIU; max-age=3600; version=1', 98],
    ['', '', 32]
  ]
  for (const [name, value, size] of cases) {
    it(`"${name}: ${value}" has size ${size}`, () => {
      const table = createTable(4096)
      table.add(name, value)
      assert.equal(table.size, size)
    })
  }
})

describe('HPACK table - Section 4.3 maximum size change', () => {
  it('reducing the maximum size evicts entries from the end', () => {
    const table = createTable(4096)
    table.add('x-a', 'a')
    table.add('x-b', 'b')
    table.add('x-c', 'c')
    table.newSize(2 * entrySize('x-a', 'a'))
    assertDynamicTable(table, [['x-c', 'c'], ['x-b', 'b']], 2 * entrySize('x-a', 'a'))
  })

  it('setting the maximum size to 0 evicts all entries', () => {
    const table = createTable(4096)
    table.add('x-a', 'a')
    table.add('x-b', 'b')
    table.newSize(0)
    assert.equal(table.size, 0)
    assert.equal(table.maxSize, 0)
    assert.ok(!table.get(FIRST_DYNAMIC_INDEX), 'no dynamic entry should remain')
  })

  it('increasing the maximum size keeps all entries', () => {
    const table = createTable(100)
    table.add('x-a', 'a')
    table.add('x-b', 'b')
    table.newSize(4096)
    assertDynamicTable(table, [['x-b', 'b'], ['x-a', 'a']], 2 * entrySize('x-a', 'a'))
  })
})

describe('HPACK table - Section 4.4 entry eviction when adding new entries', () => {
  it('evicts oldest entries until there is room for the new entry', () => {
    const size = entrySize('x-a', 'a')
    const table = createTable(2 * size)
    table.add('x-a', 'a')
    table.add('x-b', 'b')
    table.add('x-c', 'c')
    assertDynamicTable(table, [['x-c', 'c'], ['x-b', 'b']], 2 * size)
  })

  it('an entry exactly equal to the maximum size fits', () => {
    const size = entrySize('x-a', 'a')
    const table = createTable(size)
    table.add('x-a', 'a')
    assertDynamicTable(table, [['x-a', 'a']], size)
  })

  it('an entry larger than the maximum size empties the table and is not added', () => {
    const table = createTable(50)
    table.add('x-a', 'a')
    table.add('x-too-large', 'xxxxxxxxxxxxxxxxxxxx')
    assert.equal(table.size, 0)
    assert.ok(!table.get(FIRST_DYNAMIC_INDEX), 'no dynamic entry should remain')
  })

  it('reproduces the eviction sequence of RFC 7541 C.5 (max 256)', () => {
    const table = createTable(256)
    table.add(':status', '302')
    table.add('cache-control', 'private')
    table.add('date', 'Mon, 21 Oct 2013 20:13:21 GMT')
    table.add('location', 'https://www.example.com')
    assert.equal(table.size, 222)

    table.add(':status', '307')
    assertDynamicTable(table, [
      [':status', '307'],
      ['location', 'https://www.example.com'],
      ['date', 'Mon, 21 Oct 2013 20:13:21 GMT'],
      ['cache-control', 'private']
    ], 222)

    table.add('date', 'Mon, 21 Oct 2013 20:13:22 GMT')
    table.add('content-encoding', 'gzip')
    table.add('set-cookie', 'foo=ASDJKHQKBZXOQWEOPIUAXQWEOIU; max-age=3600; version=1')
    assertDynamicTable(table, [
      ['set-cookie', 'foo=ASDJKHQKBZXOQWEOPIUAXQWEOIU; max-age=3600; version=1'],
      ['content-encoding', 'gzip'],
      ['date', 'Mon, 21 Oct 2013 20:13:22 GMT']
    ], 215)
  })
})
