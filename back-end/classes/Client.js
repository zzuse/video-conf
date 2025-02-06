class Client {
  constructor (userName, socket) {
    this.userName = userName
    this.socket = socket
    // instead calling this producer Transport, call it upsteam
    this.upstreamTrasnport = null
    this.producer = {}
    // instead calling this consuer Transport, call it downstream
    this.downstreamTransports = []
    this.consumers = []
    this.room = null
  }
}

module.exports = Client
