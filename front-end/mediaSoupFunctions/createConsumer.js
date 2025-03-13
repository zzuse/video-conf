const createConsumer = (consumerTransport, pid, device, socket, kind, slot) => {
  return new Promise(async (resolve, reject) => {
    const consumerParams = await socket.emitWithAck(
      'consumeMedia',
      {
        rtpCapabilities: device.rtpCapabilities,
        pid,
        kind
      }
    )
    console.log('Client 8.4.1x: emit consumeMedia consume on:', kind, ',', consumerParams)
    if (consumerParams === 'cannotConsume') {
      console.log('Cannot consume')
      resolve()
    } else if (consumerParams === 'consumeFailed') {
      console.log('Consume failed...')
      resolve()
    } else {
      const consumer = await consumerTransport.consume(consumerParams)
      console.log('Client 8.8: consumerTransport.consume established, unpauseConsumer emit')
      const { track } = consumer
      await socket.emit(
        'unpauseConsumer',
        { pid, kind }
      )
      resolve(consumer)
    }
  })
}

export default createConsumer
