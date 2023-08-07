import table from './table.mjs'
import { decodeHuffman } from './contanst.mjs'

export class Decode {
  constructor () {
    this.table = table(256)
    this.buffer = null
    this.bitCount = 0
    this.current = 0
  }

  decode (data) {
    this.current = 0
    this.bitCount = 0
    this.buffer = data
    const headers = {}

    while (this.current < this.buffer.length) {
      const { flag, l } = this.readFlagAndLength(5)

      if (flag === '001') {
        this.table.newSize(l)
        continue
      }

      if (flag === '1') {
        const [name, value] = this.table.get(l)
        headers[name] = value
        continue
      }

      const name = l > 0 ? this.table.get(l)[0] : this.readLiteral()
      const value = this.readLiteral()
      headers[name] = value

      if (flag === '01') {
        this.table.add(name, value)
      }
    }

    return headers
  }

  readLiteral () {
    const { flag, l } = this.readFlagAndLength(8)

    if (flag === '1') {
      const value = this.decodeHuff(l)
      this.current += l
      return value
    }

    const value = this.buffer.subarray(this.current, this.current + l).toString('ascii')
    this.current += l

    return value
  }

  decodeHuff (l) {
    const buff = this.buffer.subarray(this.current, this.current + l)

    let value = ''
    let code = ''
    for (let i = 0; i < l; i++) {
      const val = buff[i]
      for (let j = 8; j > 0; j--) {
        code += (val >> (j - 1)) & 1
        if (decodeHuffman[code]) {
          value += decodeHuffman[code]
          code = ''
        }
      }
    }

    if (code !== '' && code.length >= 8 && code.indexOf('0') >= 0) {
      throw new Error('Huff wrong')
    }

    return value
  }

  readFlagAndLength (endFlagBit = 5) {
    const val = this.buffer[this.current]
    let flag = ''
    let l = 0

    let i = 8
    while (i >= endFlagBit) {
      const bit = (val >> (i - 1)) & 1
      flag += bit
      i--
      if (bit) break
    }

    for (let j = i; j > 0; j--) {
      if ((val >> (j - 1)) & 1) l += 2 ** (j - 1)
    }

    if (l >= 2 ** (8 - flag.length) - 1) {
      let m = 0
      let b
      do {
        this.current++
        b = this.buffer[this.current]
        l = l + (b & 127) * 2 ** m
        m = m + 7
      } while ((b & 128) === 128)
    }

    this.current++

    return {
      flag,
      l
    }
  }

  getTable () {
    return this.table
  }
}

export default () => new Decode()
