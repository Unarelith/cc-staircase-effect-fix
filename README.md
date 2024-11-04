# CrossCode: Staircase Effect fix

This mod aims to fix the staircase effect that can be seen on the background when the player is moving diagonally.

[Without](https://www.youtube.com/watch?v=hD7URVK7JxI) - [With](https://www.youtube.com/watch?v=4fN0hv-uQDo)
(stutter comes from the recording)

## Features

- Camera smoothing (customizable smoothing factor and threshold)
- Timer precision improvement

Recommended smoothing factor:
- 720p: 0.45
- 1080p: 0.45 <-> 0.3
- 1440p: 0.3 <-> 0.15
- 4k: probably 0.15

**Warning:** With a low factor camera will be smoothed a lot.

I played a lot at 0.45 on my Steam Deck and it was great, but on my 1440p monitor 0.45 wasn't enough.

## Details

The issue appears on the background when moving diagonally: https://www.youtube.com/watch?v=hD7URVK7JxI (video is 1440p).
There's also a lot of stutter (some due to the video, some aren't due to the video).
I noticed on my Steam Deck that the FPS didn't drop during those stutter, so it had to be something else. 

I searched through the code and noticed that physics were done based on a delta time.
It isn't usually an issue, but in pixel art games, movement needs to be at constant speed through pixels, otherwise it isn't smooth, which explains the stutter.

Usually games would have a few ways of fixing this:
- **Rounding:** It's possible to fix rounding depending on the movement using this method: https://gamedev.stackexchange.com/a/18801
- **Fixed step:** Instead of using the delta time every frame to compute all the physics, we could use a fixed update step (once every 16 ms for example)
- **Camera smoothing:** Another way to fix uneven movement without messing with the physics nor the update loop.

In CrossCode, this problem has been completely ignored and the full diagonal speed of the player is (2.12, 2.12) which comes from base speed 3 / sqrt(2).
But this speed isn't constant since it's multiplied by the delta time every frame, which varies a lot from 12 to 18 ms, causing irregularities and thus, stutter.

In order to fix it, I tried the rounding approach but it broke too many things.
I still kept it as a reference and it's possible to enable it in the mod settings (all the other checkboxes must be disabled, though).

I tried to apply rounding to the camera position but it didn't work, it actually made things worse.
The only way to make it "work" was to accumulate the corrections in a variable and apply it to the player position before computing the new position
...which desynchronized camera from player over time.

Camera smoothing was the way to go, it took me a while to get the right settings but now it's fixing the issue with only a little downside: camera lags slightly behind the player.
The smoothing factor can be changed in the settings to increase/reduce this effect.
