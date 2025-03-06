const fs = require('fs')
const https = require('https')
const http = require('http')

const express = require('express')
const app = express()
// app.use(express.static(__dirname))
// app.use(express.static('public'))

//we need a key and cert to run https
//we generated them with mkcert
// $ mkcert create-ca
// $ mkcert create-cert
const key = fs.readFileSync('./config/cert.key')
const cert = fs.readFileSync('./config/cert.crt')
const options = { key, cert }

const socketio = require('socket.io')
const mediasoup = require('mediasoup')
const createWorkers = require('./utilities/createWorkers')
const getWorker = require('./utilities/getWorker')
const updateActiveSpeakers = require('./utilities/updateActiveSpeakers')
//we need to load our config file
const config = require('./config/config')
const Client = require('./classes/Client')
const Room = require('./classes/Room')
//we changed our express setup so we can use https
//pass the key and cert to createServer on https
const expressServer = https.createServer(options, app)
// const httpServer = http.createServer(app)
//create our socket.io server... it will listen to our express port
const io = socketio(expressServer, {
  // const io = socketio(httpServer, {
  // cors: [`http://localhost:5173`],
  cors: [`https://localhost:5173`],
  cors: [`https://localhost:5173`],
  cors: [`http://zzuseturn.duckdns.org:8181`],
  cors: [`http://47.251.161.178:8181`],
  cors: [`https://localhost:${config.port}`]
})

let workers = null
const rooms = []
const initMediaSoup = async () => {
  workers = await createWorkers()
  console.log('create worker successfully')
}

initMediaSoup()

io.on('connect', socket => {
  let client
  const handshake = socket.handshake // it is where auth and query live
  socket.on(
    'joinRoom',
    async ({ userName, roomName }, ackCb) => {
      let newRoom = false
      client = new Client(userName, socket)
      let requestedRoom = rooms.find(room => room.roomName === roomName)
      if (!requestedRoom) {
        newRoom = true
        const workerToUse = await getWorker(workers)
        requestedRoom = new Room(roomName, workerToUse)
        await requestedRoom.createRouter(io)
        rooms.push(requestedRoom)
      }
      client.room = requestedRoom
      client.room.addClient(client)
      socket.join(client.room.roomName)

      // fetch the first 0-5 pids
      const audioPidsToCreate = client.room.activeSpeakerList.slice(0, 5)
      // find the videopids and make an array with matching indicies
      const videoPidsToCreate = audioPidsToCreate.map(aid => {
        const producingClient = client.room.clients.find(
          c => c?.producer?.audio?.id === aid
        )
        return producingClient?.producer?.video?.id
      })
      // find the videopids and make an array with matching indicies
      const associatedUserNames = audioPidsToCreate.map(aid => {
        const producingClient = client.room.clients.find(
          c => c?.producer?.audio?.id === aid
        )
        return producingClient?.userName
      })
      ackCb({
        routerRtpCapabilities: client.room.router.rtpCapabilities,
        newRoom,
        audioPidsToCreate,
        videoPidsToCreate,
        associatedUserNames
      })
    }
  )
  socket.on(
    'requestTransport',
    async ({ type, audioPid }, ackCb) => {
      let clientTransportParams
      if (type === 'producer') {
        clientTransportParams = await client.addTransport(type)
      } else if (type === 'consumer') {
        const producingClient = client.room.clients.find(
          c => c?.producer?.audio?.id === audioPid
        )
        const videoPid = producingClient?.producer?.video?.id
        clientTransportParams = await client.addTransport(
          type,
          audioPid,
          videoPid
        )
      }
      ackCb(clientTransportParams)
    }
  )
  socket.on(
    'connectTransport',
    async ({ dtlsParameters, type, audioPid }, ackCb) => {
      // console.log('dtls:', dtlsParameters)
      // console.log('type:', type)
      if (type === 'producer') {
        try {
          await client.upstreamTransport.connect({ dtlsParameters })
          ackCb('success')
        } catch (error) {
          console.log(error)
          ackCb('error')
        }
      } else if (type === 'consumer') {
        try {
          const downstreamTransport = client.downstreamTransports.find(t => {
            return t.associatedAudioPid === audioPid
          })
          downstreamTransport.transport.connect({ dtlsParameters })
          ackCb('success')
        } catch (error) {
          console.log(error)
          ackCb('error')
        }
      }
    }
  )
  socket.on(
    'startProducing',
    async ({ kind, rtpParameters }, ackCb) => {
      try {
        const newProducer = await client.upstreamTransport.produce({
          kind,
          rtpParameters
        })
        client.addProducer(kind, newProducer)
        if (kind === 'audio') {
          client.room.activeSpeakerList.push(newProducer.id)
        }
        ackCb(newProducer.id)
      } catch (err) {
        console.log(err)
        ackCb(err)
      }
      const newTransportsByPeer = updateActiveSpeakers(client.room, io)
      for (const [socketId, audioPidsToCreate] of Object.entries(
        newTransportsByPeer
      )) {
        const videoPidsToCreate = audioPidsToCreate.map(aPid => {
          const producerClient = client.room.clients.find(
            c => c?.producer?.audio?.id === aPid
          )
          return producerClient?.producer?.video?.id
        })
        const associatedUserNames = audioPidsToCreate.map(aPid => {
          const producerClient = client.room.clients.find(
            c => c?.producer?.audio?.id === aPid
          )
          return producerClient?.userName
        })
        io.to(socketId).emit('newProducersToConsume', {
          routerRtpCapabilities: client.room.router.rtpCapabilities,
          audioPidsToCreate,
          videoPidsToCreate,
          associatedUserNames,
          activeSpeakerList: client.room.activeSpeakerList.slice(0, 5)
        })
      }
    }
  )
  socket.on(
    'audioChange',
    typeOfChange => {
      if (typeOfChange === 'mute') {
        client?.producer?.audio?.pause()
      } else {
        client?.producer?.audio?.resume()
      }
    }
  )
  socket.on(
    'consumeMedia',
    async ({ rtpCapabilities, pid, kind }, ackCb) => {
      // will run twice audio and video
      console.log('Kind: ', kind, '  pid:', pid)
      try {
        if (!client.room.router.canConsume({ producerId: pid, rtpCapabilities })) {
          ackCb('cannotConsume')
        } else {
          const downstreamTransports = client.downstreamTransports.find(t => {
            if (kind === 'audio') {
              return t.associatedAudioPid === pid
            } else if (kind === 'video') {
              return t.associatedVideoPid === pid
            }
          })
          const newConsumer = await downstreamTransports.transport.consume({
            producerId: pid,
            rtpCapabilities,
            paused: true
          })
          client.addConsumer(kind, newConsumer, downstreamTransports)
          const clientParams = {
            producerId: pid,
            id: newConsumer.id,
            kind: newConsumer.kind,
            rtpParameters: newConsumer.rtpParameters
          }
          ackCb(clientParams)
        }
      } catch (err) {
        console.log(err)
        ackCb('consumeFailed')
      }
    }
  )
  socket.on(
    'unpauseConsumer',
    async ({ pid, kind }, ackCb) => {
      const consumerToResume = client.downstreamTransports.find(t => {
        return t?.[kind].producerId === pid
      })
      await consumerToResume[kind].resume()
      // ackCb()
    }
  )
})

expressServer.listen(config.port)
// httpServer.listen(config.port)
