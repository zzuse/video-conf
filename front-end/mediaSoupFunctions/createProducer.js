const createProducer = (localStream, producerTransport) => {
  return new Promise(async (resolve, reject) => {
    const videoTrack = localStream.getVideoTracks()[0]
    const audioTrack = localStream.getAudioTracks()[0]
    try {
      console.log('Client 7.4.1x: Produce on video, tell transport connect to fire')
      const videoProducer = await producerTransport.produce({
        track: videoTrack
      })
      console.log('Client 7.4.2x: Produce on audio, tell transport connect to fire, if already connected goto produce')
      const audioProducer = await producerTransport.produce({
        track: audioTrack
      })
      console.log('Client 7.10: Produce finished')
      resolve({ audioProducer, videoProducer })
    } catch (err) {
      console.log(err, 'error producing')
    }
  })
}

export default createProducer
