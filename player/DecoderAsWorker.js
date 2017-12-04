
// TODO: finish one day..
class DecoderAsWorker {
    constructor (canvastype) {
        const webgl = canvastype === 'webgl'
        const raw_decode = require('raw-loader!broadway/Decoder')
        const smth = window.URL.createObjectURL( new Blob([ raw_decode ]))
        const worker = new Worker(smth)// '/Decoder.js')
        const reuseMemory = true
        const transferMemory = true


        this.worker = worker
        worker.addEventListener('message', (e) => {
            const data = e.data
            if (data.consoleLog) {
                console.log(data.consoleLog)
                return
            }

            this.onPictureDecoded.call(self, new Uint8Array(data.buf, 0, data.length), data.width, data.height, data.infos)

        }, false)

        worker.postMessage({ type: 'Broadway.js - Worker init', options: {
            rgb: !webgl,
            memsize: this.memsize,
            reuseMemory: reuseMemory ? true : false,
        } })

        if (transferMemory) {
            this.decode = function (parData, parInfo) {
            // no copy
            // instead we are transfering the ownership of the buffer
            // dangerous!!!

                worker.postMessage({ buf: parData.buffer, offset: parData.byteOffset, length: parData.length, info: parInfo }, [ parData.buffer ]) // Send data to our worker.
            }

        } else {
            this.decode = function (parData, parInfo) {
            // Copy the sample so that we only do a structured clone of the
            // region of interest
                const copyU8 = new Uint8Array(parData.length)
                copyU8.set( parData, 0, parData.length )
                worker.postMessage({ buf: copyU8.buffer, offset: 0, length: parData.length, info: parInfo }, [ copyU8.buffer ]) // Send data to our worker.
            }

        }

        if (reuseMemory) {
            this.recycleMemory = function (parArray) {
            // this.beforeRecycle();
                worker.postMessage({ reuse: parArray.buffer }, [ parArray.buffer ]) // Send data to our worker.
            // this.afterRecycle();
            }
        }
    }
}