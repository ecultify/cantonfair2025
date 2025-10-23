"use client";

import { useRef, useState, useCallback } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CameraCapture({ onCapture, open, onOpenChange }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturing, setCapturing] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please check permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;

    setCapturing(true);
    const canvas = document.createElement("canvas");
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          onCapture(file);
          stopCamera();
          onOpenChange(false);
        }
        setCapturing(false);
      }, "image/jpeg", 0.9);
    }
  }, [onCapture, stopCamera, onOpenChange]);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Capture Photo</DialogTitle>
        </DialogHeader>
        <div className="relative bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-[400px] object-cover"
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full w-16 h-16"
              onClick={capturePhoto}
              disabled={capturing || !stream}
            >
              <Camera className="h-6 w-6" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="rounded-full w-16 h-16 bg-black/50 hover:bg-black/70"
              onClick={() => handleOpenChange(false)}
            >
              <X className="h-6 w-6 text-white" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
