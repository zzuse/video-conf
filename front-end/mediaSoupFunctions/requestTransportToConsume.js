import createConsumerTransport from './createConsumerTransport'
import createConsumer from './createConsumer'

const requestTransportToConsume = (consumeData, socket, device) => {
  consumeData.audioPidsToCreate.forEach(async (audioPid, i) => {
    const videoPid = consumeData.videoPidsToCreate[i]
    const consumerTransportParams = await socket.emitWithAck(
      'requestTransport',
      { type: 'consumer', audioPid }
    )
    console.log(consumerTransportParams)
    const consumerTransport = createConsumerTransport(
      consumerTransportParams,
      device,
      socket,
      audioPid
    )
    const [audioConsumer, videoConsumer] = await Promise.all([
      createConsumer(consumerTransport, audioPid, device, socket, 'audio', i),
      createConsumer(consumerTransport, videoPid, device, socket, 'video', i)
    ])
    console.log(audioConsumer)
    console.log(videoConsumer)
  })
}
export default requestTransportToConsume
