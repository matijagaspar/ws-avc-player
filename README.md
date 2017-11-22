
Video player for browser that is able to play realtime low latency h264 video stream from websocket.
 Based of [h264-live-player](https://github.com/131/h264-live-player) that uses [Broadway](https://github.com/mbebenita/Broadway) decoder. Ideal for for Raspberry pi cam streaming.

# Usage
 * Server: [example/index.js](example/index.js)
 * Client: [example/html/index.html](example/html/index.html)

# Running the demo
```
git clone https://github.com/matijagaspar/ws-avc-player
cd ws-avc-player
npm install
npm run example

# browse to http://127.0.0.1:8080/ for a demo player

```
then run

`ffmpeg -framerate 30 -video_size 640x480 -f [driver] -i [device]  -vcodec libx264 -vprofile baseline -b:v 500k -bufsize 600k -tune zerolatency -pix_fmt yuv420p -r 15 -g 30 -f rawvideo tcp://localhost:5000`

or

`raspivid -t 0 -w 640 -h 480 -hf -fps 15 -o - | nc localhost 5000`

to stream 

# TODO:
 * More docs
 * More cleanup
 * Audio
 * Ability to change video resolution or better parse sps/pps
 
# Credits
* [matijagaspar](https://github.com/matijagaspar)
* [h264-live-player](https://github.com/131/h264-live-player)
* [Broadway](https://github.com/mbebenita/Broadway)
* [urbenlegend/WebStreamer](https://github.com/urbenlegend/WebStreamer)
