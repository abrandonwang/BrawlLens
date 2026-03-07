"use client"
import { useState, useEffect, useCallback } from "react"

const CHARS = "0289PYLQGRJCUV"

interface ScrambleTextProps {
    texts: string[]
    interval?: number
}

export default function ScrambleText({ texts, interval = 3000 }: ScrambleTextProps) {
    const [display, setDisplay] = useState(texts[0])
    const [currentIndex, setCurrentIndex] = useState(0)

    const scramble = useCallback((target: string) => {
        const length = target.length
        let locked = 0

        const tick = setInterval(() => {
            setDisplay(prev => {
                const chars = target.split("").map((char, i) => {
                    if (i < locked) return char
                    return CHARS[Math.floor(Math.random() * CHARS.length)]
                })
                return chars.join("")
            })

            locked++

            if (locked > length) {
                clearInterval(tick)
                setDisplay(target)
            }
        }, 100)
    }, [])

    useEffect(() => {
        const loop = setInterval(() => {
            setCurrentIndex(prev => {
                const next = (prev + 1) % texts.length
                scramble(texts[next])
                return next
            })
        }, interval)

        return () => clearInterval(loop)
    }, [texts, interval, scramble])

    return <span>{display}</span>
}