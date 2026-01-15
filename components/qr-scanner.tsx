"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle } from "lucide-react"

interface QRScannerProps {
  onScan: (data: string) => void
}

export default function QRScanner({ onScan }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => {
    const startScanning = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setIsScanning(true)
          setError(null)
        }
      } catch (err) {
        setError("Unable to access camera. Please check permissions.")
        console.error("Camera error:", err)
      }
    }

    startScanning()

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      {error ? (
        <div className="bg-error bg-opacity-20 border border-error rounded-lg p-4 text-error text-sm flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg bg-black"
            style={{ aspectRatio: "1/1" }}
          />
          {isScanning && (
            <p className="text-sm text-foreground-light dark:text-foreground-light text-center">
              📱 Position the QR code in front of your camera
            </p>
          )}
        </>
      )}
    </div>
  )
}
