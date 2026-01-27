
import React from 'react';

const Products: React.FC<{ t: any }> = ({ t }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 md:w-96 md:h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-700"></div>

      <div className="relative z-10">
        <div className="w-16 h-16 md:w-24 md:h-24 bg-indigo-50 text-indigo-600 rounded-2xl md:rounded-[2rem] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner">
          <i className="fa-solid fa-rocket text-3xl md:text-4xl animate-bounce"></i>
        </div>
        
        <h2 className="text-indigo-600 font-bold uppercase tracking-widest text-sm mb-4">{t.products}</h2>
        
        <h1 className="text-4xl md:text-7xl font-black text-slate-900 mb-4 md:mb-6 tracking-tight">
          {t.comingSoon.split(' ')[0]} <span className="text-indigo-600">{t.comingSoon.split(' ')[1] || ''}</span>
        </h1>
        
        <p className="text-slate-500 text-base md:text-xl max-w-xl mx-auto leading-relaxed mb-8 md:mb-12">
          {t.productsDesc}
        </p>

        <div className="flex flex-col items-center gap-6">
          <button className="px-8 md:px-10 py-3 md:py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">
            {t.notify}
          </button>
          
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
             <p className="text-slate-600 font-semibold text-sm">
               <i className="fa-solid fa-signature mr-2 text-indigo-500"></i>
               {t.developerCredit}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
