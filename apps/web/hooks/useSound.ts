import { useEffect, useRef } from "react"

export const useSoundFeedback = () => {
    const audioRef = useRef<HTMLAudioElement>(null)

    useEffect(() => {
        audioRef.current = new Audio('/audio/success.mp3')
        audioRef.current.preload = 'auto'
    }, [])

    const playSuccess = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0
            const playPromise = audioRef.current.play()

            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    console.warn("Audio playback blocked by browser:", error);
                });
            }
        }
    }
    return { playSuccess };
}