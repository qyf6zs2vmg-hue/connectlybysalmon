
import React from 'react';
import { NavLink } from 'react-router-dom';
import { User } from '../types';

interface NavigationProps {
  user: User;
  onLogout: () => void;
  t: any;
}

const Navigation: React.FC<NavigationProps> = ({ user, onLogout, t }) => {
  const navItems = [
    { path: '/', icon: 'fa-video', label: t.home },
    { path: '/contacts', icon: 'fa-address-book', label: t.contacts },
    { path: '/help', icon: 'fa-circle-question', label: t.help },
    { path: '/profile', icon: 'fa-user', label: t.profile },
    { path: '/products', icon: 'fa-box-open', label: t.products },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col h-full shrink-0">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-100">
            <i className="fa-solid fa-link text-xl"></i>
          </div>
          <div>
            <span className="font-bold text-xl text-slate-800 tracking-tight block">Connectly</span>
            <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-tighter">by Salmon Davronov</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200
                ${isActive 
                  ? 'bg-indigo-600 text-white font-semibold shadow-xl shadow-indigo-100 translate-x-1' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800'}
              `}
            >
              <i className={`fa-solid ${item.icon} text-lg w-6 text-center`}></i>
              <span className="text-sm tracking-wide">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100">
          <div className="mb-4 px-2">
            <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-2">
              <i className="fa-solid fa-code text-indigo-500 text-xs"></i>
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest truncate">Salmon Davronov</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-4 border border-slate-100">
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover shadow-sm border-2 border-white" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
              <p className="text-[10px] text-indigo-500 font-mono font-bold tracking-widest">#{user.id}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all group font-bold text-xs"
          >
            <i className="fa-solid fa-right-from-bracket group-hover:translate-x-1 transition-transform"></i>
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Bar - Lowered z-index slightly to let call UI overlap if needed */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 flex justify-around items-center h-20 px-2 z-[100] pb-safe">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="no-underline flex-1"
          >
            {({ isActive }) => (
              <div className={`
                flex flex-col items-center justify-center gap-1 transition-all
                ${isActive ? 'text-indigo-600 scale-105' : 'text-slate-400'}
              `}>
                <i className={`fa-solid ${item.icon} text-lg`}></i>
                <span className="text-[7px] font-black uppercase tracking-tighter truncate">{item.label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default Navigation;
