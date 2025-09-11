import React, { useState, useCallback } from 'react';
import { editImage } from '../services/geminiService';
import Spinner from './Spinner';

interface OriginalImage {
  file: File;
  dataUrl: string;
}

interface EditedResult {
  imageUrl: string;
  text: string | null;
}

type AspectRatio = '1:1' | '16:9' | '9:16';

const ImageEditor: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [originalImages, setOriginalImages] = useState<OriginalImage[]>([]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editedResult, setEditedResult] = useState<EditedResult | null>(null);
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
  }, [originalImages.length]);


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

  const handleEdit = async () => {
    if (originalImages.length === 0) {
      setError('Please upload at least one image to edit.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setEditedResult(null);
    
    const effectivePrompt = prompt.trim() || 'Improve the quality and lighting of the image.';

    try {
      const imagesPayload = originalImages.map(img => ({
        base64Data: img.dataUrl.split(',')[1],
        mimeType: img.file.type,
      }));
      const result = await editImage(effectivePrompt, imagesPayload, aspectRatio);
      setEditedResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getAspectRatioButtonClasses = (ratio: AspectRatio) => {
    const baseClasses = "flex-1 py-2 text-sm font-medium rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-sky-500 transition-colors duration-200";
    if (aspectRatio === ratio) {
      return `${baseClasses} bg-sky-600 text-white shadow`;
    }
    return `${baseClasses} bg-slate-700 text-slate-300 hover:bg-slate-600`;
  };

  return (
    <div className="bg-slate-800/50 p-6 rounded-lg shadow-xl">
      <h2 className="text-2xl font-semibold mb-4 text-slate-100">Image Editor (Nano Banana)</h2>
      <p className="mb-4 text-slate-400">
        Upload up to 8 images, choose an aspect ratio, and describe your desired edit.
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
                    <a 
                      href={image.dataUrl}
                      download={image.file.name}
                      className="bg-black/60 text-white rounded-full p-1.5 leading-none backdrop-blur-sm hover:bg-black/80"
                      aria-label={`Download image ${index + 1}`}
                      title="Download original"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </a>
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
        
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">3. Choose Aspect Ratio</label>
            <div className="flex gap-2 bg-slate-700/50 p-1 rounded-lg">
                <button onClick={() => setAspectRatio('1:1')} className={getAspectRatioButtonClasses('1:1')}>Square (1:1)</button>
                <button onClick={() => setAspectRatio('16:9')} className={getAspectRatioButtonClasses('16:9')}>Landscape (16:9)</button>
                <button onClick={() => setAspectRatio('9:16')} className={getAspectRatioButtonClasses('9:16')}>Portrait (9:16)</button>
            </div>
        </div>

        <button
          onClick={handleEdit}
          disabled={isLoading || originalImages.length === 0}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-sky-600 text-white font-semibold rounded-md hover:bg-sky-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? <><Spinner /> Editing...</> : 'Edit Image'}
        </button>
      </div>

      {error && <div className="mt-6 p-3 bg-red-900/50 text-red-300 border border-red-700 rounded-md">{error}</div>}

      {editedResult && (
        <div className="mt-6 bg-slate-900 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Result</h3>
          <img src={editedResult.imageUrl} alt="Edited" className="rounded-md w-full max-w-lg mx-auto shadow-lg" />
          {editedResult.text && (
            <div className="mt-4 p-3 bg-slate-800 rounded-md">
              <p className="text-slate-300 whitespace-pre-wrap">{editedResult.text}</p>
            </div>
          )}
          <a
            href={editedResult.imageUrl}
            download={`ai-edited-${Date.now()}.png`}
            className="mt-4 inline-block w-full text-center py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors"
          >
            Download Image
          </a>
        </div>
      )}
    </div>
  );
};

export default ImageEditor;
