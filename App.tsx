
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, Language } from './types';
import Navigation from './components/Navigation';
import Home from './views/Home';
import HelpCentre from './views/HelpCentre';
import Profile from './views/Profile';
import Products from './views/Products';
import ContactsView from './views/Contacts';
import Auth from './views/Auth';
import { translations } from './translations';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('connectly_lang');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('connectly_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    localStorage.setItem('connectly_lang', lang);
  }, [lang]);

  const handleRegister = (name: string) => {
    const newUser: User = {
      id: Math.floor(1000 + Math.random() * 9000).toString(),
      name,
      avatar: `https://picsum.photos/seed/${Math.random()}/200`,
      joinedAt: new Date().toISOString(),
    };
    localStorage.setItem('connectly_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('connectly_user');
    setUser(null);
  };

  const t = translations[lang];

  if (!user) {
    return <Auth onRegister={handleRegister} t={t} />;
  }

  return (
    <HashRouter>
      <div className="flex flex-col md:flex-row h-[100dvh] bg-slate-50 overflow-hidden">
        <Navigation user={user} onLogout={handleLogout} t={t} />
        
        <main className="flex-1 overflow-y-auto min-h-0">
          <Routes>
            <Route path="/" element={<Home user={user} t={t} />} />
            <Route path="/contacts" element={<ContactsView t={t} />} />
            <Route path="/help" element={<HelpCentre t={t} />} />
            <Route path="/profile" element={<Profile user={user} setLang={setLang} currentLang={lang} t={t} />} />
            <Route path="/products" element={<Products t={t} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
