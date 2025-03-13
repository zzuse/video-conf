import createConsumerTransport from './createConsumerTransport'
import createConsumer from './createConsumer'

const requestTransportToConsume = (consumeData, socket, device, consumers) => {
  consumeData.audioPidsToCreate.forEach(async (audioPid, i) => {
    console.log("Client 8.1.x: Event: requestTransport for each pid")
    const videoPid = consumeData.videoPidsToCreate[i]
    const consumerTransportParams = await socket.emitWithAck(
      'requestTransport',
      { type: 'consumer', audioPid }
    )
    console.log('Client 8.2.x: Event Resp: consumerTransportParams for each pid: ', consumerTransportParams)
    const consumerTransport = createConsumerTransport(
      consumerTransportParams,
      device,
      socket,
      audioPid
    )
    console.log('Client 8.4: Have consumer transport. time to consume')
    const [audioConsumer, videoConsumer] = await Promise.all([
      createConsumer(consumerTransport, audioPid, device, socket, 'audio', i),
      createConsumer(consumerTransport, videoPid, device, socket, 'video', i)
    ])
    console.log('Client 8.9.1: audio', audioConsumer)
    console.log('Client 8.9.2: video', videoConsumer)
    const combinedStream = new MediaStream([
      audioConsumer?.track,
      videoConsumer?.track
    ])
    const remoteVideo = document.getElementById(`remote-video-${i}`)
    remoteVideo.srcObject = combinedStream
    console.log('Client 8.10: combinedStream, Hope this works...')
    consumers[audioPid] = {
      combinedStream,
      userName: consumeData.associatedUserNames[i],
      consumerTransport,
      audioConsumer,
      videoConsumer
    }
  })
}
export default requestTransportToConsume
