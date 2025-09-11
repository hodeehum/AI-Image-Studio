import React from 'react';
import { AppMode } from '../types';

interface TabsProps {
  activeTab: AppMode;
  setActiveTab: (tab: AppMode) => void;
  isLoading: boolean;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab, isLoading }) => {
  const getButtonClasses = (tab: AppMode) => {
    const baseClasses = "w-full py-3 text-sm font-medium rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-sky-500 transition-colors duration-200";
    if (activeTab === tab) {
      return `${baseClasses} bg-sky-600 text-white shadow-lg`;
    }
    if (isLoading) {
      return `${baseClasses} bg-slate-800 text-slate-500 cursor-not-allowed`;
    }
    return `${baseClasses} bg-slate-800 text-slate-300 hover:bg-slate-700`;
  };

  return (
    <div className="p-1.5 bg-slate-800/50 rounded-lg grid grid-cols-2 gap-2">
      <button
        onClick={() => !isLoading && setActiveTab(AppMode.Generate)}
        className={getButtonClasses(AppMode.Generate)}
        disabled={isLoading && activeTab !== AppMode.Generate}
      >
        Generate
      </button>
      <button
        onClick={() => !isLoading && setActiveTab(AppMode.Edit)}
        className={getButtonClasses(AppMode.Edit)}
        disabled={isLoading && activeTab !== AppMode.Edit}
      >
        Edit
      </button>
    </div>
  );
};

export default Tabs;