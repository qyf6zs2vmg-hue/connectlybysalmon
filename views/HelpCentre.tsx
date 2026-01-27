
import React from 'react';

const HelpCentre: React.FC<{ t: any }> = ({ t }) => {
  const cards = [
    {
      icon: 'fa-shield-check',
      title: 'End-to-End Encryption',
      desc: 'All video and audio streams are encrypted peer-to-peer using WebRTC standards.',
      color: 'bg-emerald-50 text-emerald-600'
    },
    {
      icon: 'fa-user-lock',
      title: 'Anonymous IDs',
      desc: 'No phone numbers or emails required. Connectly uses temporary 4-digit IDs.',
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      icon: 'fa-bolt',
      title: 'Low Latency',
      desc: 'Experience lag-free conversations powered by P2P technology.',
      color: 'bg-amber-50 text-amber-600'
    },
    {
      icon: 'fa-video',
      title: 'HD Quality',
      desc: 'Automatic quality adjustment for the best video experience.',
      color: 'bg-rose-50 text-rose-600'
    }
  ];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <header className="mb-8 md:mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-3">{t.help}</h1>
        <p className="text-slate-500 text-sm md:text-lg">Connectly — Private. Secure. Fast.</p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold border border-indigo-100">
          <i className="fa-solid fa-code"></i>
          {t.developerCredit}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-12 md:mb-16">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-4 md:mb-6 ${card.color}`}>
              <i className={`fa-solid ${card.icon} text-xl md:text-2xl`}></i>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-2 md:mb-3">{card.title}</h3>
            <p className="text-sm md:text-base text-slate-600 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>

      <section className="bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 text-white overflow-hidden relative mb-10">
        <div className="relative z-10 md:w-2/3">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">{t.howToCall}</h2>
          <div className="space-y-6 md:space-y-8">
            <div className="flex gap-4 md:gap-6">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold shrink-0 text-sm">1</div>
              <div>
                <p className="text-slate-300 text-sm md:text-base">{t.step1}</p>
              </div>
            </div>
            <div className="flex gap-4 md:gap-6">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold shrink-0 text-sm">2</div>
              <div>
                <p className="text-slate-300 text-sm md:text-base">{t.step2}</p>
              </div>
            </div>
            <div className="flex gap-4 md:gap-6">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold shrink-0 text-sm">3</div>
              <div>
                <p className="text-slate-300 text-sm md:text-base">{t.step3}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HelpCentre;
