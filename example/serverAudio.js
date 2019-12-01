/* eslint-disable no-console */
const AudioServer = require('../lib/audioServer')
const path = require('path')
const http = require('http')
// const WebSocketServer = require('uws').Server
const { WebSocketServer } = require('@clusterws/cws')
// require('uWebSockets.js')
const net = require('net')
const spawn = require('child_process').spawn
const useSox = process.argv.includes('sox')

const express = require('express')
const app = express()
// serve the html/index.html
app.use(express.static(path.resolve(__dirname, 'html')))
// serve the player
app.use(express.static(path.resolve(__dirname, '../lib')))

const server = http.createServer(app)

// init web socket
const wss = new WebSocketServer({ /* port: 3333 */ server, path: '/t' })
// init the avc server.
const samplingRate = 48000
const channels = 1
const frameDuration = 20
const audioServer = new AudioServer(wss, samplingRate, frameDuration, channels)

// wss, samplingRate, frameDuration, channels, options = {}
// RPI example
if (useSox) {
    let streamer = null

    const startStreamer = () => {
        streamer = spawn('sox', [ '-c', channels.toString(), '-r', samplingRate.toString(), '-t', 'waveaudio', '0', '--buffer', '960', '-p' ])
        console.log('started sox')
        streamer.stderr.on('data', d => console.log(d.toString()))
        streamer.on('close', () => {
            streamer = null
        })
        audioServer.setAudioStream(streamer.stdout)
    }
    // startStreamer()

    // OPTIONAL: start on connect
    audioServer.on('client_connected', () => {
        console.log('client_conneted')
        if (!streamer) {
            startStreamer()
        }
    })


    // OPTIONAL: stop on disconnect
    audioServer.on('client_disconnected', () => {
        console.log('client disconnected')
        if (audioServer.clients.size < 1) {
            if (!streamer) {
                console.log('sox not running')
                return
            }
            console.log('stopping sox')
            streamer.kill('SIGTERM')
        }
    })

} else {
// create the tcp sever that accepts a h264 stream and broadcasts it back to the clients
    this.tcpServer = net.createServer((socket) => {
    // set video stream
        socket.on('error', e => {
            console.log('video downstream error:', e)
        })
        audioServer.setAudioStream(socket)

    })
    this.tcpServer.listen(5001, '0.0.0.0')
}

server.listen(8082, () => {
    console.log('listening!')
})
