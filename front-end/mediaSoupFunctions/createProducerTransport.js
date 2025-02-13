const createProducerTransport = () =>
  new Promise(async (resolve, reject) => {
    const producerTransportParams = await socket.emitWithAck(
      'requestTransport',
      { type }
    )
    console.log(producerTransportParams)
  })

export default createProducerTransport
