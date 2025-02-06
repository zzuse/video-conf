import './style.css'
import buttons from './uiStuff/uiButtons'
import { io } from 'socket.io-client'
import { Device } from 'mediasoup-client'

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
}

buttons.joinRoom.addEventListener('click', joinRoom)
