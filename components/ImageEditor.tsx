
import React, { useState, useCallback } from 'react';
import Spinner from './Spinner';
import { OriginalImage, EditedResult } from '../types';
import { convertToPngAndDownload } from '../utils/imageUtils';

interface ImageEditorProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  originalImages: OriginalImage[];
  setOriginalImages: (images: OriginalImage[] | ((prev: OriginalImage[]) => OriginalImage[])) => void;
  editedResult: EditedResult | null;
  setEditedResult: (result: EditedResult | null) => void;
  isLoading: boolean;
  statusText: string;
  error: string | null;
  setError: (error: string | null) => void;
  onEdit: () => void;
  onStop: () => void;
}


const ImageEditor: React.FC<ImageEditorProps> = ({
  prompt,
  setPrompt,
  originalImages,
  setOriginalImages,
  editedResult,
  setEditedResult,
  isLoading,
  statusText,
  error,
  setError,
  onEdit,
  onStop,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const processFiles = useCallback((files: FileList) => {
    if (!files || files.length === 0) return;

    if (originalImages.length + files.length > 8) {
        setError("You can upload a maximum of 8 images.");
        return;
    }
    
    setError(null);
    setEditedResult(null);

    const newImages: OriginalImage[] = [];
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) {
            setError('Please upload valid image files (PNG, JPG, etc.).');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            newImages.push({ file, dataUrl: reader.result as string });
            // Update state after all files are read to avoid multiple re-renders
            if (newImages.length === files.length) {
              setOriginalImages(prev => [...prev, ...newImages]);
            }
        };
        reader.onerror = () => {
            setError('Failed to read an image file.');
        };
        reader.readAsDataURL(file);
    });
  }, [originalImages.length, setError, setEditedResult, setOriginalImages]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if(event.target.files) {
      processFiles(event.target.files);
    }
    event.target.value = '';
  };
  
  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
      handleDragEvents(e);
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
          setIsDragging(true);
      }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      handleDragEvents(e);
      setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      handleDragEvents(e);
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          processFiles(e.dataTransfer.files);
      }
  };


  const handleRemoveImage = (indexToRemove: number) => {
    setOriginalImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const handleDownloadOriginal = (image: OriginalImage) => {
    convertToPngAndDownload(image.dataUrl, image.file.name);
  };
  
  const handleDownloadEdited = () => {
    if (editedResult) {
      convertToPngAndDownload(editedResult.imageUrl, `ai-edited-${Date.now()}.png`);
    }
  };

  return (
    <div className="bg-slate-800/50 p-6 rounded-lg shadow-xl">
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-slate-100">Image Editor</h2>
        <p className="mb-4 text-slate-400">
          Upload up to 8 images and describe your desired edit.
        </p>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">1. Upload Image(s) (up to 8)</label>
            <div 
              onDrop={handleDrop}
              onDragOver={handleDragEnter}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-300 ${isDragging ? 'border-sky-500 bg-slate-800' : 'border-slate-600 hover:border-slate-500'}`}
            >
              <input 
                id="file-upload"
                type="file" 
                accept="image/*"
                multiple
                onChange={handleFileChange} 
                disabled={isLoading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                  <p>
                      <span className="font-semibold text-sky-500">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          </div>

          {originalImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {originalImages.map((image, index) => (
                <div key={index} className="relative group aspect-square">
                  <img src={image.dataUrl} alt={`Original ${index + 1}`} className="w-full h-full rounded-md object-cover" />
                  <div className="absolute top-1 right-1 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button 
                        onClick={() => handleDownloadOriginal(image)}
                        className="bg-black/60 text-white rounded-full p-1.5 leading-none backdrop-blur-sm hover:bg-black/80"
                        aria-label={`Download image ${index + 1} as PNG`}
                        title="Download as PNG"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </button>
                      <button 
                        onClick={() => handleRemoveImage(index)}
                        className="bg-black/60 text-white rounded-full p-1.5 leading-none backdrop-blur-sm hover:bg-black/80"
                        aria-label={`Remove image ${index + 1}`}
                        title="Remove image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">2. Describe Your Edit (Optional)</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Make the background a futuristic city at night."
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:outline-none transition-shadow resize-none h-24"
              disabled={isLoading}
            />
            <p className="text-xs text-slate-500 mt-1">If left blank, the model will try to improve the image quality.</p>
          </div>
        </div>

        {error && <div className="mt-6 p-3 bg-red-900/50 text-red-300 border border-red-700 rounded-md">{error}</div>}

        <div className="mt-6">
          {isLoading ? (
            <div className="bg-slate-900 p-4 rounded-lg flex flex-col items-center justify-center text-center h-64">
              <Spinner />
              <p className="mt-4 text-slate-300">{statusText}</p>
            </div>
          ) : editedResult && (
            <div className="bg-slate-900 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Result</h3>
              <img src={editedResult.imageUrl} alt="Edited" className="rounded-md w-full max-w-lg mx-auto shadow-lg" />
              {editedResult.text && (
                <div className="mt-4 p-3 bg-slate-800 rounded-md">
                  <p className="text-slate-300 whitespace-pre-wrap">{editedResult.text}</p>
                </div>
              )}
              <button
                onClick={handleDownloadEdited}
                className="mt-4 inline-block w-full text-center py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors"
              >
                Download Image (PNG)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Button Container */}
      <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 px-6 py-4 bg-slate-800 border-t border-slate-700/50">
        <button
          onClick={isLoading ? onStop : onEdit}
          disabled={!isLoading && originalImages.length === 0}
          className={`w-full flex justify-center items-center py-3 px-4 text-white font-semibold rounded-md transition-colors ${
            isLoading
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-sky-600 hover:bg-sky-700'
          } disabled:bg-slate-600 disabled:cursor-not-allowed`}
        >
          {isLoading ? 'Stop' : 'Edit Image'}
        </button>
      </div>
    </div>
  );
};

export default ImageEditor;
