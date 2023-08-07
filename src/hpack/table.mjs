import { staticItems } from './contanst.mjs'

export class Table {
  constructor (size) {
    this.size = 0
    this.maxSize = size
    this.staticLength = staticItems.length
    this.items = []
  }

  newSize (size) {
    this.maxSize = size
    this.keep()
  }

  lookup (name, value) {
    let idx = staticItems.findIndex(item => item[0] === name && item[1] === value)
    if (idx >= 1) {
      return {
        type: 0b1000_0000,
        idx,
        x: 7
      }
    }

    idx = this.items.findIndex(item => item[0] === name && item[1] === value)
    if (idx >= 0) {
      return {
        type: 0b1000_0000,
        idx: this.staticLength - idx,
        x: 7
      }
    }

    idx = staticItems.findIndex(item => item[0] === name)
    if (idx >= 1) {
      return {
        type: 0b0100_0000,
        idx,
        x: 6
      }
    }

    idx = this.items.findIndex(item => item[0] === name)
    if (idx >= 0) {
      return {
        type: 0b0100_0000,
        idx: this.staticLength - idx,
        x: 6
      }
    }

    return {
      type: 0b0100_0000,
      x: 6,
      idx: 0
    }
  }

  get (idx) {
    return idx <= this.staticLength ? staticItems[idx] : this.items[idx - this.staticLength]
  }

  add (name, value) {
    const size = name.length + value.length + 32
    this.items.unshift([name, value, size])
    this.size += size
    this.keep()
  }

  keep () {
    while (this.size > this.maxSize) {
      if (this.items.length === 1) {
        break
      }

      const item = this.items.pop()
      this.size -= item[2]
    }
  }
}

export default (size) => new Table(size)
