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
// const key = fs.readFileSync('/etc/letsencrypt/live/zzuseturn.duckdns.org/privkey.pem')
// const cert = fs.readFileSync('/etc/letsencrypt/live/zzuseturn.duckdns.org/fullchain.pem')
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
// create our socket.io server... cors to our front-end port 5173
const io = socketio(expressServer, {
  // const io = socketio(httpServer, {
  // cors: [`http://localhost:5173`],
  cors: [`https://localhost:5173`],
  cors: [`https://zzuseturn.duckdns.org:5173`],
  cors: [`https://zzuseturn.duckdns.org:${config.port}`],
  cors: [`https://localhost:${config.port}`]
})

let workers = null
const rooms = []
const initMediaSoup = async () => {
  workers = await createWorkers()
  console.log('create worker successfully')
}

initMediaSoup()

// Note: in socket.io when client disconnected, client will auto retry again, and endup with a bunch of new socket event listeners
io.on('connect', socket => {
  let client
  const handshake = socket.handshake // it is where auth and query live
  console.log("Server 1: Listening connected")
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
      // socket.io does have Room concept
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
      console.log("Server 2: resp joinRoom: rtpCapabilities")
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
      console.log("Server 3.4: resp requestTransport: clientTransportParams ", type)
      ackCb(clientTransportParams)
    }
  )
  socket.on(
    'connectTransport',
    async ({ dtlsParameters, type, audioPid }, ackCb) => {
      // console.log('dtls:', dtlsParameters)
      console.log('Server 4.1: recv connectTransport: client transport connected type:', type)
      if (type === 'producer') {
        try {
          await client.upstreamTransport.connect({ dtlsParameters })
          console.log("Server 4.2.x: resp success, upstreamTransport Transport connected")
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
          console.log("Server 4.2.x: resp success, downstreamTransport Transport connected")
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
        console.log("Server 5.1.x: resp startProducing: send front-end the producer id")
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
        console.log('Server 9.2.x: emit newProducersToConsume event to front-end ')
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
      console.log("Server 7.x: resp audioChange ")
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
      console.log('Server 3.8.1: recv consumeMedia for peer,', 'Kind: ', kind, ' pid:', pid)
      try {
        if (!client.room.router.canConsume({ producerId: pid, rtpCapabilities })) {
          console.log('Server 3.8.1.x: canConsume fail for peer,', 'Kind: ', kind, ' pid:', pid)
          ackCb('cannotConsume')
        } else {
          const downstreamTransport = client.downstreamTransports.find(t => {
            if (kind === 'audio') {
              return t.associatedAudioPid === pid
            } else if (kind === 'video') {
              return t.associatedVideoPid === pid
            }
          })
          const newConsumer = await downstreamTransport.transport.consume({
            producerId: pid,
            rtpCapabilities,
            paused: true
          })
          client.addConsumer(kind, newConsumer, downstreamTransport)
          const clientParams = {
            producerId: pid,
            id: newConsumer.id,
            kind: newConsumer.kind,
            rtpParameters: newConsumer.rtpParameters
          }
          console.log('Server 3.8.2: resp consumeMedia with clientParams for peer,', 'Kind: ', kind, ' pid:', pid)
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
