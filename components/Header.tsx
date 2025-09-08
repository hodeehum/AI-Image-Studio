
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-6 text-center border-b border-slate-700/50">
      <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">
        AI Image Studio
      </h1>
      <p className="mt-2 text-slate-400">
        Generate & Edit Images with Nano Banana ✨
      </p>
    </header>
  );
};

export default Header;
