const { EventEmitter } = require('events')
const PCMPlayer = require('./utils/PCMPlayer')
class WSAudioPlayer extends EventEmitter {
    constructor (channels = 1, sampleRate = 48000, options = {}) {
        const { audioDecoderPath, ...playerOpts } = options
        super()
        this.player = new PCMPlayer({
            encoding: '32bitInt',
            channels,
            sampleRate,
            flushingTime: 20,
            ...playerOpts,
        })
        this.worker = new Worker(audioDecoderPath || 'OpusDecoder.js')


        this.worker.addEventListener('message', ({ data: { type, payload } }) => {
            if (type === 'decode') {
                this.player.feed(payload)
            } else if (type === 'initialized') {
                this.emit( 'opus_worker_initialized')
            }
        })
        this.worker.postMessage({
            topic: 'init',
            payload: {
                rate: sampleRate,
                channels,
            },
        })

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
            // log('Connected to ' + url)
            this.emit('connected', url)
        }


        this.framesList = []


        this.ws.onmessage = (evt) => {
            // console.log('got msg')
            if (typeof evt.data == 'string') {
                // console.log(evt.data)
                return this.emit(JSON.parse(evt.data))
            } else {
                // console.log('posting to worker')
                // console.log(evt)
                // const payload = Buffer.from(evt.data)
                // console.log(evt.data)
                this.worker.postMessage({ payload: evt.data }, [ evt.data ])
            }
        }


        this.ws.onclose = () => {
            this.running = false
            this.emit('disconnected')
            // log('WSAvcPlayer: Connection closed')
        }

        return this.ws
    }

}

export default WSAudioPlayer
// class OpusWorker extends Event {
//     constructor (channels, sampleRate, audioDecoderPath = 'OpusDecoder.js' ) {
//         super()
//         _this.worker = new Worker(audioDecoderPath)
//         this.worker.addEventListener('message', )
//     }
// }

// const OpusWorker = (function (_Event) {
//     inherits(OpusWorker, _Event)

//     function OpusWorker (channels, libopusPath) {
//         classCallCheck(this, OpusWorker)

//         let _this = possibleConstructorReturn(this, (OpusWorker.__proto__ || Object.getPrototypeOf(OpusWorker)).call(this, 'worker'))

//         _this.worker = new Worker(libopusPath)
//         _this.worker.addEventListener('message', _this.onMessage.bind(_this))
//         _this.worker.postMessage({
//             type: 'init',
//             config: {
//                 rate: 48000,
//                 channels: channels,
//             },
//         })
//         return _this
//     }

//     createClass(OpusWorker, [{
//         key: 'getSampleRate',
//         value: function getSampleRate () {
//             return 48000
//         },
//     }, {
//         key: 'decode',
//         value: function decode (packet) {
//             const workerData = {
//                 type: 'decode',
//                 buffer: packet,
//             }
//             this.worker.postMessage(workerData)
//         },
//     }, {
//         key: 'onMessage',
//         value: function onMessage (event) {
//             const data = event.data
//             this.dispatch('data', data.buffer)
//         },
//     }, {
//         key: 'destroy',
//         value: function destroy () {
//             this.worker = null
//             this.offAll()
//         },
//     }])
//     return OpusWorker
// }(Event))