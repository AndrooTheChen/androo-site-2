---
title: "fixing my site and stealing christian music"
date: "2023-03-13"
author: "androo"
legacy_id: "1678690800"
---

Fixed my site after I accidentally broke it last month when trying to make the repo private. I made the repo public again, but I think the thing that actually broke it was that in the "Settings" tab of my repo the GH Pages branch was set to deploy from branch `None` instead of `gh-pages`. Might play around with trying to make this repo private again just so my coworkers don't go snooping and finding these random notes to see how much I suck at coding.

On to the other part of this title -- this sermon from TCPC Open Worship had the most BEAUTIFUL sounding performance for O Come to the Alter. The sad part is I don't even know who the singer is. Since I couldn't find a better version of it on Spotify, thought the only appropriate thing to do here was:
-  use `pytube` to download the [YT sermon video](https://www.youtube.com/watch?v=ZM7-EwfJbpg) as an MP4
- convert to MP3 using FFMPEG: `ffmpeg -i sermon.mp4 -vn -acodec libmp3lame -qscale:a 0 sermon.mp3` 
   - description of the fields from ChatGPT:  The -ss option specifies the start time of the crop (in this case, 30 seconds), and the -to option specifies the end time of the crop (in this case, 60 seconds). The -c:a copy option tells FFmpeg to copy the audio codec instead of re-encoding it.
- trim the video `ffmpeg -i sermon.mp3 -ss 1:17:34 -to 1:24:06 -c:a copy come_to_the_alter.mp3`
    - description of fields from ChatGPT: The -vn option tells FFmpeg to disable video recording, and the -acodec libmp3lame option specifies the audio codec to be used for the MP3 file. The -qscale:a option specifies the audio quality, where 0 is the best and 9 is the worst, and in this example, 2 is used.

It's a real shame TCPC OW stopped doing sermon livestreams (honest note here)... I really did like their sermons but I understand their mission to try and grow the church in person. Wish them the best and hope someday to maybe even visit them.

One last thing: when updating the posts for this website I have to remember to run `node public/main.js` to generate the JSON blobs for each page. What stumped me for like 30 FREAKING MINUTES THO was that this kept failing because it kept trying to parse the hidden file `.DS_Store` that's auto-generated on Macs...