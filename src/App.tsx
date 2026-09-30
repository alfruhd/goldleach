import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { CalculatorPage } from './pages/CalculatorPage';
import { HistoryPage } from './pages/HistoryPage';
import { VatsPage } from './pages/VatsPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d17] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
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
    </ThemeProvider>
  );
};

export default App;
