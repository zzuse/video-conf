const createProducerTransport = (socket, device) =>
  new Promise(async (resolve, reject) => {
    const producerTransportParams = await socket.emitWithAck(
      'requestTransport',
      { type: 'producer' }
    )
    console.log('producerTransportParams:', producerTransportParams)
    const producerTransport = await device.createSendTransport(
      producerTransportParams
    )
    console.log('producerTransport:', producerTransport)
    producerTransport.on(
      'connect',
      async ({ dtlsParameters }, callback, errback) => {
        console.log('Connect running on produce...')
        const connectResp = await socket.emitWithAck('connectTransport', {
          dtlsParameters,
          type: 'producer'
        })
        console.log(connectResp, 'connectResp is back')
        if (connectResp === 'success') {
          // callback does not mean finished but it means goto produce
          callback()
        } else if (connectResp === 'error') {
          errback()
        }
      }
    )
    producerTransport.on('produce', async (parameters, callback, errback) => {
      console.log('Produce event is now running')
      const { kind, rtpParameters } = parameters
      const produceResp = await socket.emitWithAck('startProducing', {
        kind,
        rtpParameters
      })
      console.log(produceResp, 'produceResp is back!')
      if (produceResp === 'error') {
        errback()
      } else {
        callback({ id: produceResp })
      }
    })
    resolve(producerTransport)
  })

export default createProducerTransport
