const newDominantSpeaker = (ds, room, io) => {
  console.log('=== ds ====')
  console.log(ds)
  const i = room.activeSpeakerList.findIndex(pid => pid === ds.producer.id)
  if (i > -1) {
    const [pid] = room.activeSpeakerList.splice(i, 1)
    room.activeSpeakerList.unshift(pid)
  } else {
    room.activeSpeakerList.unshift(ds.producer.id)
  }
}

module.exports = newDominantSpeaker
