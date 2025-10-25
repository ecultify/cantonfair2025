"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Video, X, Check, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { toast } from "sonner";

interface MediaCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (data: string, type: 'photo' | 'video') => void;
  mode?: 'photo' | 'video' | 'both';
}

export function MediaCapture({
  open,
  onOpenChange,
  onCapture,
  mode = 'both',
}: MediaCaptureProps) {
  const [captureMode, setCaptureMode] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Set initial capture mode based on mode prop
  useEffect(() => {
    if (mode === 'photo') {
      setCaptureMode('photo');
    } else if (mode === 'video') {
      setCaptureMode('video');
    }
  }, [mode, open]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraReady(false);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    try {
      setIsCameraReady(false);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 1920, height: 1080 },
        audio: captureMode === 'video',
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Play the video immediately
        await videoRef.current.play();
        setIsCameraReady(true);
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Could not access camera");
    }
  }, [captureMode]);

  // Start camera when modal opens
  useEffect(() => {
    if (open && !preview && !stream) {
      const timer = setTimeout(() => {
        startCamera();
      }, 100); // Small delay to ensure modal is fully rendered
      
      return () => clearTimeout(timer);
    }
  }, [open, preview, stream, startCamera]);

  // Cleanup when modal closes
  useEffect(() => {
    if (!open) {
      stopCamera();
    }
  }, [open, stopCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      setPreview(dataUrl);
    }
  }, []);

  const startVideoRecording = useCallback(() => {
    if (!stream) return;

    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setPreview(url);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success("Recording started");
    } catch (error) {
      console.error("Recording error:", error);
      toast.error("Could not start recording");
    }
  }, [stream]);

  const stopVideoRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Recording stopped");
    }
  }, [isRecording]);

  const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleClose = useCallback(() => {
    setPreview(null);
    setIsRecording(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleConfirm = useCallback(async () => {
    if (preview) {
      let dataToSend = preview;
      
      // If it's a video with a blob URL, convert it to data URL
      if (captureMode === 'video' && preview.startsWith('blob:')) {
        try {
          toast.info("Processing video...");
          const response = await fetch(preview);
          const blob = await response.blob();
          dataToSend = await blobToDataURL(blob);
          // Clean up the blob URL
          URL.revokeObjectURL(preview);
        } catch (error) {
          console.error("Error converting video:", error);
          toast.error("Failed to process video");
          return;
        }
      }
      
      onCapture(dataToSend, captureMode);
      handleClose();
    }
  }, [preview, captureMode, onCapture, handleClose]);

  const handleRetake = useCallback(() => {
    setPreview(null);
    if (captureMode === 'photo') {
      startCamera();
    } else {
      chunksRef.current = [];
      startCamera();
    }
  }, [captureMode, startCamera]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95vh] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b flex-shrink-0 relative">
          <SheetTitle>
            {preview ? "Preview" : captureMode === 'photo' ? "Take Photo" : "Record Video"}
          </SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute top-2 right-2 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>

        <div className="relative flex-1 bg-black overflow-hidden">
          {!preview ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {mode === 'both' && !isRecording && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 rounded-full p-1">
                  <Button
                    size="sm"
                    variant={captureMode === 'photo' ? 'default' : 'ghost'}
                    onClick={() => setCaptureMode('photo')}
                    className="rounded-full"
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    Photo
                  </Button>
                  <Button
                    size="sm"
                    variant={captureMode === 'video' ? 'default' : 'ghost'}
                    onClick={() => setCaptureMode('video')}
                    className="rounded-full"
                  >
                    <Video className="h-4 w-4 mr-1" />
                    Video
                  </Button>
                </div>
              )}

              {isRecording && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
                  <div className="w-3 h-3 bg-white rounded-full" />
                  Recording...
                </div>
              )}
            </>
          ) : (
            <>
              {captureMode === 'photo' ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={preview}
                  controls
                  className="w-full h-full object-contain"
                />
              )}
            </>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          {!preview ? (
            <div className="flex items-center justify-center gap-8">
              <Button
                size="icon"
                variant="ghost"
                onClick={handleClose}
                className="h-14 w-14 rounded-full bg-white/20 hover:bg-white/30"
              >
                <X className="h-6 w-6 text-white" />
              </Button>

              {captureMode === 'photo' ? (
                <Button
                  size="icon"
                  onClick={capturePhoto}
                  className="h-20 w-20 rounded-full bg-white hover:bg-white/90"
                >
                  <Camera className="h-8 w-8 text-black" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  onClick={isRecording ? stopVideoRecording : startVideoRecording}
                  className={`h-20 w-20 rounded-full ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-white hover:bg-white/90'
                  }`}
                >
                  {isRecording ? (
                    <div className="h-8 w-8 bg-white rounded-sm" />
                  ) : (
                    <div className="h-8 w-8 bg-red-600 rounded-full" />
                  )}
                </Button>
              )}

              <div className="h-14 w-14" /> {/* Spacer for symmetry */}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-8">
              <Button
                size="icon"
                variant="ghost"
                onClick={handleRetake}
                className="h-14 w-14 rounded-full bg-white/20 hover:bg-white/30"
              >
                <RotateCcw className="h-6 w-6 text-white" />
              </Button>

              <Button
                size="icon"
                onClick={handleConfirm}
                className="h-20 w-20 rounded-full bg-green-600 hover:bg-green-700"
              >
                <Check className="h-8 w-8 text-white" />
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}