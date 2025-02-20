const fs = require('fs')
const https = require('https')
const http = require('http')

const express = require('express')
const app = express()
// app.use(express.static(__dirname))
app.use(express.static('public'))

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
//we need to load our config file
const config = require('./config/config')
const Client = require('./classes/Client')
const Room = require('./classes/Room')
//we changed our express setup so we can use https
//pass the key and cert to createServer on https
// const expressServer = https.createServer(options, app)
const httpServer = http.createServer(app)
//create our socket.io server... it will listen to our express port
// const io = socketio(expressServer, {
const io = socketio(httpServer, {
  cors: [`http://localhost:5173`],
  cors: [`https://localhost:5173`]
  // cors: [`https://localhost:${config.port}`]
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
  socket.on('joinRoom', async ({ userName, roomName }, ackCb) => {
    let newRoom = false
    client = new Client(userName, socket)
    let requestedRoom = rooms.find(room => room.roomName === roomName)
    if (!requestedRoom) {
      newRoom = true
      const workerToUse = await getWorker(workers)
      requestedRoom = new Room(roomName, workerToUse)
      await requestedRoom.createRouter()
      rooms.push(requestedRoom)
    }
    client.room = requestedRoom
    client.room.addClient(client)
    socket.join(client.room.roomName)
    ackCb({
      routerRtpCapabilities: client.room.router.rtpCapabilities,
      newRoom
    })
  })
  socket.on('requestTransport', async ({ type }, ackCb) => {
    let clientTransportParams
    if (type === 'producer') {
      clientTransportParams = await client.addTransport(type)
    } else if (type === 'consumer') {
    }
    ackCb(clientTransportParams)
  })
  socket.on('connectTransport', async ({ dtlsParameters, type }, ackCb) => {
    console.log('dtls:', dtlsParameters)
    console.log('type:', type)
    if (type === 'producer') {
      try {
        await client.upstreamTransport.connect({ dtlsParameters })
        ackCb('success')
      } catch (error) {
        console.log(error)
        ackCb('error')
      }
    } else if (type === 'consumer') {
    }
  })
  socket.on('startProducing', async ({ kind, rtpParameters }, ackCb) => {
    try {
      const newProducer = client.upstreamTransport.produce({
        kind,
        rtpParameters
      })
      ackCb(newProducer.id)
    } catch (err) {
      console.log(err)
      ackCb(err)
    }
  })
})

// expressServer.listen(config.port)
httpServer.listen(config.port)
