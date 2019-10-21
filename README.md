
Stream realtime h264 video directly to the browser.
Comes with a browser player, and streaming server.
 Based of [h264-live-player](https://github.com/131/h264-live-player) that uses [Broadway](https://github.com/mbebenita/Broadway) decoder. Ideal for for Raspberry pi cam streaming.

# Usage

## Server:

 ```js
 const AvcServer = require('ws-avc-player/lib/server')
 const WebSocketServer = require('uws').Server
 const wss = new WebSocketServer({ port: 3333 })
 const avcServer = new AvcServer(wss, 640, 480)

 avcServer.setVideoStream(h264Stream)
 ```
More detailed in [example/index.js](example/index.js) 

## Client: 

```html
<html>
  <body>
    <!-- define the canvas -->
    <canvas id='cam' style="width:100%; height:75vw;">
    <!-- provide WSAvcPlayer -->
    <script type="text/javascript" src="lib/WSAvcPlayer.js" />
    <script type="text/javascript">
      var canvas = document.getElementById('cam')
      // Create h264 player
      var wsavc = new WSAvcPlayer(canvas, "webgl", 1, 35);

      wsavc.connect("ws://" + document.location.host+":3333");
    </script>    
  </body>
</html>
```

More detailed in [example/html/index.html](example/html/index.html)

# Running the demo
```bash
git clone https://github.com/matijagaspar/ws-avc-player
cd ws-avc-player
npm install
npm run example

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
npm run example raspivid
```
It will automatically run raspivid too

## Using it in your own project

`yarn add ws-avc-player`

### On Client
* `import WSAvcPlayer from 'ws-avc-player'`
* ``` 
        const wsavc = new WSAvcPlayer({useWorker:true})
        wsavc.connect(serverUrl);

  ```
###  On Server:

* See `example/index.js`




# TODO:
 * ~Decoder as worker~
 * More docs
 * More cleanup
 * Audio
 * ~Ability to change video resolution or better parse sps/pps~
 * ~Decent performance~
 
# Credits
* [matijagaspar](https://github.com/matijagaspar)
* [h264-live-player](https://github.com/131/h264-live-player)
* [Broadway](https://github.com/mbebenita/Broadway)
* [urbenlegend/WebStreamer](https://github.com/urbenlegend/WebStreamer)
