import table from './table.mjs'
import { encodeHuffman } from './contanst.mjs'

export class Encode {
  constructor (options = { huff: false }) {
    this.table = table(226)
    this.buffer = Buffer.alloc(16384)
    this.bitCount = 0
    this.current = 0
    this.huff = options.huff
  }

  build (headers) {
    // reset
    this.current = 0

    const fields = Object.keys(headers)

    fields.forEach(field => {
      this.add(field, headers[field])
    })
  }

  add (field, value) {
    const { type, idx, x } = this.table.lookup(field, value)

    if (idx >= 1) {
      // write index 01....../.....
      this.writeInt(type, idx, x)

      if (type === 0b0100_0000) {
        this.writeLiteral(value)
        this.table.add(field, value)
      }

      return
    }

    this.writeInt(type, idx, x)
    this.writeLiteral(field)
    this.writeLiteral(value)
    this.table.add(field, value)
  }

  writeInt (mask, idx, l) {
    if (idx < 2 ** l) {
      this.buffer[this.current] = mask | idx
      this.current++
      return
    }

    this.buffer[this.current] = mask | 0b00111111
    this.current++
    let i = idx - 2 ** l - 1

    while (i >= 128) {
      this.buffer[this.current] = i
      this.current++
      i = Math.floor(i / 128)
    }

    this.buffer[this.current] = i
    this.current++
  }

  /**
   *
   * @param {string} value
   * @returns
   */
  writeLiteral (value) {
    // write length
    // write literal
    const rawLength = value.length

    if (!this.huff) {
      this.writeInt(0b0000_0000, rawLength, 8)
      this.buffer.write(value, this.current, 'ascii')
      this.current += rawLength
      return
    }

    let huffBitString = ''
    for (let i = 0; i < rawLength; i++) {
      huffBitString += encodeHuffman[value.charCodeAt(i)]
    }

    const huffLength = huffBitString.length
    let padLength = huffLength % 8
    if (padLength !== 0) padLength = 8 - padLength

    this.writeInt(0b1000_0000, huffLength + padLength, 7)

    for (let i = 0; i < huffLength; i++) {
      this.writeBit(huffBitString[i])
    }

    for (let j = 0; j < padLength; j++) {
      this.writeBit('1')
    }
  }

  writeBit (bit) {
    if (this.bitCount === 0) this.buffer[this.current] = 0 // reset from old buffer or unsafe alloc

    if (bit === '1') this.buffer[this.current] += 2 ** (8 - this.bitCount - 1)
    this.bitCount++

    if (this.bitCount === 8) {
      this.current++
      this.bitCount = 0
    }
  }

  getTable () {
    return this.table
  }
}

export default (options = { huff: false }) => new Encode(options)
