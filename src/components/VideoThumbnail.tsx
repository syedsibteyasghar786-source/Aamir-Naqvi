import React, { useRef, useState, useEffect } from "react";
import { Maximize2, X, Play, Pause } from "lucide-react";

// Check if device is mobile
const isMobile = () => window.innerWidth < 768;

interface VideoThumbnailProps {
  src: string;
  title: string;
  aspectRatio?: "video" | "vertical";
  className?: string;
  isShowreel?: boolean;
}

export function VideoThumbnail({
  src, 
  title,
  aspectRatio = "video",
  className = "",
  isShowreel = false,
}: VideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const aspectClasses = aspectRatio === "vertical" ? "aspect-[9/16]" : "aspect-video";

  // Intersection Observer for lazy loading
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        rootMargin: '50px', // Reduced from 200px to prevent too early loading
        threshold: 0.1
      }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  // Load video when in view but don't autoplay
  useEffect(() => {
    if (isInView && videoRef.current && !videoLoaded) {
      const video = videoRef.current;
      video.src = src;
      video.load();
    }
  }, [isInView, src, videoLoaded]);

  const handleClick = async () => {
    if (!videoRef.current) return;
    setHasInteracted(true);

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      
      try {
        await videoRef.current.play();
        setIsPlaying(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Error playing video:', error);
        setIsLoading(false);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen();
    }
  };

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const playButtonSize = aspectRatio === 'vertical' 
    ? (isFullscreen ? 'w-20 h-20' : 'w-12 h-12')
    : (isFullscreen ? 'w-24 h-24' : 'w-16 h-16');

  return (
    <div
      ref={containerRef}
      className={`relative group cursor-pointer ${aspectClasses} rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${
        isFullscreen 
          ? 'fixed inset-0 z-[9999] !rounded-none !aspect-auto w-screen h-screen bg-black' 
          : (isMobile() ? '' : 'hover:shadow-xl hover:scale-105')
      } ${className}`}
      onClick={handleClick}
    >
      {/* Single video element that handles both preview and playback */}
      {isInView && (
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full ${
            isFullscreen ? 'object-contain' : 'object-cover'
          } transition-opacity duration-300 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          loop={isShowreel}
          playsInline
          preload="metadata" // Only load metadata for thumbnail
          onLoadedData={() => {
            setVideoLoaded(true);
            // Seek to 1 second for better thumbnail
            if (videoRef.current && !hasInteracted) { 
              videoRef.current.currentTime = 1;
            }
          }}
          onPlay={() => {
            setIsPlaying(true);
            setIsLoading(false);
          }}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onLoadStart={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            console.error('Video failed to load:', src);
          }}
        />
      )}

      {/* Fallback background when video is loading */}
      {!videoLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-white/40 text-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-bosenAlt">LOADING</p>
          </div>
        </div>
      )}

      {/* Play/Pause button overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className={`bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${playButtonSize} ${
          isLoading ? 'animate-pulse' : (isMobile() ? '' : 'group-hover:bg-white/30')
        } ${isPlaying && !isLoading ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className={`text-white ${
              aspectRatio === 'vertical' 
                ? (isFullscreen ? 'w-8 h-8' : 'w-5 h-5')
                : (isFullscreen ? 'w-10 h-10' : 'w-6 h-6')
            }`} />
          ) : (
            <Play className={`text-white ml-1 ${
              aspectRatio === 'vertical' 
                ? (isFullscreen ? 'w-8 h-8' : 'w-5 h-5')
                : (isFullscreen ? 'w-10 h-10' : 'w-6 h-6')
            }`} />
          )}
        </div>
      </div>

      {/* Hover overlay */}
      {!isFullscreen && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
      )}
      
      {/* Fullscreen button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFullscreen();
        }}
        className={`absolute bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-300 z-20 ${
          isFullscreen 
            ? 'top-8 right-8 w-12 h-12 opacity-100' 
            : 'top-4 right-4 w-10 h-10 opacity-0 group-hover:opacity-100'
        }`}
      >
        {isFullscreen ? (
          <X size={20} className="text-white" />
        ) : (
          <Maximize2 size={16} className="text-white" />
        )}
      </button>
      
      {/* Title Badge */}
      <div className={`absolute transition-all duration-300 z-20 ${
        isFullscreen 
          ? 'bottom-8 left-8 opacity-100' 
          : 'bottom-4 left-4 opacity-0 group-hover:opacity-100'
      }`}>
        <span className={`text-white font-bosenAlt bg-black/50 px-3 py-1 rounded-full ${
          isFullscreen ? 'text-lg' : 'text-sm'
        }`}>
          {title}
        </span>
      </div>
    </div>
  );
}

export default VideoThumbnail;