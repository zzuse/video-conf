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
let router = null
const rooms = []
const initMediaSoup = async () => {
  workers = await createWorkers()
  console.log('create worker successfully')
  router = await workers[0].createRouter({
    mediaCodecs: config.routerMediaCodecs
  })
}

initMediaSoup()

io.on('connect', socket => {
  let client
  const handshake = socket.handshake // it is where auth and query live
  socket.on('joinRoom', async ({ userName, roomName }, ackCb) => {
    client = new client(userName, socket)
    let requestedRoom = rooms.find(room => room.roomName === roomName)
    if (!requestedRoom) {
      const workerToUse = await getWorker(workers)
      requestedRoom = new Room(roomName, workerToUse)
      await requestedRoom.createRouter()
      rooms.push(requestedRoom)
    }
    client.room = requestedRoom
    client.room.addClient(client)
    socket.join(client.room.roomName)
    ackCb({
      rtpcapabilities,
      success: true,
      roomName: roomName
    })
  })
})

// expressServer.listen(config.port)
httpServer.listen(config.port)
