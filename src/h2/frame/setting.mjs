/**********
https://datatracker.ietf.org/doc/html/rfc7540#section-6.5

+-------------------------------+
|       Identifier (16)         |
+-------------------------------+-------------------------------+
|                        Value (32)                             |
+---------------------------------------------------------------+

**********/

import { Frame } from './frame.mjs'

class SettingFrame extends Frame {
  constructor () {
    super()

    this.buffer[3] = 0x04 // type
  }

  setParams (params) {
    const fields = Object.keys(params)

    if (this.buffer > 9) {
      this.buffer = this.buffer.subarray(0, 9)
    }

    this.buffer = Buffer.concat([this.buffer, Buffer.allocUnsafe(fields.length * 6)])

    fields.forEach((field, idx) => {
      this.buffer.writeUInt16BE(field, 9 + idx * 6)
      this.buffer.writeUInt32BE(params[field], 9 + idx * 6 + 2)
    })

    return this.setLength()
  }
}

export default () => new SettingFrame()
