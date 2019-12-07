const { EventEmitter } = require('events')

const pipe = (source, ...args) => args.reduce((acc, arg) => arg(acc), source)

const opusscript = require('opusscript')

// 48kHz sampling rate, 20ms frame duration, stereo audio (2 channels)


function spiltByFrame (frameSize) {
    return async function* (stream) {
        let buf = Buffer.alloc(frameSize)
        let offset = 0
        for await (const chunk of stream) {
            let chunkOffset = 0
            while (chunkOffset < chunk.length ) {


                const lengthToCopy = Math.min(buf.length - offset, chunk.length - chunkOffset )
                chunk.copy(buf, offset, chunkOffset, chunkOffset + lengthToCopy)

                offset += lengthToCopy
                chunkOffset += lengthToCopy

                if (offset >= buf.length ) {
                    yield buf
                    offset = 0
                    buf = Buffer.alloc(frameSize)
                }

            }
        }
    }
}

function encodeOpus (samplingRate, frameDuration, channels, application) {
    return async function* (iterable) {
        const encoder = new opusscript(samplingRate, channels, application)
        const frameSize = samplingRate * frameDuration / 1000
        for await (const chunk of iterable) {
            yield encoder.encode(chunk, frameSize)
        }
        encoder.delete()
    }
}


function sendFrame (socket, frame) {
    // if (socket.buzy)
    //     return

    // socket.buzy = true

    socket.send(frame, { binary: true })
}

module.exports = class WSAudioServer extends EventEmitter {
    // sampling rate must match the source sample rate, there is no resampling here
    constructor (wss, samplingRate, frameDuration, channels, options = {}) {
        super()
        this.options = {
            frameDuration: frameDuration || 20,
            samplingRate: samplingRate || 48000,
            channels: channels || 1,
            ...options,
        }

        this.clients = new Set()

        this.broadcast = this.broadcast.bind(this)
        this.new_client = this.new_client.bind(this)
        this.setAudioStream = this.setAudioStream.bind(this)

        this.client_events = new EventEmitter()
        if (wss) {
            wss.on('connection', this.new_client)
        }

    }

    setAudioStream (readStream) {
        if (this.readStream) {
            this.readStream.destroy()
        }
        this.readStream = readStream
        const streamProcessor = async () => {
            const { samplingRate, frameDuration, channels } = this.options
            const sampleByteSize = 16 / 8 // 16-bit Signed Integer PCM is 2 bytes
            this.broadcast('stream_active', true )
            for await (const data of pipe(
                this.readStream,
                spiltByFrame(sampleByteSize * samplingRate * frameDuration / 1000),
                encodeOpus(samplingRate, frameDuration, channels, opusscript.Application.VOIP),
            ))
            {
                this.broadcast(sendFrame)(data)
            }
        }

        streamProcessor().finally(() => {
            this.readStream.destroy()
            this.readStream = null
            this.broadcast('stream_active', false )
        })


    }

    broadcast (action, payload) {
        // callback mode
        // console.log('b')
        if (typeof action === 'function') {
            return data => this.clients.forEach(socket => action(socket, data))
        } else {
            return this.clients.forEach(socket => socket.send(JSON.stringify({ action, payload })))
        }
    }

    new_client (socket) {
        this.clients.add(socket)
        this.emit('client_connected', socket)
        socket.on('close', () => {
            this.clients.delete(socket)
            this.emit('client_disconnected', socket)
            // console.log(`currently there are ${ this.clients.size } connected clients`)
        })
        socket.send(JSON.stringify({
            action: 'initalize',
            payload: {
                width: this.options.width,
                height: this.options.height,
                stream_active: !!(this.readStream && this.readStream.readable),
            },
        }))

        socket.send(JSON.stringify({ action: 'stream_active', payload: !!(this.readStream && this.readStream.readable) }))

        socket.on('message', m => {
            const { action, payload } = JSON.parse(m)
            this.client_events.emit(action, payload)
        })

    }

}