import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { CalculatorPage } from './pages/CalculatorPage';
import { HistoryPage } from './pages/HistoryPage';
import { VatsPage } from './pages/VatsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0b0d17] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
        <Header />
        
        <main className="flex-1 w-full">
          <Routes>
            <Route path="/" element={<CalculatorPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/vats" element={<VatsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <BottomNav />
      </div>
    </BrowserRouter>
  );
};

export default App;
