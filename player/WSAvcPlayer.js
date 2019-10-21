'use strict'

const Player = require('Broadway/Player')
const { EventEmitter } = require('events')
const debug = require('debug')

const log = debug('wsavc')
class WSAvcPlayer extends EventEmitter {
    constructor ({ useWorker, workerFile } = {}) {

        super()
        // this.canvas = canvas
        // this.canvastype = canvastype
        this.now = new Date().getTime()

        this.AvcPlayer = new Player({
            useWorker,
            workerFile,
            size: {
                width: 640,
                height: 368,
            },
        })
        this.width = 1280
        this.height = 1024
        this.AvcPlayer.onPictureDecoded = (_, w, h) => {
            if (w !== this.width || h !== this.height) {
                this.emit('resized', { width: w, height: h })
                this.width = w
                this.height = h
            }
        }

        this.ws
        this.pktnum = 0
        this.framesList = []
        this.running = false
        this.shiftFrameTimeout = null
    }

    shiftFrame = () => {
        if (!this.running)
            return


        if (this.framesList.length > 30) {
            log('Dropping frames', this.framesList.length)
            const vI = this.framesList.findIndex(e => (e[4] & 0x1f) === 7)
            // console.log('Dropping frames', framesList.length, vI)
            if (vI >= 0) {
                this.framesList = this.framesList.slice(vI)
            }
            // framesList = []
        }

        const frame = this.framesList.shift()
        this.emit('frame_shift', this.framesList.length)

        if (frame)
            this.AvcPlayer.decode(frame)

        requestAnimationFrame(this.shiftFrame)
        // this.shiftFrameTimeout = setTimeout(this.shiftFrame, 1)
    }


    connect (url) {

        // Websocket initialization
        if (this.ws !== undefined) {
            this.ws.close()
            delete this.ws
        }
        this.ws = new WebSocket(url)
        this.ws.binaryType = 'arraybuffer'

        this.ws.onopen = () => {
            log('Connected to ' + url)
            this.emit('connected', url)
        }


        this.framesList = []


        this.ws.onmessage = (evt) => {

            if (typeof evt.data == 'string') {
                return this.cmd(JSON.parse(evt.data))
            }

            this.pktnum++
            const frame = new Uint8Array(evt.data)
            // log("[Pkt " + this.pktnum + " (" + evt.data.byteLength + " bytes)]");
            // this.decode(frame);
            this.framesList.push(frame)
            if (!this.running ) {
                this.running = true
                clearTimeout(this.shiftFrameTimeout)
                this.shiftFrameTimeout = null
                this.shiftFrameTimeout = setTimeout(this.shiftFrame, 1)
            }
        }


        this.ws.onclose = () => {
            this.running = false
            this.emit('disconnected')
            log('WSAvcPlayer: Connection closed')
        }

        return this.ws
    }

    cmd (cmd) {
        log('Incoming request', cmd)
        switch (cmd.action) {
        case 'initalize': {
            const { width, height } = cmd.payload
            // this.initCanvas(width, height)
            return this.emit('initalized', cmd.payload)

        }
        default:
            return this.emit(cmd.action, cmd.payload)
        }
    }

    disconnect () {
        this.ws.close()

    }
    // only send json!
    send (action, payload) {
        return this.ws.send(JSON.stringify({ action, payload }))
    }
}
export default WSAvcPlayer

// module.exports = WSAvcPlayer
// module.exports.debug = debug