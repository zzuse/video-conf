const createProducerTransport = (socket, device) =>
  new Promise(async (resolve, reject) => {
    console.log("Client 7.1: Event: requestTransport ")
    const producerTransportParams = await socket.emitWithAck(
      'requestTransport',
      { type: 'producer' }
    )
    console.log('Client 7.2: Event Resp: producerTransportParams:', producerTransportParams)
    const producerTransport = device.createSendTransport(
      producerTransportParams
    )
    console.log('Client 7.3: createSendTransport client half:', producerTransport)
    producerTransport.on(
      'connect',
      async ({ dtlsParameters }, callback, errback) => {
        console.log('Client 7.5: Transport Listen for connect')
        console.log('Client 7.6: Transport Emit Event: connectTransport')
        const connectResp = await socket.emitWithAck(
          'connectTransport',
          {
            dtlsParameters,
            type: 'producer'
          }
        )
        console.log('Client 7.7: Transport Resp connectTransport is back', connectResp)
        if (connectResp === 'success') {
          // callback does not mean finished but it means goto produce
          callback()
        } else if (connectResp === 'error') {
          errback()
        }
      }
    )
    producerTransport.on(
      'produce',
      async (parameters, callback, errback) => {
        console.log('Client 7.8: Transport Listen for produce, Transport Emit Event: startProducing')
        const { kind, rtpParameters } = parameters
        const produceResp = await socket.emitWithAck(
          'startProducing',
          {
            kind,
            rtpParameters
          }
        )
        console.log('Client 7.9: Transport Resp startProducing is back', produceResp)
        if (produceResp === 'error') {
          errback()
        } else {
          callback({ id: produceResp })
        }
      }
    )
    // stat start
    // setInterval(async () => {
    //   const stats = await producerTransport.getStats()
    //   for (const report of stats.values()) {
    //     if (report.type === 'outbound-rtp') {
    //       console.log(report.bytesSent, '-', report.packetsSent)
    //     }
    //   }
    // }, 1000)
    //stat end
    resolve(producerTransport)
  })

export default createProducerTransport
