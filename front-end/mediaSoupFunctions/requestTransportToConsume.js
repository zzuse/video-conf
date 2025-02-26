const requestTransportToConsume = (consumeData, socket, device) => {
  consumeData.audioPidsToCreate.forEach(async (audioPid, i) => {
    const videoPid = consumeData.videoPidsToCreate[i]
    const consumerTransportParams = await socket.emitWithAck(
      'requestTransport',
      { type: 'consumer', audioPid }
    )
    console.log(consumerTransportParams)
  })
}
export default requestTransportToConsume
