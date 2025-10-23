"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { QrCode, X } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface QRScannerProps {
  onScan: (data: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QRScanner({ onScan, open, onOpenChange }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);

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
      setScanning(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please check permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setScanning(false);
    }
  }, [stream]);

  const scanQRCode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !scanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanQRCode);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ["qr_code"],
        });

        barcodeDetector.detect(imageData).then((barcodes: any[]) => {
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            onScan(barcodes[0].rawValue);
            stopCamera();
            onOpenChange(false);
            return;
          }
          requestAnimationFrame(scanQRCode);
        });
      } else {
        requestAnimationFrame(scanQRCode);
      }
    } catch (error) {
      console.error("QR scan error:", error);
      requestAnimationFrame(scanQRCode);
    }
  }, [scanning, onScan, stopCamera, onOpenChange]);

  useEffect(() => {
    if (scanning) {
      const timer = requestAnimationFrame(scanQRCode);
      return () => cancelAnimationFrame(timer);
    }
  }, [scanning, scanQRCode]);

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
          <DialogTitle>Scan QR Code</DialogTitle>
        </DialogHeader>
        <div className="relative bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-[400px] object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-4 border-white/50 rounded-lg">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white"></div>
            </div>
          </div>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <Button
              size="lg"
              variant="ghost"
              className="rounded-full w-16 h-16 bg-black/50 hover:bg-black/70"
              onClick={() => handleOpenChange(false)}
            >
              <X className="h-6 w-6 text-white" />
            </Button>
          </div>
          <div className="absolute top-4 left-0 right-0 text-center text-white text-sm bg-black/50 py-2">
            {scanning ? "Scanning for QR code..." : "Initializing camera..."}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
