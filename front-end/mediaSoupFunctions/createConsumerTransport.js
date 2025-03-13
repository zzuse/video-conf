const createConsumerTransport = (transportParams, device, socket, audioPid) => {
  const consumerTransport = device.createRecvTransport(transportParams)
  console.log('Client 8.3: createRecvTransport client half:', consumerTransport)

  // connectionstatechange
  consumerTransport.on('connectionstatechange', state => {
    console.log('Client 8.3.x: --connectionstatechange--', state)
  })
  // icegatheringstatechange
  consumerTransport.on('icegatheringstatechange', state => {
    console.log('Client 8.3.x: --icegatheringstatechange--', state)
  })

  consumerTransport.on(
    'connect',
    async ({ dtlsParameters }, callback, errback) => {
      console.log('Client 8.5: Transport Listen for connect')
      console.log('Client 8.6: Transport Emit Event: connectTransport')
      const connectResp = await socket.emitWithAck(
        'connectTransport',
        {
          dtlsParameters,
          type: 'consumer',
          audioPid
        }
      )
      console.log('Client 8.7: Transport Emit connectResp is back', connectResp)
      if (connectResp === 'success') {
        callback()
      } else {
        errback()
      }
    }
  )
  return consumerTransport
}

export default createConsumerTransport
