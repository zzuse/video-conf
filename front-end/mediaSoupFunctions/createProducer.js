const createProducer = (localStream, producerTransport) => {
  return new Promise(async (resolve, reject) => {
    const videoTrack = localStream.getVideoTracks()[0]
    const audioTrack = localStream.getAudioTracks()[0]
    try {
      console.log('Produce on video')
      const videoProducer = await producerTransport.produce({
        track: videoTrack
      })
      console.log('Produce on audio')
      const audioProducer = await producerTransport.produce({
        track: audioTrack
      })
      console.log('Produce finished')
      resolve({ audioProducer, videoProducer })
    } catch (err) {
      console.log(err, 'error producing')
    }
  })
}

export default createProducer
