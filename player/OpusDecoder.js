// import opusscript from 'opusscript/build/opusscript_native_wasm'
// import opusscriptModule from 'opusscript/build/opusscript_native_wasm.wasm'
// // const opusscript = require('opusscript')
// opusscript_native_wasm = require('./build/opusscript_native_wasm.js')({locateFile (path) { if (path.endsWith('.wasm')) { return require('opusscript/build/opusscript_native_wasm.wasm') } return path }})
const opusscript = require('opusscript')
self.onmessage = function ({ data: { type, topic, payload } }) {
    // console.log('got message!')
    // console.log('got message', topic)
    switch (topic) {
    case 'init': {
        if (self.decoder) {
            self.decoder.delete()
            self.decoder = null
        }
        const { rate, channels } = payload
        self.decoder = new opusscript(rate, channels, opusscript.Application.VOIP)
        self.postMessage({ type: 'initialized' })
        break
    }
    case 'destroy': {
        if (self.decoder) {
            self.decoder.delete()
            self.decoder = null
        }
        break
    }
    case 'decode':
    default: {
        if (!self.decoder) {
            // not yet initialized, skip
            return
        }
        const decData = self.decoder.decode(Buffer.from(payload))
        self.postMessage({ type: 'decode', payload: decData }, [ decData.buffer ])
    }
    }
}