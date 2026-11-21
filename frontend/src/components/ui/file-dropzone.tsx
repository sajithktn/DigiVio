import React, { useRef, useState } from "react";
import { UploadCloud, File, AlertCircle } from "lucide-react";

export interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function FileDropzone({
  onFileSelect,
  accept = ".pdf,.png,.svg,.ai",
  maxSizeMB = 25,
  label = "Upload production artwork",
  description = "Supported formats: PDF, PNG, SVG, AI (Max 25MB, 300+ DPI recommended)",
  disabled = false,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragover" || e.type === "dragenter") {
      setIsDragOver(true);
    } else if (e.type === "dragleave") {
      setIsDragOver(false);
    }
  };

  const validateAndSelect = (file: File) => {
    setError(null);
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB} MB limit.`);
      return;
    }
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full space-y-2">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 rounded-card border-2 border-dashed transition-all cursor-pointer text-center ${
          isDragOver
            ? "border-primary bg-primary/10 shadow-card scale-[1.01]"
            : "border-line bg-surface-card hover:border-lavender hover:bg-lavender-light/30"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-full bg-lavender flex items-center justify-center text-primary mb-3 shadow-soft">
          <UploadCloud className="w-6 h-6" />
        </div>

        <h4 className="font-heading font-bold text-sm text-plum">{label}</h4>
        <p className="text-xs text-ink-muted mt-1 max-w-sm">{description}</p>

        {selectedFile && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-btn bg-lavender-light border border-line text-xs font-semibold text-primary">
            <File className="w-4 h-4" />
            <span className="truncate max-w-[200px]">{selectedFile.name}</span>
            <span className="text-ink-muted font-normal">
              ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-danger font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
