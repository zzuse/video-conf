const config = require('../config/config')
class Client {
  constructor(userName, socket) {
    this.userName = userName
    this.socket = socket
    // instead calling this producer Transport, call it upsteam
    this.upstreamTransport = null
    this.producer = {}
    // instead calling this consuer Transport, call it downstream
    this.downstreamTransports = []
    // [
    // transport,
    // associatedVideoPid: videoPid,
    // associatedAudioPid: audioPid
    // audio = audioConsumer
    // video = videoConsumer
    // ]
    this.room = null
  }
  addTransport(type, audioPid = null, videoPid = null) {
    return new Promise(async (resolve, reject) => {
      const { listenIps, initialAvailableOutgoingBitrate, maxIncomingBitrate } =
        config.webRtcTransport
      console.log("Server 3.1: server half: createWebRtcTransport ")
      const transport = await this.room.router.createWebRtcTransport({
        enableUdp: true,
        enableTcp: true,
        perferUdp: true,
        listenInfos: listenIps,
        initialAvailableOutgoingBitrate
      })

      if (maxIncomingBitrate) {
        try {
          await transport.setMaxIncomingBitrate(maxIncomingBitrate)
        } catch (err) {
          console.log('Error setting bitrate')
          console.log(err)
        }
      }
      console.log("Server 3.2: transport.setMaxIncomingBitrate")
      // console.log(transport)
      const clientTransportParams = {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters
      }
      if (type === 'producer') {
        this.upstreamTransport = transport
        // stat start
        // setInterval(async () => {
        //   const stats = await this.upstreamTransport.getStats()
        //   for (const report of stats.values()) {
        //     if (report.type === 'webrtc-transport') {
        //       console.log(report.bytesReceived, '-', report.rtpBytesReceived)
        //     }
        //   }
        // }, 1000)
        //stat end
        console.log("Server 3.3.x: upstreamTransport created")
      } else if (type === 'consumer') {
        this.downstreamTransports.push({
          transport,
          associatedVideoPid: videoPid,
          associatedAudioPid: audioPid
        })
        console.log("Server 3.3.x: downstreamTransports added")
      }
      resolve(clientTransportParams)
    })
  }
  addProducer(kind, newProducer) {
    this.producer[kind] = newProducer
    if (kind === 'audio') {
      this.room.activeSpeakerObserver.addProducer({
        producerId: newProducer.id
      })
    }
  }
  addConsumer(kind, newConsumer, downstreamTransports) {
    downstreamTransports[kind] = newConsumer
  }
}

module.exports = Client
