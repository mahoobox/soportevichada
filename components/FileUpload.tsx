// components/FileUpload.tsx
"use client";

import { useState } from "react";
import {
  compressImage,
  formatFileSize,
  isImageFile,
  MAX_FILE_SIZE,
} from "@/lib/image-compression";
import { PaperClipIcon, XCircleIcon } from "./Icons";

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export default function FileUpload({
  files,
  onFilesChange,
  maxFiles = 5,
  disabled = false,
}: FileUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const processFiles = async (newFiles: FileList) => {
    if (files.length >= maxFiles) {
      alert(`Máximo ${maxFiles} archivos permitidos`);
      return;
    }

    setIsProcessing(true);
    const processedFiles: File[] = [];
    const filesToAdd = Array.from(newFiles).slice(0, maxFiles - files.length);

    for (const file of filesToAdd) {
      try {
        let processedFile = file;

        // Si es imagen, comprimir
        if (isImageFile(file)) {
          processedFile = await compressImage(file);
        }

        // Validar tamaño después de compresión
        if (processedFile.size > MAX_FILE_SIZE) {
          alert(
            `El archivo "${
              file.name
            }" excede el tamaño máximo de 4MB (${formatFileSize(
              processedFile.size
            )})`
          );
          continue;
        }

        processedFiles.push(processedFile);
      } catch (error) {
        console.error("Error procesando archivo:", file.name, error);
        alert(`Error al procesar el archivo "${file.name}"`);
      }
    }

    onFilesChange([...files, ...processedFiles]);
    setIsProcessing(false);
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Adjuntar Archivos (Opcional, hasta {maxFiles})
      </label>
      <p className="text-xs text-gray-500 mb-2">
        Formatos aceptados: .jpg, .jpeg, .png, .pdf • Máximo 4MB por archivo
        <br />
        Las imágenes se comprimirán automáticamente manteniendo la calidad
      </p>

      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
        <div className="space-y-1 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex text-sm text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
            >
              <span>{isProcessing ? "Procesando..." : "Subir archivos"}</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                multiple
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                disabled={disabled || files.length >= maxFiles || isProcessing}
              />
            </label>
            <p className="pl-1">o arrastrar y soltar</p>
          </div>
          <p className="text-xs text-gray-500">
            {files.length}/{maxFiles} archivos
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-gray-100 p-2 rounded-md"
            >
              <div className="flex items-center space-x-2">
                <PaperClipIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <span className="text-sm text-gray-800">{file.name}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({formatFileSize(file.size)})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700"
                disabled={disabled}
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {isProcessing && (
        <div className="mt-2 text-center">
          <div className="inline-flex items-center text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Comprimiendo imágenes...
          </div>
        </div>
      )}
    </div>
  );
}
