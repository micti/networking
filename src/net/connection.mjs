import { createConnection, isIP } from 'node:net'
import { resolve } from 'node:dns/promises'

class Connection {
  constructor (hostname, port) {
    this.hostname = hostname
    this.address = null
    this.port = port
    this.isConnect = false
    this.socket = null
  }

  async connect () {
    await this.resolve()

    return new Promise((resolve, reject) => {
      try {
        this.socket = createConnection(this.port, this.address, () => {
          this.socket.on('data', d => this.onReceive(d))
          this.isConnect = true
          resolve()
        })
      } catch (err) {
        reject(err)
      }
    })
  }

  async resolve () {
    if (isIP(this.hostname)) {
      this.address = this.hostname

      return
    }

    const [address] = await resolve(this.hostname)

    this.address = address
  }

  setReceiver (fn) {
    this.receiver = fn
  }

  write (data, callback = null) {
    this.socket.write(data, callback)
  }

  finish () {
    if (!this.socket.destroyed) {
      this.socket.destroy()
    }
  }

  onReceive (data) {
    if (this.receiver) this.receiver(data)
  }
}

export default (hostname, port) => new Connection(hostname, port)
