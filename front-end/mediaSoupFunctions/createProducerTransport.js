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
      async ({ dtlsParamters }, cancelIdleCallback, errback) => {}
    )
    producerTransport.on(
      'produce',
      async (parameters, cancelIdleCallback, errback) => {}
    )
    resolve(producerTransport)
  })

export default createProducerTransport
