import { useState, useRef, useEffect } from "react";
import { Camera, X, RotateCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface CameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  documentName: string;
}

export const CameraCapture = ({ open, onClose, onCapture, documentName }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  useEffect(() => {
    if (open) {
      checkCameras();
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
    }

    return () => {
      stopCamera();
    };
  }, [open, facingMode]);

  const checkCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);
    } catch (error) {
      console.error("Error checking cameras:", error);
    }
  };

  const startCamera = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
      }
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const confirmCapture = () => {
    if (capturedImage) {
      // Convert base64 to File
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `${documentName.replace(/\s+/g, '_')}_${Date.now()}.jpg`, { type: 'image/jpeg' });
          onCapture(file);
          onClose();
        })
        .catch(error => {
          console.error("Error converting image:", error);
          toast.error("Failed to process captured image");
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Capture {documentName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera View */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
              </>
            ) : (
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover"
              />
            )}

            {/* Camera Controls Overlay */}
            {!capturedImage && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4">
                {hasMultipleCameras && (
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={switchCamera}
                    className="rounded-full w-12 h-12 bg-white/90 hover:bg-white"
                  >
                    <RotateCw className="w-5 h-5" />
                  </Button>
                )}
                
                <Button
                  size="icon"
                  onClick={capturePhoto}
                  className="rounded-full w-16 h-16 bg-white hover:bg-white/90"
                >
                  <Camera className="w-6 h-6 text-primary" />
                </Button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {capturedImage ? (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={retakePhoto}
                className="flex-1 gap-2"
              >
                <X className="w-4 h-4" />
                Retake
              </Button>
              <Button
                onClick={confirmCapture}
                className="flex-1 gap-2"
              >
                <Check className="w-4 h-4" />
                Use Photo
              </Button>
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              <p>Position the document or person in the frame</p>
              {hasMultipleCameras && (
                <p className="mt-1">Tap the rotate button to switch cameras</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
