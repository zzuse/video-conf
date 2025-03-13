const updateActiveSpeakers = require('./updateActiveSpeakers')

const newDominantSpeaker = (ds, room, io) => {
  console.log('Server 6.1.x: === ds ====', ds.producer.id)
  const i = room.activeSpeakerList.findIndex(pid => pid === ds.producer.id)
  // not sure unshift is correct
  if (i > -1) {
    const [pid] = room.activeSpeakerList.splice(i, 1)
    room.activeSpeakerList.unshift(pid)
  } else {
    room.activeSpeakerList.unshift(ds.producer.id)
  }
  console.log(room.activeSpeakerList)
  const newTransportsByPeer = updateActiveSpeakers(room, io)
  for (const [socketId, audioPidsToCreate] of Object.entries(
    newTransportsByPeer
  )) {
    const videoPidsToCreate = audioPidsToCreate.map(aPid => {
      const producerClient = room.clients.find(
        c => c?.producer?.audio?.id === aPid
      )
      return producerClient?.producer?.video?.id
    })
    const associatedUserNames = audioPidsToCreate.map(aPid => {
      const producerClient = room.clients.find(
        c => c?.producer?.audio?.id === aPid
      )
      return producerClient?.userName
    })
    console.log('Server 9.3.x: emit newProducersToConsume event to front-end ')
    io.to(socketId).emit('newProducersToConsume', {
      routerRtpCapabilities: room.router.rtpCapabilities,
      audioPidsToCreate,
      videoPidsToCreate,
      associatedUserNames,
      activeSpeakerList: room.activeSpeakerList.slice(0, 5)
    })
  }
}

module.exports = newDominantSpeaker
