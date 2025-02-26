import './style.css'
import buttons from './uiStuff/uiButtons'
import { io } from 'socket.io-client'
import { Device } from 'mediasoup-client'
import getMic2 from './getMic2'
import createProducerTransport from './mediaSoupFunctions/createProducerTransport'
import createProducer from './mediaSoupFunctions/createProducer'
import requestTransportToConsume from './mediaSoupFunctions/requestTransportToConsume'
let device = null
let localStream = null
let producerTransport = null
let videoProducer = null
let audioProducer = null

const socket = io.connect('http://localhost:8182')
// FOR LOCAL ONLY... no https
socket.on('connect', () => {
  console.log('Connected')
})

const joinRoom = async () => {
  console.log('Join room!')
  const userName = document.getElementById('username').value
  const roomName = document.getElementById('room-input').value
  const joinRoomResp = await socket.emitWithAck('joinRoom', {
    userName,
    roomName
  })
  device = new Device()
  await device.load({
    routerRtpCapabilities: joinRoomResp.routerRtpCapabilities
  })
  console.log(device)
  console.log(joinRoomResp)
  requestTransportToConsume(joinRoomResp, socket, device)
  buttons.control.classList.remove('d-none')
}

const enableFeed = async () => {
  const mic2Id = await getMic2()
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: { deviceId: { exact: mic2Id } }
  })
  buttons.localMediaLeft.srcObject = localStream
  buttons.enableFeed.disabled = true
  buttons.sendFeed.disabled = false
  buttons.muteBtn.disabled = false
}

const sendFeed = async () => {
  producerTransport = await createProducerTransport(socket, device)
  console.log('Have producer transport. time to produce')
  const producers = await createProducer(localStream, producerTransport)
  audioProducer = producers.audioProducer
  videoProducer = producers.videoProducer
  console.log(producers)
  buttons.hangUp.disabled = false
}

const muteAudio = () => {
  if (audioProducer.paused) {
    audioProducer.resume()
    buttons.muteBtn.innerHTML = 'Audio On'
    buttons.muteBtn.classList.add('btn-success') // turn it green
    buttons.muteBtn.classList.remove('btn-danger') // remove the red
    socket.emit('audioChange', 'unmute')
  } else {
    audioProducer.pause()
    buttons.muteBtn.innerHTML = 'Audio Muted'
    buttons.muteBtn.classList.remove('btn-success') // remove it green
    buttons.muteBtn.classList.add('btn-danger') // add the red
    socket.emit('audioChange', 'mute')
  }
}

buttons.joinRoom.addEventListener('click', joinRoom)
buttons.enableFeed.addEventListener('click', enableFeed)
buttons.sendFeed.addEventListener('click', sendFeed)
buttons.muteBtn.addEventListener('click', muteAudio)
