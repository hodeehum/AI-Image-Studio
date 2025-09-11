import React from 'react';
import Spinner from './Spinner';

interface ImageGeneratorProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  prompt,
  setPrompt,
  imageUrl,
  isLoading,
  error,
  onGenerate,
}) => {
  return (
    <div className="bg-slate-800/50 p-6 rounded-lg shadow-xl">
      <h2 className="text-2xl font-semibold mb-4 text-slate-100">Image Generation</h2>
      <p className="mb-4 text-slate-400">
        Describe the image you want to create. The more detailed your prompt, the better the result.
      </p>
      <div className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A majestic lion wearing a crown, cinematic lighting, hyperrealistic"
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:outline-none transition-shadow resize-none h-28"
          disabled={isLoading}
        />
        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-sky-600 text-white font-semibold rounded-md hover:bg-sky-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? <><Spinner /> Generating...</> : 'Generate Image'}
        </button>
      </div>

      {error && <div className="mt-4 p-3 bg-red-900/50 text-red-300 border border-red-700 rounded-md">{error}</div>}

      <div className="mt-6">
        {imageUrl && (
          <div className="bg-slate-900 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-3">Result</h3>
            <img src={imageUrl} alt="Generated" className="rounded-md w-full max-w-lg mx-auto shadow-lg" />
            <a
              href={imageUrl}
              download={`ai-generated-${Date.now()}.png`}
              className="mt-4 inline-block w-full text-center py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors"
            >
              Download Image
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenerator;