
import React, { useState } from 'react';
import { AppMode } from './types';
import Header from './components/Header';
import Tabs from './components/Tabs';
import ImageGenerator from './components/ImageGenerator';
import ImageEditor from './components/ImageEditor';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.Generate);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Tabs activeTab={mode} setActiveTab={setMode} />
          <div className="mt-8">
            {mode === AppMode.Generate ? <ImageGenerator /> : <ImageEditor />}
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
