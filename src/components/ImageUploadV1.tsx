import React, { useRef, useState, useEffect } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface ImageUploadProps {
  value?: string;
  onChange: (file: File | null) => void;
  onRemove: () => void;
  className?: string;
  maxSize?: number; // in MB
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  className,
  maxSize = 5,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size exceeds the limit of ${maxSize}MB`);
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG or PNG)");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    onChange(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-4 w-full", className)}>
      {preview && (
        <img src={preview} alt="Vehicle" className="w-30 h-26 object-contain" />
      )}
      <div className="flex items-center gap-2">
        <Input
          id="vehicle-image"
          ref={fileInputRef}
          type="file"
          accept="image/jpeg, image/png"
          className="hidden"
          onChange={(e) => handleFileChange(e)}
        />
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={handleClick}
        >
          {preview ? "Change Image" : "Upload Image"}
        </Button>
        {preview && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={(e) => handleRemove(e)}
          >
            Remove Image
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">JPG, PNG • Max 5MB</p>
    </div>
  );
}
