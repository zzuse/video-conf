const config = require('../config/config')
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
  addTransport (type) {
    return new Promise(async (resolve, reject) => {
      const { listenIps, initialAvailableOutgoingBitrate, maxIncomingBitrate } =
        config.webRtcTransport
      const transport = await this.room.router.createWebRtcTransport({
        enableUdp: true,
        enableTcp: true,
        perferUdp: true,
        listenInfos: listenIps,
        initialAvailableOutgoingBitrate
      })

      if (maxIncomingBitrate) {
        try {
          await transport.setMaxIncomingBitRate(maxIncomingBitrate)
        } catch (err) {
          console.log('Error setting bitrate')
        }
      }

      const clientTransportParams = {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters
      }
      if (type === 'producer') {
        this.upstreamTrasnport = transport
      } else if (type === 'consumer') {
      }
      resolve(clientTransportParams)
    })
  }
}

module.exports = Client
