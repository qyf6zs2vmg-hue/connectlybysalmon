
import React, { useState } from 'react';

interface AuthProps {
  onRegister: (name: string) => void;
  t: any;
}

const Auth: React.FC<AuthProps> = ({ onRegister, t }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length >= 2) {
      onRegister(name);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 md:mb-10">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 md:mb-6 shadow-xl shadow-indigo-200">
            <i className="fa-solid fa-link text-2xl md:text-3xl"></i>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">{t.authTitle}</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">{t.authSubtitle}</p>
        </div>

        <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border border-slate-100">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">{t.getStarted}</h2>
          <p className="text-slate-500 text-xs md:text-sm mb-6 md:mb-8">Enter your display name to receive your unique connection ID.</p>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-slate-700 mb-2 px-1">{t.displayName}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <i className="fa-solid fa-user"></i>
                </div>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full pl-11 pr-4 py-3 md:py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-800"
                  required
                  minLength={2}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 md:py-4 bg-indigo-600 text-white rounded-2xl font-bold text-base md:text-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {t.startConnecting}
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col items-center gap-3">
             <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <img 
                    key={i} 
                    src={`https://picsum.photos/seed/${i + 20}/50`} 
                    className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-sm" 
                    alt="user"
                  />
                ))}
             </div>
             <p className="text-[10px] md:text-xs text-slate-400 font-medium">{t.joinedCount}</p>
          </div>
        </div>

        <p className="mt-8 text-center text-slate-400 text-[10px] md:text-sm px-4">
          {t.privacyText}
        </p>
      </div>
    </div>
  );
};

export default Auth;
