import React, { useEffect, useRef, useState } from "react";
import { hightlightsSlides } from "../constants";
import gsap from "gsap";
import { pauseImg, playImg, replayImg } from "../utils";
import { useGSAP } from "@gsap/react";

const VideoCarousel = () => {
  const videoRef = useRef([]); // will contain the refs of all the video elements, it means: videoRef.current = [] (we can access the elements using videoRef.current[any_index])
  const videoDivRef = useRef([]); // animation dots
  const videoSpanRef = useRef([]); // video duration animation  (inside the animation dots)

  const [video, setVideo] = useState({
    isEnd: false,
    startPlay: false,
    videoId: 0, // to keep track of the video that is currently being played
    isLastVideo: false,
    isPlaying: false,
  });

  // when the video's metadata will be rendered, that metadatas will be stored inside this
  const [loadedData, setLoadedData] = useState([]);

  const { isEnd, isLastVideo, startPlay, videoId, isPlaying } = video;

  // it's to animate the video when new video comes or the end video comes
  useGSAP(() => {
    gsap.to("#slider", {
      transform: `translateX(${-100 * videoId}%)`,
      duration: 2,
      ease: "power2.inOut",
    });

    gsap.to("#video", {
      scrollTrigger: {
        trigger: "#video",
        toggleActions: "restart none none none", // onEnter onLeave onEnterBack onLeaveBack
      },
      onComplete: () => {
        setVideo((prevVideo) => ({
          ...prevVideo,
          startPlay: true,
          isPlaying: true,
        }));
      },
    });
  }, [isEnd, videoId]);

  // will see this TODO:
  useEffect(() => {
    if (loadedData.length > 3) {
      if (!isPlaying) {
        videoRef.current[videoId].pause();
      } else {
        startPlay && videoRef.current[videoId].play();
      }
    }
  }, [startPlay, videoId, isPlaying, loadedData]);

  // will add the video's metadata once the video is rendered
  const handleLoadedMetadata = (i, e) => setLoadedData((pre) => [...pre, e]);

  /////////////////////////////
  // This useEffect will animate the active navigation dot like a progress bar

  useEffect(() => {
    let currentProgress = 0;
    let span = videoSpanRef.current;

    if (span[videoId]) {
      // instead of setting the target element as span[videoId], I could have set any element as target as we are doing nothing with this.
      let anim = gsap.to(span[videoId], {
        // the function will be called for each updation of the animation
        onUpdate: () => {
          // anim.progress() wil be from 0 to 1, so we have to multiply this with 100
          const progress = Math.ceil(anim.progress() * 100);

          if (progress != currentProgress) {
            currentProgress = progress;

            // It'll increase the outer layer of the navigation dot (with it's default color)
            // NOTE : It will not show the progress of the video, rather it just a animation that starts from 0 and end at 100% in a default time duration (navigation dot)
            gsap.to(videoDivRef.current[videoId], {
              width:
                window.innerWidth < 760
                  ? "10vw"
                  : window.innerWidth > 1200
                  ? "10vw"
                  : "4vw",
            });

            // It'll increase the inner layer of the navigation dot in while color (which seem like a progress bar)
            gsap.to(span[videoId], {
              width: `${currentProgress}%`,
              backgroundColor: "white",
            });
          }
        },
        // duration: 3, // we won't give any duration, will keep it default
        onComplete: () => {
          if (isPlaying) {
            gsap.to(videoDivRef.current[videoId], {
              width: "12px",
            });

            gsap.to(span[videoId], {
              backgroundColor: "#afafaf",
            });
          }
        },
      });

      if (videoId === 0) {
        console.log("helllo restarting");
        anim.restart();
      }
      // it runs on every clock tick of the animation
      // NOTE: this will sync the navigation dot slider with the video duration
      const animUpdate = () => {
        anim.progress(
          videoRef.current[videoId].currentTime /
            hightlightsSlides[videoId].videoDuration
        );
      };

      if (isPlaying) {
        gsap.ticker.add(animUpdate);
      } else {
        gsap.ticker.remove(animUpdate);
      }
    }
  }, [videoId, , startPlay]);
  // NOTE : The outer gsap is nothing but a progress tracker. The animation of the outer navigation dot layer and inner navigation layer.
  //////////////////////////////////

  const handleProcess = (type, i) => {
    switch (type) {
      // means the current video is end
      case "video-end":
        setVideo((prevVideo) => ({
          ...prevVideo,
          isEnd: true,
          videoId: i + 1,
        }));
        break;
      case "video-last":
        setVideo((prevVideo) => ({ ...prevVideo, isLastVideo: true }));
        break;
      case "video-reset":
        setVideo((prevVideo) => ({
          ...prevVideo,
          isLastVideo: false,
          videoId: 0,
        }));
        break;
      case "play":
        setVideo((prevVideo) => ({
          ...prevVideo,
          isPlaying: !prevVideo.isPlaying,
        }));
        break;
      default:
        return video;
    }
  };

  return (
    <>
      <div className="flex items-center">
        {hightlightsSlides.map((list, i) => (
          <div key={list.id} id="slider" className="sm:pr-20 pr-10">
            <div className="video-carousel_container">
              <div className="w-full h-full flex-center rounded-3xl overflow-hidden bg-black">
                <video
                  id="video"
                  playsInline={true}
                  preload="auto"
                  muted
                  ref={(el) => (videoRef.current[i] = el)} // we can also pass callback function inside the ref
                  onEnded={() => {
                    i !== 3
                      ? handleProcess("video-end", i)
                      : handleProcess("video-last");
                  }}
                  onPlay={() => {
                    setVideo((prevVideo) => ({
                      ...prevVideo,
                      isPlaying: true,
                    }));
                  }}
                  onLoadedMetadata={(e) => handleLoadedMetadata(i, e)}
                >
                  <source src={list.video} type="video/mp4" />
                </video>
                <div className="absolute top-12 left-[5%] z-10">
                  {list.textLists.map((text) => (
                    <p key={text} className="md:text-2xl text-xl font-medium">
                      {text}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative flex-center mt-10">
        <div className="flex-center py-5 px-7 bg-gray-300 backdrop-blur rounded-full">
          {videoRef.current.map((_, i) => (
            <span // This span is the outer layer of the navigation dots
              key={i}
              ref={(el) => (videoDivRef.current[i] = el)}
              className="mx-2 w-3 h-3 bg-gray-300 rounded-full relative cursor-pointer"
            >
              <span // This span is the inner layer of the dot that will animate from width=0 to width=100% to show the progress of the video
                className="absolute h-full w-full rounded-full"
                ref={(el) => (videoSpanRef.current[i] = el)}
              />
            </span>
          ))}
        </div>
        <button className="control-btn">
          <img
            src={isLastVideo ? replayImg : !isPlaying ? playImg : pauseImg}
            alt={isLastVideo ? "replay" : !isPlaying ? "play" : "pause"}
            onClick={
              isLastVideo
                ? () => handleProcess("video-reset")
                : !isPlaying
                ? () => handleProcess("play")
                : () => handleProcess("pause")
            }
          />
        </button>
      </div>
    </>
  );
};

export default VideoCarousel;
