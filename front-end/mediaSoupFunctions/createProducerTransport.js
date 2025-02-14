const createProducerTransport = () =>
  new Promise(async (resolve, reject) => {
    const producerTransportParams = await socket.emitWithAck(
      'requestTransport',
      { type }
    )
    const producerTransport = devicePixelRatio.createSendTransport(
      producerTransportParams
    )
    producerTransport.on(
      'connect',
      async ({ dtlsParameters }, callback, errback) => {
        const connectResp = await socket.emitWithAck('connectTransport', {
          dtlsParameters,
          type: 'producer'
        })
        console.log(connectResp, 'connectResp is back')
        if (connectResp === 'success') {
          callback()
        } else if (connectResp === 'error') {
          errback()
        }
      }
    )
    producerTransport.on('produce', async (parameters, callback, errback) => {
      console.log('Produce event is now running')
      const { kind, rtpParameters } = parameters
      const connectResp = await socket.emitWithAck('startProducing', {
        kind,
        rtpParameters
      })
      console.log(connectResp, 'produceResp is back!')
      if (connectResp === 'error') {
        errback()
      } else {
        callback({ id: connectResp })
      }
    })
    resolve(producerTransport)
  })

export default createProducerTransport
