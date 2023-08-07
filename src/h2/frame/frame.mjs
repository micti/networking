/**************

+-----------------------------------------------+
|                 Length (24)                   |
+---------------+---------------+---------------+
|   Type (8)    |   Flags (8)   |
+-+-------------+---------------+-------------------------------+
|R|                 Stream Identifier (31)                      |
+=+=============================================================+
|                   Frame Payload (0...)                      ...
+---------------------------------------------------------------+

**************/

export class Frame {
  constructor () {
    this.buffer = Buffer.alloc(9, 0)
  }

  setFlag (flag) {
    this.buffer[4] |= flag
  }

  unsetFlag (flag) {
    this.buffer[4] ^= flag
  }

  flag (flag) {
    this.buffer[4] = flag
  }

  hasFlag (flag) {
    return this.buffer[4] & flag
  }

  getFrame () {
    return this.buffer
  }

  setLength () {
    const length = this.buffer.length - 9
    this.buffer.writeIntBE(length, 0, 3)

    return this
  }

  setStreamId (id) {
    this.buffer.writeIntBE(id, 5, 4)
  }
}

export default () => new Frame()
