
import React from 'react';
import { User, Language } from '../types';

interface ProfileProps {
  user: User;
  setLang: (l: Language) => void;
  currentLang: Language;
  t: any;
}

const Profile: React.FC<ProfileProps> = ({ user, setLang, currentLang, t }) => {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-[100dvh]">
      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden mb-20 md:mb-0">
        <div className="h-32 md:h-48 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
          <div className="absolute -bottom-12 md:-bottom-16 left-6 md:left-12">
            <div className="relative">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-24 h-24 md:w-32 md:h-32 rounded-[1.5rem] md:rounded-[2rem] border-4 border-white shadow-xl object-cover"
              />
              <div className="absolute bottom-1 right-1 w-6 h-6 md:w-8 md:h-8 bg-emerald-500 border-4 border-white rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="pt-16 md:pt-20 px-6 md:px-12 pb-8 md:pb-12">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800">{user.name}</h1>
              <p className="text-slate-500 flex items-center gap-2 mt-1 text-sm">
                <i className="fa-solid fa-clock opacity-50"></i>
                {t.memberSince} {new Date(user.joinedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
                {t.editProfile}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-8 md:mt-12">
            <div className="p-5 md:p-6 bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100 text-center md:text-left">
              <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t.yourId}</p>
              <p className="text-xl md:text-2xl font-black text-indigo-600 tracking-widest font-mono">{user.id}</p>
            </div>
            <div className="hidden md:block p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t.callsMade}</p>
              <p className="text-2xl font-black text-slate-800">12</p>
            </div>
            <div className="p-5 md:p-6 bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100 text-center md:text-left">
              <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t.status}</p>
              <p className="text-xl md:text-2xl font-black text-emerald-500">{t.online}</p>
            </div>
          </div>

          {/* Language Selector */}
          <div className="mt-10 md:mt-12">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-language text-indigo-500"></i>
              {t.lang}
            </h3>
            <div className="flex flex-wrap gap-2 md:gap-3">
              {[
                { code: 'en', label: 'English' },
                { code: 'ru', label: 'Русский' },
                { code: 'uz', label: 'O\'zbek' }
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLang(lang.code as Language)}
                  className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold border-2 transition-all ${
                    currentLang === lang.code 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Localized Settings */}
          <div className="mt-10 border-t border-slate-100 pt-10">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <i className="fa-solid fa-gear text-slate-400"></i>
              {t.settings}
            </h3>
            <div className="space-y-3">
              {[
                { label: t.camQuality, value: t.hd, icon: 'fa-camera' },
                { label: t.audioSet, value: t.echo, icon: 'fa-microphone' },
              ].map((setting, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all cursor-pointer group border border-transparent">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-500">
                      <i className={`fa-solid ${setting.icon}`}></i>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{setting.label}</p>
                      <p className="text-xs text-slate-500">{setting.value}</p>
                    </div>
                  </div>
                  <i className="fa-solid fa-chevron-right text-slate-300"></i>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
