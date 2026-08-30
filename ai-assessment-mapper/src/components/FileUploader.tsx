"use client";

import { FileText, Image as ImageIcon, Upload, X } from "lucide-react";
import { useRef } from "react";

interface FileUploaderProps {
  label: string;
  description: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const MAX_FILE_SIZE = 20 * 1024 * 1024;

export default function FileUploader({
  label,
  description,
  file,
  onFileChange,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File | undefined) => {
    if (!selectedFile) return;

    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      alert("Please upload a PDF, PNG, JPG, JPEG, or WebP file.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      alert("File size must be less than 20 MB.");
      return;
    }

    onFileChange(selectedFile);
  };

  const handleRemove = () => {
    onFileChange(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <p className="mb-2 text-sm font-medium text-gray-900">{label}</p>

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-10 transition hover:border-gray-400 hover:bg-gray-100"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
            <Upload className="h-5 w-5 text-gray-600" />
          </div>

          <p className="text-sm font-medium text-gray-900">
            Click to upload
          </p>

          <p className="mt-1 text-xs text-gray-500">{description}</p>

          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
            <FileText className="h-4 w-4" />
            <span>PDF</span>

            <ImageIcon className="ml-2 h-4 w-4" />
            <span>Images</span>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </button>
      ) : (
        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
              <FileText className="h-5 w-5 text-gray-600" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">
                {file.name}
              </p>

              <p className="text-xs text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      )}
    </div>
  );
}