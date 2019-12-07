
Stream realtime low-latency h264 video directly to the browser.
Comes with a browser player, and streaming server.
 Uses [Broadway](https://github.com/mbebenita/Broadway) browser decoder and player. Ideal for for Raspberry pi cam streaming.

# Usage

## Server:

### Video
 ```js
 const AvcServer = require('ws-avc-player/lib/avcServer')
 const { WebSocketServer } = require('@clusterws/cws') // works with ws, legacy uws
 const wss = new WebSocketServer({ port: 3333, path:'video' })
 const avcServer = new AvcServer(wss, 640, 480) //initial width and height (it adapts to the stream)

 avcServer.setVideoStream(h264Stream)
 ```

 ### Audio
 ```js
 const AudioServer = require('ws-avc-player/lib/audioServer')
 const { WebSocketServer } = require('@clusterws/cws') // works with ws, legacy uws
 const wss = new WebSocketServer({ port: 3333, path:'audio' })
 const samplingRate = 48000
const channels = 1
const frameDuration = 20
const audioServer = new AudioServer(wss, samplingRate, frameDuration, channels)

audioServer.setVideoStream(pcm16LEStream)
 ```
More detailed in [example/index.js](example/index.js)  and  [example/audioVideoServer.js](example/audioVideoServer.js) 

## Client: 


## Video
```html
<html>
  <body>
    <!-- define the element to hold the canvas -->
     <div id="video-box" />
    <!-- provide WSAvcPlayer -->
    <script type="text/javascript" src="WSAvcPlayer.js" />
    <script type="text/javascript">
      //initialize the player, if useWorker: true, than you must have `/Decoder.js` availible at the root of the domain.
      var wsavc = new WSAvcPlayer.default({useWorker:false}); 
      //append the canvas to the box element, you can style the box element and canvas.
      document.getElementById('video-box').appendChild(wsavc.AvcPlayer.canvas)
      //connect to the websocket
      wsavc.connect("ws://" + document.location.host+"video");
    </script>    
  </body>
</html>
```
## Audio
```html
    <script type="text/javascript" src="WSAudioPlayer.js">
    <script type="text/javascript">
      //initialize the player
      var channels = 1; //must match server
      var sampleRate = 48000; //must match server
         var wsaaudio = new WSAudioPlayer.default(channels, sampleRate);

      var uri = "ws://" + document.location.host + "/audio";
      wsaaudio.on("opus_worker_initialized", () => {
        wsaaudio.connect(uri);
      });
    </script>    
```

More detailed in [example/html/index.html](example/html/index.html) or [example/html/audioVideo.html](example/html/audioVideo.html)

# Running the demo
```bash
git clone https://github.com/matijagaspar/ws-avc-player
cd ws-avc-player
yarn
yarn example 
# or 
yarn example exampleAV #for audio and video support

# browse to http://127.0.0.1:8080/ for a demo player
```
then run

```bash
ffmpeg -framerate 30 -video_size 640x480 -f [driver] -i [device]  -vcodec libx264 -vprofile baseline -b:v 500k -bufsize 600k -tune zerolatency -pix_fmt yuv420p -r 15 -g 30 -f rawvideo tcp://localhost:5000
```

or
```bash
raspivid -t 0 -w 640 -h 480 -hf -fps 15 -o - | nc localhost 5000
```

alternatively run:
```bash
npm run exampleAV raspivid|win
```
It will automatically run raspivid+arecord or ffmpet+sox. For `win` you will probably need to tweak the input parameter.

## Using it in your own project

`yarn add ws-avc-player`

### On Client

#### Video
* `import WSAvcPlayer from 'ws-avc-player'`
* ``` 
        const wsavc = new WSAvcPlayer({useWorker:true})
        wsavc.connect(serverUrl);

  ```

### Audio 
* `import WSAvcPlayer from 'ws-avc-player/lib/WSAudioPlayer'`
* ``` 
        const channels = 1 //must match server config
        const sampleRate = 48000 // must match server config
        const wsaaudio = new WSAudioPlayer.default(channels, sampleRate);
        wsaaudio.connect(serverAudioUrl)
  ```
* Depending on the browser and user settings, you might need to set up a button that enabales audio output on the browser:
 ```
//js
const onButtonClick = ()=>{
        let context = new (window.AudioContext || window.webkitAudioContext)();
          context.resume().then(() => {
        });
}
// html
<button onclick="onbuonButtonClick">Turn audio on</button>
```

###  On Server:

* See `example/index.js` for video only
* See `example/audioVideoServer.js` for audio and video

# Notes

### Audio Video Sync
Audio support still lacks some important features, mainly there is nothing in this library to get audio and video in sync. Audio and Video are completly separate websocket channels. You could tweak video/audio buffer sizes on server to roughly match the sync and it should work ok in most cases. In the future I plan to add timestamps to audio and video packets to allow sync playback (will require some jitter buffer, meaning larger latency so it will be an optional feature)

### Why 2 WebSockets

The reason for 2 separate WebSockets, one for video and one for audio, is because audio and video have differen "frame rates" or "clock rates", since WS is a reliable channel, that will enforce packet order, using a single WS would make audio-video sync even worse. Any attempt to fix it will require additinal larger buffers.

### Audio server cpu usage
Current implemtation of audio decoder on server is syncronous, meaing it blocks the event loop and everything else. I did not encouter major issues yet, but a good practice would be to run the audio server as separate node instance or worker thread. I left this part out because ideally I would like to use Worker Threads but they are still experimental in node 10.

# Advance use

## Custom server
### Video:
If you plan to use a different server, than the one provided, for the player to be able to correctly decode the stream, each packet comming over WS must be it's own NAL frame. This means that you hmust split the stream on the custom server into chunk starting wtih the NAL special code.
### Audio:
The client side player expects each message to be a raw opus stream. Again split the stream on the server accordingly

## Custom events/messges
`TODO`




# TODO:
 * ~Decoder as worker~
 * Refactor docs and example to reduce complexity
 * More cleanup
 * ~Audio~
 * ~Ability to change video resolution or better parse sps/pps~
 * ~Decent performance~
 
# Credits
* [matijagaspar](https://github.com/matijagaspar)
* [h264-live-player](https://github.com/131/h264-live-player)
* [Broadway](https://github.com/mbebenita/Broadway)
* [urbenlegend/WebStreamer](https://github.com/urbenlegend/WebStreamer)
