
import React from 'react';
import { AppMode } from '../types';

interface TabsProps {
  activeTab: AppMode;
  setActiveTab: (tab: AppMode) => void;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
  const getButtonClasses = (tab: AppMode) => {
    const baseClasses = "w-full py-3 text-sm font-medium rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-sky-500 transition-colors duration-200";
    if (activeTab === tab) {
      return `${baseClasses} bg-sky-600 text-white shadow-lg`;
    }
    return `${baseClasses} bg-slate-800 text-slate-300 hover:bg-slate-700`;
  };

  return (
    <div className="p-1.5 bg-slate-800/50 rounded-lg grid grid-cols-2 gap-2">
      <button
        onClick={() => setActiveTab(AppMode.Generate)}
        className={getButtonClasses(AppMode.Generate)}
      >
        Generate
      </button>
      <button
        onClick={() => setActiveTab(AppMode.Edit)}
        className={getButtonClasses(AppMode.Edit)}
      >
        Edit (Nano Banana)
      </button>
    </div>
  );
};

export default Tabs;
