import React, { useState, useEffect } from 'react';
import { Header, type AppTab } from './components/common/Header';
import { DashboardPage } from './pages/DashboardPage';
import { WeatherPredictionPage } from './pages/WeatherPredictionPage';
import { ConfidenceScorePage } from './pages/ConfidenceScorePage';
import { FarmAdvisoryPage } from './pages/FarmAdvisoryPage';

export const App: React.FC = () => {
  // Read initial tab from URL hash if present
  const getInitialTab = (): AppTab => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#prediction') return 'prediction';
      if (window.location.hash === '#confidence') return 'confidence';
      if (window.location.hash === '#advisory') return 'advisory';
    }
    return 'historical';
  };

  const [activeTab, setActiveTab] = useState<AppTab>(getInitialTab);

  // Sync tab with URL hash for bookmarking and reload support
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#prediction') {
        setActiveTab('prediction');
      } else if (window.location.hash === '#confidence') {
        setActiveTab('confidence');
      } else if (window.location.hash === '#advisory') {
        setActiveTab('advisory');
      } else if (window.location.hash === '#historical') {
        setActiveTab('historical');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (tab: AppTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = tab;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header activeTab={activeTab} onSelectTab={handleTabChange} />
      <main className="flex-1">
        {activeTab === 'historical' && <DashboardPage />}
        {activeTab === 'prediction' && <WeatherPredictionPage />}
        {activeTab === 'confidence' && <ConfidenceScorePage />}
        {activeTab === 'advisory' && <FarmAdvisoryPage />}
      </main>
    </div>
  );
};

export default App;
