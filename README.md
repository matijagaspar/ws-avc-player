
Stream realtime low-latency h264 video directly to the browser.
Comes with a browser player, and streaming server.
 Uses [Broadway](https://github.com/mbebenita/Broadway) browser decoder and player. Ideal for for Raspberry pi cam streaming.

# Usage

## Server:

 ```js
 const AvcServer = require('ws-avc-player/lib/server')
 const { WebSocketServer } = require('@clusterws/cws') // works with ws, legacy uws
 const wss = new WebSocketServer({ port: 3333 })
 const avcServer = new AvcServer(wss, 640, 480) //initial width and height (it adapts to the stream)

 avcServer.setVideoStream(h264Stream)
 ```
More detailed in [example/index.js](example/index.js) 

## Client: 

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
