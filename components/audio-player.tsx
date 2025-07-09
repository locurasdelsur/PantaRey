"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle, Music } from "lucide-react"

interface Track {
  id: number
  title: string
  artist: string
  url: string
  duration?: number
  type?: string
}

interface AudioPlayerProps {
  track: Track | null
  playlist?: Track[]
  onTrackChange?: (track: Track) => void
  className?: string
}

export function AudioPlayer({ track, playlist = [], onTrackChange, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !track) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleLoadStart = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0
        audio.play()
      } else {
        handleNext()
      }
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("loadstart", handleLoadStart)
    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("loadstart", handleLoadStart)
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [track, isRepeat])

  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio || !track) return

    try {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        await audio.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error("Error playing audio:", error)
      setIsPlaying(false)
    }
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (audio && duration) {
      const newTime = (value[0] / 100) * duration
      audio.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100
    setVolume(newVolume)
    setIsMuted(false)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handlePrevious = () => {
    if (!playlist.length || !track) return

    const currentIndex = playlist.findIndex((t) => t.id === track.id)
    let previousIndex = currentIndex - 1

    if (previousIndex < 0) {
      previousIndex = playlist.length - 1
    }

    const previousTrack = playlist[previousIndex]
    if (previousTrack && onTrackChange) {
      onTrackChange(previousTrack)
    }
  }

  const handleNext = () => {
    if (!playlist.length || !track) return

    const currentIndex = playlist.findIndex((t) => t.id === track.id)
    let nextIndex

    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length)
    } else {
      nextIndex = currentIndex + 1
      if (nextIndex >= playlist.length) {
        nextIndex = 0
      }
    }

    const nextTrack = playlist[nextIndex]
    if (nextTrack && onTrackChange) {
      onTrackChange(nextTrack)
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00"

    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const getProgressPercentage = () => {
    if (!duration) return 0
    return (currentTime / duration) * 100
  }

  if (!track) {
    return (
      <Card className={`bg-white/80 backdrop-blur-sm border-slate-200 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8 text-slate-500">
            <Music className="h-8 w-8 mr-3" />
            <span>Selecciona una canción para reproducir</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg ${className}`}>
      <CardContent className="p-4">
        <audio ref={audioRef} src={track.url} preload="metadata" />

        {/* Track Info */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Music className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 truncate">{track.title}</h3>
            <p className="text-sm text-slate-600 truncate">{track.artist}</p>
          </div>
          {track.type && (
            <Badge variant="outline" className="text-xs">
              {track.type}
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 mb-4">
          <Slider
            value={[getProgressPercentage()]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="w-full"
            disabled={!duration || isLoading}
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {playlist.length > 1 && (
            <Button variant="ghost" size="sm" onClick={handlePrevious} className="h-8 w-8 p-0">
              <SkipBack className="h-4 w-4" />
            </Button>
          )}

          <Button
            onClick={togglePlay}
            disabled={isLoading}
            className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4 text-white" />
            ) : (
              <Play className="h-4 w-4 text-white ml-0.5" />
            )}
          </Button>

          {playlist.length > 1 && (
            <Button variant="ghost" size="sm" onClick={handleNext} className="h-8 w-8 p-0">
              <SkipForward className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Additional Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {playlist.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsShuffle(!isShuffle)}
                  className={`h-7 w-7 p-0 ${isShuffle ? "text-purple-600" : "text-slate-400"}`}
                >
                  <Shuffle className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsRepeat(!isRepeat)}
                  className={`h-7 w-7 p-0 ${isRepeat ? "text-purple-600" : "text-slate-400"}`}
                >
                  <Repeat className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600"
            >
              {isMuted || volume === 0 ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-20"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
