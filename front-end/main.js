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
let consumers = {}

// const socket = io.connect('https://zzuseturn.duckdns.org:8181')
const socket = io.connect('https://localhost:8181')
// FOR LOCAL ONLY... no https
socket.on('connect', () => {
  console.log('Client 1: Connected')
})

socket.on('updateActiveSpeakers', async newListOfActives => {
  console.log('Client 9.1: resp updateActiveSpeakers', newListOfActives)
  let slot = 0
  const remoteEls = document.getElementsByClassName('remote-video')
  for (let el of remoteEls) {
    el.srObject = null
  }
  newListOfActives.forEach(aid => {
    if (aid !== audioProducer?.id) {
      const remoteVideo = document.getElementById(`remote-video-${slot}`)
      const remoteVideoUserName = document.getElementById(`username-${slot}`)
      const consumerForThisSlot = consumers[aid]
      remoteVideo.srcObject = consumerForThisSlot?.combinedStream
      remoteVideoUserName.innerHTML = consumerForThisSlot?.userName
      slot++
    }
  })
})

socket.on('newProducersToConsume', consumeData => {
  console.log('Client 9.2: resp newProducersToConsume', consumeData)
  requestTransportToConsume(consumeData, socket, device, consumers)
})

const joinRoom = async () => {
  console.log('Client 2: Button Click: emit joinRoom!')
  const userName = document.getElementById('username').value
  const roomName = document.getElementById('room-input').value
  const joinRoomResp = await socket.emitWithAck('joinRoom', {
    userName,
    roomName
  })
  console.log('Client 3: joinRoomResp ', joinRoomResp)
  device = new Device()
  await device.load({
    routerRtpCapabilities: joinRoomResp.routerRtpCapabilities
  })
  console.log("Client 4: device load rtpCapabilities ", device)
  requestTransportToConsume(joinRoomResp, socket, device, consumers)
  buttons.control.classList.remove('d-none')
}

const enableFeed = async () => {
  console.log("Client 5: Button Click: Feed On ")
  // const mic2Id = await getMic2()
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
    // audio: { deviceId: { exact: mic2Id } }
  })
  buttons.localMediaLeft.srcObject = localStream
  buttons.enableFeed.disabled = true
  buttons.sendFeed.disabled = false
  buttons.muteBtn.disabled = false
}

const sendFeed = async () => {
  console.log("Client 6: Button Click: Send Feed ")
  // this transport handle both audio and video producers
  producerTransport = await createProducerTransport(socket, device)
  console.log('Client 7.4: Have producer transport. time to produce')
  const producers = await createProducer(localStream, producerTransport)
  audioProducer = producers.audioProducer
  videoProducer = producers.videoProducer
  console.log('Client 7.x: ', producers)
  buttons.hangUp.disabled = false
}

const muteAudio = () => {
  console.log("Client 8: Button Click: Audio On/Muted ")
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
