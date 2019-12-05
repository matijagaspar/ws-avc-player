/* eslint-disable no-console */
const AvcServer = require('../lib/avcServer')
const AudioServer = require('../lib/audioServer')

const path = require('path')
const http = require('http')
// const WebSocketServer = require('uws').Server
const { WebSocketServer } = require('@clusterws/cws')
// require('uWebSockets.js')
const net = require('net')
const spawn = require('child_process').spawn

const rasp = process.argv.includes('rasp')
const win = process.argv.includes('win')
const width = 1280
const height = 720

const express = require('express')
const app = express()
// serve the html/index.html
app.use(express.static(path.resolve(__dirname, 'html')))
// serve the player
app.use(express.static(path.resolve(__dirname, '../lib')))

const server = http.createServer(app)

// init video web socket
const wssVideo = new WebSocketServer({ /* port: 3333 */ server, path: 'video' })
// init audio web socket
const wssAudio = new WebSocketServer({ /* port: 3333 */ server, path: '/audio' })

// init the avc server.
const avcServer = new AvcServer(wssVideo, width, height)

// init audio server
const samplingRate = 48000
const channels = 1
const frameDuration = 20
const audioServer = new AudioServer(wssAudio, samplingRate, frameDuration, channels)

// RPI example
if (rasp) {
    let streamer = null

    const startStreamer = () => {
        console.log('starting raspivid')
        streamer = spawn('raspivid', [ '-pf', 'baseline', '-ih', '-t', '0', '-w', width, '-h', height, '-hf', '-fps', '15', '-g', '30', '-o', '-' ])
        streamer.on('close', () => {
            streamer = null
        })
        avcServer.setVideoStream(streamer.stdout)
    }

    // OPTIONAL: start on connect
    avcServer.on('client_connected', () => {
        if (!streamer) {
            startStreamer()
        }
    })


    // OPTIONAL: stop on disconnect
    avcServer.on('client_disconnected', () => {
        console.log('client disconnected')
        if (avcServer.clients.size < 1) {
            if (!streamer) {
                console.log('raspivid not running')
                return
            }
            console.log('stopping raspivid')
            streamer.kill('SIGTERM')
        }
    })

    // TODO: RPI audio Example

} else if (win) {
    let videoStreamer = null
    // server
    const startStreamer = () => {

        // prep video
        console.log('starting ffmpet')

        videoStreamer = spawn('ffmpeg', [
            '-framerate',
            '30',
            '-video_size',
            '640x480',
            '-f',
            'dshow',
            '-i',
            'video=HD Camera',
            '-vcodec',
            'libx264',
            '-vprofile',
            'baseline',
            '-b:v',
            '500k',
            '-bufsize',
            '600k',
            '-tune',
            'zerolatency',
            '-pix_fmt',
            'yuv420p',
            '-f',
            'rawvideo',
            '-',
        ])
        videoStreamer.on('close', () => {
            console.log('vs closed')
            videoStreamer = null
        })
        avcServer.setVideoStream(videoStreamer.stdout)
    }

    // OPTIONAL: start on connect
    avcServer.on('client_connected', () => {
        if (!videoStreamer) {
            startStreamer()
        }
    })


    // OPTIONAL: stop on disconnect
    avcServer.on('client_disconnected', () => {
        console.log('client disconnected')
        if (avcServer.clients.size < 1) {
            if (!videoStreamer) {
                console.log('ffmpeg not running')
                return
            }
            console.log('stopping ffmpeg')
            videoStreamer.stdin.write('q')
            setTimeout(() => {
                if (videoStreamer) {
                    videoStreamer.kill('SIGTERM')
                }
            }, 200)
        }
    })


    // audio
    let audioStreamer = null

    const startAudioStreamer = () => {
        audioStreamer = spawn('sox', [ '-c', channels.toString(), '-r', samplingRate.toString(), '-t', 'waveaudio', '0', '--buffer', '960', '-p' ])
        console.log('started sox')
        audioStreamer.stderr.on('data', d => console.log(d.toString()))
        audioStreamer.on('close', () => {
            audioStreamer = null
        })
        audioServer.setAudioStream(audioStreamer.stdout)
    }

    // OPTIONAL: start on connect
    audioServer.on('client_connected', () => {
        console.log('client_conneted')
        if (!audioStreamer) {
            startAudioStreamer()
        }
    })


    // OPTIONAL: stop on disconnect
    audioServer.on('client_disconnected', () => {
        console.log('client disconnected')
        if (audioServer.clients.size < 1) {
            if (!audioStreamer) {
                console.log('sox not running')
                return
            }
            console.log('stopping sox')
            audioStreamer.kill('SIGTERM')
        }
    })


} else {
// create the tcp sever that accepts a h264 stream and broadcasts it back to the clients
    this.tcpServer = net.createServer((socket) => {
    // set video stream
        socket.on('error', e => {
            console.log('video downstream error:', e)
        })
        avcServer.setVideoStream(socket)

    })
    this.tcpServer.listen(5000, '0.0.0.0')

    this.tcpServer = net.createServer((socket) => {
        // set video stream
        socket.on('error', e => {
            console.log('video downstream error:', e)
        })
        audioServer.setVideoStream(socket)

    })
    this.tcpServer.listen(5001, '0.0.0.0')
}

server.listen({ port: 8081, host: '0.0.0.0' }, e => console.log(server.address()))

// if not using raspivid option than use one of this to stream
// ffmpeg OSX
// then run ffmpeg: ffmpeg -framerate 30 -video_size 640x480 -f avfoundation -i 0  -vcodec libx264 -vprofile baseline -b:v 500k -bufsize 600k -tune zerolatency -pix_fmt yuv420p -r 15 -g 30 -f rawvideo tcp://localhost:5000

// fmpeg Windows:

// ffmpeg -framerate 25 -video_size 640x480 -f dshow -i "video=<DEVICE>"  -vcodec libx264 -vprofile baseline -b:v 500k -bufsize 600k -tune zerolatency -pix_fmt yuv420p -f rawvideo tcp://localhost:5000

// to get video devices run:
// ffmpeg -list_devices true -f dshow -i dummy

// To get options of the device:
// ffmpeg -f dshow -list_options true -i video="<Device>"


// examples:
// ffmpeg -framerate 25 -video_size 640x480 -f dshow -i video="HD Camera"  -vcodec libx264 -vprofile baseline -b:v 500k -bufsize 600k -tune zerolatency -pix_fmt yuv420p -f rawvideo tcp://localhost:5000

// ffmpeg -framerate 25 -video_size 1280x720 -f dshow -i "video=Logitech HD Webcam C270"  -vcodec libx264 -vprofile baseline -b:v 500k -bufsize 600k -tune zerolatency -pix_fmt yuv420p -f rawvideo tcp://localhost:5000
// ffmpeg.exe -framerate 30 -video_size 1280x720 -f dshow -i video="HD Camera"  -vcodec libx264 -vprofile baseline -b:v 2m -bufsize 2m -pass 1 -coder 0 -bf 0 -flags -loop -tune zerolatency -pix_fmt yuv420p -wpredp 0 -f rawvideo tcp://localhost:5000
// RPI
// /opt/vc/bin/raspivid -pf baseline -ih -t 0 -w 640 -h 480 -hf -fps 15 -g 30 -o - | nc localhost 5000
