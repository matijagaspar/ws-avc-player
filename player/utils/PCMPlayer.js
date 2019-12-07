function PCMPlayer (option) {
    this.init(option)
}

PCMPlayer.prototype.init = function (option) {
    const defaults = {
        encoding: '16bitInt',
        channels: 1,
        sampleRate: 8000,
        flushingTime: 0,
    }
    this.option = Object.assign({}, defaults, option)
    this.samples = new Float32Array()
    this.flush = this.flush.bind(this)
    if (this.option.flushingTime) {
        this.interval = setInterval(this.flush, this.option.flushingTime)
    }
    this.maxValue = this.getMaxValue()
    this.typedArray = this.getTypedArray()
    this.createContext()
}

PCMPlayer.prototype.getMaxValue = function () {
    const encodings = {
        '8bitInt': 128,
        '16bitInt': 32768,
        '32bitInt': 2147483648,
        '32bitFloat': 1,
    }

    return encodings[this.option.encoding] ? encodings[this.option.encoding] : encodings['16bitInt']
}

PCMPlayer.prototype.getTypedArray = function () {
    const typedArrays = {
        '8bitInt': Int8Array,
        '16bitInt': Int16Array,
        '32bitInt': Int32Array,
        '32bitFloat': Float32Array,
    }

    return typedArrays[this.option.encoding] ? typedArrays[this.option.encoding] : typedArrays['16bitInt']
}

PCMPlayer.prototype.createContext = function () {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    this.gainNode = this.audioCtx.createGain()
    this.gainNode.gain.value = 1
    this.gainNode.connect(this.audioCtx.destination)
    this.startTime = this.audioCtx.currentTime
}

PCMPlayer.prototype.isTypedArray = function (data) {
    return data.byteLength && data.buffer && data.buffer.constructor === ArrayBuffer
}

PCMPlayer.prototype.feed = function (data) {
    if (!this.isTypedArray(data)) return
    data = this.getFormatedValue(data)
    const tmp = new Float32Array(this.samples.length + data.length)
    tmp.set(this.samples, 0)
    tmp.set(data, this.samples.length)
    this.samples = tmp
    if (!this.option.flushingTime) { // if flushing time is falsy than flush as soon as new data is fed
        this.flush()
    }
}

PCMPlayer.prototype.getFormatedValue = function (inputData) {
    const data = new this.typedArray(inputData.buffer)
    const float32 = new Float32Array(data.length)

    for (let i = 0; i < data.length; i++) {
        float32[i] = data[i] / this.maxValue
    }
    return float32
}

PCMPlayer.prototype.volume = function (volume) {
    this.gainNode.gain.value = volume
}

PCMPlayer.prototype.destroy = function () {
    if (this.interval) {
        clearInterval(this.interval)
    }
    this.samples = null
    this.audioCtx.close()
    this.audioCtx = null
}
const MAX_DELAY = 0.08
PCMPlayer.prototype.flush = function () {
    if (!this.samples.length) return

    let length = this.samples.length / this.option.channels,
        audioBuffer = this.audioCtx.createBuffer(this.option.channels, length, this.option.sampleRate),
        audioData,
        channel,
        offset,
        i,
        decrement

    const bufferSource = this.audioCtx.createBufferSource()

    for (channel = 0; channel < this.option.channels; channel++) {
        audioData = audioBuffer.getChannelData(channel)
        offset = channel
        decrement = 50
        for (i = 0; i < length; i++) {
            audioData[i] = this.samples[offset]
            /* fadein */
            // if (i < 50) {
            //     audioData[i] =  (audioData[i] * i) / 50;
            // }
            // /* fadeout*/
            // if (i >= (length - 51)) {
            //     audioData[i] =  (audioData[i] * decrement--) / 50;
            // }
            offset += this.option.channels
        }
    }
    if (this.startTime < this.audioCtx.currentTime) {
        this.startTime = this.audioCtx.currentTime
    }
    // console.log('start vs current '+this.startTime+' vs '+this.audioCtx.currentTime+' duration: '+audioBuffer.duration);
    bufferSource.buffer = audioBuffer
    bufferSource.connect(this.gainNode)
    // Crude prevention of lag accumulation, might produce audio some artefacts after connection suddenly resumes. Only works without flushing time set
    bufferSource.start(this.startTime)
    this.startTime += audioBuffer.duration
    
    if ( this.startTime - this.audioCtx.currentTime > MAX_DELAY && !this.option.flushingTime) {
        // catch up proportinally to the error, so the artificting is reduced
        this.startTime -= (this.startTime - this.audioCtx.currentTime ) * 0.2
    }


    this.samples = new Float32Array()
}

module.exports = PCMPlayer