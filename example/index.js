/* eslint-disable no-console */
const AvcServer = require('../lib/server')
const path = require('path')
const http = require('http')
const WebSocketServer = require('uws').Server
const net = require('net')
const spawn     = require('child_process').spawn;

const useRaspivid = process.argv.includes('raspivid')
const width =  640
const height = 480

const express = require('express')
const app = express()
// serve the html/index.html
app.use(express.static(path.resolve(__dirname, 'html')))
// serve the player
app.use(express.static(path.resolve(__dirname, '../lib')))

const server = http.createServer(app)

// init web socket
const wss = new WebSocketServer({ /* port: 3333 */ server })
// init the avc server.
const avcServer = new AvcServer(wss, width, height)

// handling custom events from client
avcServer.client_events.on('custom_event_from_client', e => {
    console.log('a client sent', e)
    // broadcasting custom events to all clients (if you wish to send a event to specific client, handle sockets and new connections yourself)
    avcServer.broadcast('custom_event_from_server', { hello: 'from server' })
})
if(useRaspivid){
    const streamer = spawn('raspivid', ['-pf', 'baseline', '-ih', '-t', '0', '-w', width, '-h', height, '-hf', '-fps', '15', '-g 30', '-o', '-'])
}else{
// create the tcp sever that accepts a h264 stream and broadcasts it back to the clients
this.tcpServer = net.createServer((socket) => {
    // set video stream
    avcServer.setVideoStream(socket)

})
this.tcpServer.listen(5000, '0.0.0.0')
}

server.listen(8080)

// if not using raspivid option than use one of this to stream
// ffmpeg OSX
// then run ffmpeg: ffmpeg -framerate 30 -video_size 640x480 -f avfoundation -i 0  -vcodec libx264 -vprofile baseline -b:v 500k -bufsize 600k -tune zerolatency -pix_fmt yuv420p -r 15 -g 30 -f rawvideo tcp://localhost:5000

// RPI
// /opt/vc/bin/raspivid -pf baseline -ih -t 0 -w 640 -h 480 -hf -fps 15 -g 30 -o - | nc localhost 5000
