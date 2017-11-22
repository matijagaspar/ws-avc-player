'use strict'

import Avc from 'broadway/Decoder'
import YUVWebGLCanvas from 'canvas/YUVWebGLCanvas'
import YUVCanvas from 'canvas/YUVCanvas'
import Size from 'utils/Size'
import { EventEmitter } from 'events'

import debug from 'debug' // ?? why?


const log = debug('wsavc')
class WSAvcPlayer extends EventEmitter {
    constructor (canvas, canvastype) {
        super()
        this.canvas = canvas
        this.canvastype = canvastype
        // AVC codec initialization
        this.avc = new Avc()
        // TODO: figure out why this was here
        /* if (false) this.avc.configure({
            filter: 'original',
            filterHorLuma: 'optimized',
            filterVerLumaEdge: 'optimized',
            getBoundaryStrengthsA: 'optimized',
        }) */

        // WebSocket variable
        this.ws
        this.pktnum = 0

    }


    decode (data) {
        let naltype = 'invalid frame'
        // TODO fix type recog: const frameType = data[0] & 0x1f
        /*
        0      Unspecified                                                    non-VCL
        1      Coded slice of a non-IDR picture                               VCL
        2      Coded slice data partition A                                   VCL
        3      Coded slice data partition B                                   VCL
        4      Coded slice data partition C                                   VCL
        5      Coded slice of an IDR picture                                  VCL
        6      Supplemental enhancement information (SEI)                     non-VCL
        7      Sequence parameter set                                         non-VCL
        8      Picture parameter set                                          non-VCL
        9      Access unit delimiter                                          non-VCL
        10     End of sequence                                                non-VCL
        11     End of stream                                                  non-VCL
        12     Filler data                                                    non-VCL
        13     Sequence parameter set extension                               non-VCL
        14     Prefix NAL unit                                                non-VCL
        15     Subset sequence parameter set                                  non-VCL
        16     Depth parameter set                                            non-VCL
        17..18 Reserved                                                       non-VCL
        19     Coded slice of an auxiliary coded picture without partitioning non-VCL
        20     Coded slice extension                                          non-VCL
        21     Coded slice extension for depth view components                non-VCL
        22..23 Reserved                                                       non-VCL
        24..31 Unspecified                                                    non-VCL

        */
        if (data.length > 4) {
            if (data[4] === 0x65) {
                naltype = 'I frame'
            }
            else if (data[4] === 0x41) {
                naltype = 'P frame'
            }
            else if (data[4] === 0x67) {
                naltype = 'SPS'
            }
            else if (data[4] === 0x68) {
                naltype = 'PPS'
            }
        }
        log(`Passed ${ naltype } to decoder ${ data[4] & 0x1f }`)
        this.avc.decode(data)
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


        let framesList = []

        this.ws.onmessage = (evt) => {

            if (typeof evt.data == 'string') {
                return this.cmd(JSON.parse(evt.data))
            }

            this.pktnum++
            const frame = new Uint8Array(evt.data)
            // log("[Pkt " + this.pktnum + " (" + evt.data.byteLength + " bytes)]");
            // this.decode(frame);
            framesList.push(frame)
        }


        let running = true

        const shiftFrame = function () {
            if (!running)
                return


            if (framesList.length > 10) {
                log('Dropping frames', framesList.length)
                framesList = []
            }

            const frame = framesList.shift()


            if (frame)
                this.decode(frame)

            requestAnimationFrame(shiftFrame)
        }.bind(this)


        shiftFrame()


        this.ws.onclose = () => {
            running = false
            this.emit('disconnected')
            log('WSAvcPlayer: Connection closed')
        }

        return this.ws
    }

    initCanvas (width, height) {
        const canvasFactory = this.canvastype === 'webgl' || this.canvastype === 'YUVWebGLCanvas'
            ? YUVWebGLCanvas
            : YUVCanvas

        const canvas = new canvasFactory(this.canvas, new Size(width, height))
        this.avc.onPictureDecoded = canvas.decode

        this.canvas.width = width
        this.canvas.height = height


    }

    cmd (cmd) {
        log('Incoming request', cmd)
        switch (cmd.action) {
        case 'initalize': {
            const { width, height } = cmd.payload
            this.initCanvas(width, height)
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

module.exports = WSAvcPlayer
module.exports.debug = debug