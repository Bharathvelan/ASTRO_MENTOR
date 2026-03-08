'use client';

import { useState, useCallback } from 'react';
import { Upload, FileArchive, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';

interface RepoUploadProps {
  onUploadStart?: () => void;
  onUploadComplete?: (repoId: string) => void;
  onUploadError?: (error: Error) => void;
}

/**
 * RepoUpload - Repository upload component
 * 
 * Provides file input and drag-and-drop zone for repository archives.
 * Validates file size and format before upload.
 * 
 * Requirements: 2.1
 */
export function RepoUpload({ onUploadStart, onUploadComplete, onUploadError }: RepoUploadProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_EXTENSIONS = ['.zip', '.tar.gz', '.tgz'];

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        variant: 'destructive',
      });
      return false;
    }

    // Check file extension
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    
    if (!hasValidExtension) {
      toast({
        title: 'Invalid file type',
        description: `Please upload a ${ALLOWED_EXTENSIONS.join(', ')} file`,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    onUploadStart?.();

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulate upload progress (replace with actual API call)
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          toast({
            title: 'Upload successful',
            description: 'Your repository is being indexed',
          });
          onUploadComplete?.(response.repoId);
          setSelectedFile(null);
        } else {
          throw new Error('Upload failed');
        }
        setIsUploading(false);
      });

      xhr.addEventListener('error', () => {
        const error = new Error('Upload failed');
        onUploadError?.(error);
        toast({
          title: 'Upload failed',
          description: 'Please try again',
          variant: 'destructive',
        });
        setIsUploading(false);
      });

      xhr.open('POST', '/api/v1/repo/upload');
      xhr.send(formData);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Upload failed');
      onUploadError?.(err);
      toast({
        title: 'Upload failed',
        description: err.message,
        variant: 'destructive',
      });
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Upload Repository</h3>
          <p className="text-sm text-muted-foreground">
            Upload a repository archive (.zip, .tar.gz) to analyze your code
          </p>
        </div>

        {/* Drag and drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <input
            type="file"
            accept=".zip,.tar.gz,.tgz"
            onChange={handleFileInputChange}
            className="absolute inset-0 cursor-pointer opacity-0"
            disabled={isUploading}
          />
          
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Drop your repository here</p>
              <p className="text-sm text-muted-foreground">or click to browse</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Max size: {MAX_FILE_SIZE / 1024 / 1024}MB
            </p>
          </div>
        </div>

        {/* Selected file */}
        {selectedFile && !isUploading && (
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center gap-3">
              <FileArchive className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Upload progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* Upload button */}
        {selectedFile && !isUploading && (
          <Button onClick={handleUpload} className="w-full">
            Upload Repository
          </Button>
        )}
      </div>
    </Card>
  );
}
