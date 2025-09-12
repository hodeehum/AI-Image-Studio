
import React, { useState } from 'react';
import { AppMode, OriginalImage, EditedResult } from './types';
import { generateImage, editImage as apiEditImage } from './services/geminiService';
import Header from './components/Header';
import Tabs from './components/Tabs';
import ImageGenerator from './components/ImageGenerator';
import ImageEditor from './components/ImageEditor';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.Generate);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // State for ImageGenerator
  const [generatePrompt, setGeneratePrompt] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  // State for ImageEditor
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [originalImages, setOriginalImages] = useState<OriginalImage[]>([]);
  const [editedResult, setEditedResult] = useState<EditedResult | null>(null);

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      // Immediately reset the UI state to provide instant feedback.
      // The catch block in the API call handlers will still log the cancellation.
      setIsLoading(false);
      setError('Operation cancelled by user.');
      setAbortController(null);
    }
  };

  const handleGenerate = async () => {
    const controller = new AbortController();
    setAbortController(controller);

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);

    const effectivePrompt = generatePrompt.trim() || 'A majestic lion wearing a crown, cinematic lighting, hyperrealistic';

    try {
      const url = await generateImage(effectivePrompt, controller.signal);
      setGeneratedImageUrl(url);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // The error message is already set by handleStop, but we log it here.
        console.log('Generation cancelled by user.');
      } else {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      }
    } finally {
      // Ensure loading state is always reset, even if handleStop hasn't been called.
      setIsLoading(false);
      if (abortController === controller) {
        setAbortController(null);
      }
    }
  };

  const handleEdit = async () => {
    if (originalImages.length === 0) {
      setError('Please upload at least one image to edit.');
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);

    setIsLoading(true);
    setError(null);
    setEditedResult(null);

    const effectivePrompt = editPrompt.trim() || 'Improve the quality and lighting of the image.';

    try {
      const imagesPayload = originalImages.map(img => ({
        base64Data: img.dataUrl.split(',')[1],
        mimeType: img.file.type,
      }));
      const result = await apiEditImage(effectivePrompt, imagesPayload, controller.signal);
      setEditedResult(result);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // The error message is already set by handleStop, but we log it here.
        console.log('Edit cancelled by user.');
      } else {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      }
    } finally {
       // Ensure loading state is always reset, even if handleStop hasn't been called.
      setIsLoading(false);
      if (abortController === controller) {
        setAbortController(null);
      }
    }
  };


  const renderContent = () => {
    switch (mode) {
      case AppMode.Generate:
        return (
          <ImageGenerator
            prompt={generatePrompt}
            setPrompt={setGeneratePrompt}
            imageUrl={generatedImageUrl}
            isLoading={isLoading}
            error={error}
            onGenerate={handleGenerate}
            onStop={handleStop}
          />
        );
      case AppMode.Edit:
        return (
          <ImageEditor
            prompt={editPrompt}
            setPrompt={setEditPrompt}
            originalImages={originalImages}
            setOriginalImages={setOriginalImages}
            editedResult={editedResult}
            setEditedResult={setEditedResult}
            isLoading={isLoading}
            error={error}
            setError={setError}
            onEdit={handleEdit}
            onStop={handleStop}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Tabs activeTab={mode} setActiveTab={setMode} isLoading={isLoading} />
          <div className="mt-8">
            {renderContent()}
          </div>
        </div>
      </main>
      <footer className="text-center py-4 text-slate-500 text-sm">
        <p>Built with React, Tailwind CSS, and the Google Gemini API.</p>
      </footer>
    </div>
  );
};

export default App;
