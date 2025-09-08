import React, { useState } from 'react';
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (originalImages.length + files.length > 8) {
        setError("You can upload a maximum of 8 images.");
        return;
    }
    
    setError(null);
    setEditedResult(null);

    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) {
            setError('Please upload valid image files (PNG, JPG, etc.).');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setOriginalImages(prev => [...prev, { file, dataUrl: reader.result as string }]);
        };
        reader.onerror = () => {
            setError('Failed to read an image file.');
        };
        reader.readAsDataURL(file);
    });

    // Clear the input value to allow re-selecting the same file(s)
    event.target.value = '';
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setOriginalImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleEdit = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt describing the edit.');
      return;
    }
    if (originalImages.length === 0) {
      setError('Please upload at least one image to edit.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setEditedResult(null);

    try {
      const imagesPayload = originalImages.map(img => ({
        base64Data: img.dataUrl.split(',')[1],
        mimeType: img.file.type,
      }));
      const result = await editImage(prompt, imagesPayload, aspectRatio);
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
          <label htmlFor="file-upload" className="block text-sm font-medium text-slate-300 mb-2">1. Upload Image(s) (up to 8)</label>
          <input 
            id="file-upload"
            type="file" 
            accept="image/*"
            multiple
            onChange={handleFileChange} 
            disabled={isLoading}
            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700"
          />
        </div>

        {originalImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {originalImages.map((image, index) => (
              <div key={index} className="relative group">
                <img src={image.dataUrl} alt={`Original ${index + 1}`} className="aspect-square w-full rounded-md object-cover" />
                <button 
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 leading-none opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove image ${index + 1}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">2. Select Aspect Ratio</label>
          <div className="flex gap-2 p-1 bg-slate-800/50 rounded-lg">
            {(['1:1', '16:9', '9:16'] as AspectRatio[]).map(ratio => (
              <button key={ratio} onClick={() => setAspectRatio(ratio)} className={getAspectRatioButtonClasses(ratio)}>
                {ratio}
              </button>
            ))}
          </div>
        </div>

        <div>
           <label htmlFor="prompt-edit" className="block text-sm font-medium text-slate-300 mb-2">3. Describe Your Edit</label>
           <textarea
              id="prompt-edit"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., add a party hat on the cat, change the background to a beach"
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:outline-none transition-shadow resize-none h-28"
              disabled={isLoading || originalImages.length === 0}
            />
        </div>

        <button
          onClick={handleEdit}
          disabled={isLoading || originalImages.length === 0 || !prompt}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-sky-600 text-white font-semibold rounded-md hover:bg-sky-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? <><Spinner /> Editing...</> : 'Edit Image'}
        </button>
      </div>

      {error && <div className="mt-4 p-3 bg-red-900/50 text-red-300 border border-red-700 rounded-md">{error}</div>}

      <div className="mt-6">
        {editedResult && (
          <div className="bg-slate-900 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-3">Edited Result</h3>
            <img src={editedResult.imageUrl} alt="Edited" className="rounded-md w-full max-w-lg mx-auto shadow-lg" />
            {editedResult.text && (
                <p className="mt-3 p-3 bg-slate-800 rounded-md text-slate-300 whitespace-pre-wrap">{editedResult.text}</p>
            )}
            <a
              href={editedResult.imageUrl}
              download={`ai-edited-${Date.now()}.png`}
              className="mt-4 inline-block w-full text-center py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors"
            >
              Download Edited Image
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageEditor;