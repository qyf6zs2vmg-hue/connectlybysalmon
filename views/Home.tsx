
import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { User } from '../types';

declare var Peer: any;

interface HomeProps {
  user: User;
  t: any;
}

const Home: React.FC<HomeProps> = ({ user, t }) => {
  const [targetId, setTargetId] = useState('');
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'incoming' | 'connected'>('idle');
  const [incomingCaller, setIncomingCaller] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [peerReady, setPeerReady] = useState(false);

  const location = useLocation();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerInstance = useRef<any>(null);
  const currentCall = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // 1. Инициализация Peer
    const peerId = `connectly_${user.id}`;
    peerInstance.current = new Peer(peerId, {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peerInstance.current.on('open', () => setPeerReady(true));

    // 2. Доступ к камере
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, 
          audio: true 
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Слушаем входящие
        peerInstance.current.on('call', (call: any) => {
          setIncomingCaller(call.peer.replace('connectly_', ''));
          setCallStatus('incoming');
          currentCall.current = call;
        });

      } catch (err) {
        console.error("Media error:", err);
        alert("Пожалуйста, разрешите доступ к камере и микрофону");
      }
    };
    startCamera();

    // Авто-вызов из контактов
    if (location.state?.callId) {
      const cid = location.state.callId;
      setTargetId(cid);
      const timer = setTimeout(() => handleCall(cid), 1500);
      return () => clearTimeout(timer);
    }

    return () => {
      peerInstance.current?.destroy();
      localStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, [user.id]);

  const handleCall = (id: string = targetId) => {
    if (!id || id === user.id || !localStreamRef.current || !peerReady) return;
    setCallStatus('calling');
    const call = peerInstance.current.call(`connectly_${id}`, localStreamRef.current);
    setupCallListeners(call);
    currentCall.current = call;
  };

  const acceptCall = () => {
    if (!currentCall.current || !localStreamRef.current) return;
    currentCall.current.answer(localStreamRef.current);
    setupCallListeners(currentCall.current);
  };

  const setupCallListeners = (call: any) => {
    call.on('stream', (remoteStream: MediaStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      setCallStatus('connected');
    });
    call.on('close', () => endCall());
    call.on('error', (err: any) => {
      console.error("Call error:", err);
      endCall();
    });
  };

  const endCall = () => {
    currentCall.current?.close();
    setCallStatus('idle');
    setIncomingCaller(null);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      track.enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getVideoTracks()[0];
      track.enabled = isVideoOff;
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="relative h-full bg-slate-950 overflow-hidden flex flex-col">
      {/* 1. УДАЛЕННОЕ ВИДЕО (СОБЕСЕДНИК) */}
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
        <video 
          ref={remoteVideoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover transition-opacity duration-500"
          style={{ opacity: callStatus === 'connected' ? 1 : 0 }}
        />
        
        {/* Экран ожидания/статуса */}
        {callStatus !== 'connected' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-900/60 backdrop-blur-md">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 border border-white/10 ${callStatus === 'calling' ? 'animate-pulse bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-slate-400'}`}>
              <i className={`fa-solid ${callStatus === 'calling' ? 'fa-phone-volume' : 'fa-video'} text-3xl`}></i>
            </div>
            <h2 className="text-2xl font-black text-white mb-2">
              {callStatus === 'calling' ? t.isCalling.replace('{id}', targetId) : 
               callStatus === 'incoming' ? t.isIncoming.replace('{id}', incomingCaller) : 
               t.videoChat}
            </h2>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-widest opacity-60">
              {peerReady ? 'Сеть готова' : 'Подключение к серверу...'}
            </p>
          </div>
        )}
      </div>

      {/* 2. ВАШЕ ВИДЕО (PIP) - ВСЕГДА В УГЛУ */}
      <div className="absolute bottom-32 md:bottom-28 right-4 md:right-8 z-40 w-28 md:w-56 aspect-[3/4] rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl transition-all duration-500 bg-slate-800">
        <video 
          ref={localVideoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`w-full h-full object-cover scale-x-[-1] transition-opacity ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
        />
        {isVideoOff && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500">
            <i className="fa-solid fa-video-slash text-2xl"></i>
          </div>
        )}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/60 rounded-full text-[8px] font-bold text-white border border-white/10 uppercase tracking-tighter">
          {user.name} (Вы)
        </div>
      </div>

      {/* 3. ВЕРХНЯЯ ИНФО-ПАНЕЛЬ */}
      <div className="relative z-50 p-4 md:p-8 flex justify-between items-start pointer-events-none">
        <div 
          onClick={() => {
            navigator.clipboard.writeText(user.id);
            setCopyFeedback(true);
            setTimeout(() => setCopyFeedback(false), 2000);
          }}
          className="pointer-events-auto cursor-pointer bg-black/40 backdrop-blur-xl border border-white/10 text-white px-5 py-3 rounded-2xl flex items-center gap-4 hover:bg-black/60 transition-all shadow-2xl active:scale-95"
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-tighter opacity-50">{t.yourId}</span>
            <span className="text-xl font-black tracking-widest font-mono leading-none">{user.id}</span>
          </div>
          <i className={`fa-solid ${copyFeedback ? 'fa-check text-emerald-400' : 'fa-copy opacity-40'}`}></i>
        </div>
      </div>

      {/* 4. ПАНЕЛЬ УПРАВЛЕНИЯ (DOCK) - ПОДНЯТА ВЫШЕ */}
      <div className="absolute bottom-24 md:bottom-8 left-0 right-0 z-50 px-4 md:px-0 flex flex-col items-center pointer-events-none">
        <div className="w-full max-w-lg bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-3 flex flex-col items-center gap-3 pointer-events-auto shadow-2xl">
          
          {/* Поле ввода ID (только когда не в звонке) */}
          {callStatus === 'idle' && (
            <div className="w-full flex items-center bg-white/5 rounded-2xl p-1 border border-white/5">
              <div className="w-10 h-10 flex items-center justify-center text-indigo-400 opacity-50 ml-2">
                <i className="fa-solid fa-hashtag"></i>
              </div>
              <input 
                type="text" 
                inputMode="numeric"
                maxLength={4}
                placeholder={t.enterId}
                className="flex-1 px-2 py-2 outline-none font-mono text-xl tracking-[0.3em] text-white bg-transparent placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:opacity-20"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value.replace(/\D/g, ''))}
              />
              <button 
                onClick={() => handleCall()}
                disabled={targetId.length !== 4 || !peerReady}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 text-white px-6 py-3 rounded-xl font-black transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-2"
              >
                <i className="fa-solid fa-phone"></i>
                <span className="uppercase tracking-widest text-[10px]">{t.call}</span>
              </button>
            </div>
          )}

          {/* Кнопки действий (Микрофон, Камера, Сброс) */}
          <div className="flex items-center justify-center gap-4 py-1">
            {callStatus !== 'idle' && (
              <>
                <button 
                  onClick={toggleMute}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isMuted ? 'bg-rose-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  <i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
                </button>
                <button 
                  onClick={toggleVideo}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isVideoOff ? 'bg-rose-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  <i className={`fa-solid ${isVideoOff ? 'fa-video-slash' : 'fa-video'}`}></i>
                </button>
              </>
            )}

            {callStatus === 'incoming' ? (
              <div className="flex gap-4">
                <button 
                  onClick={acceptCall}
                  className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-emerald-400 transition-all animate-bounce"
                >
                  <i className="fa-solid fa-phone text-xl"></i>
                </button>
                <button 
                  onClick={endCall}
                  className="w-14 h-14 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-red-400 transition-all"
                >
                  <i className="fa-solid fa-phone-slash text-xl"></i>
                </button>
              </div>
            ) : callStatus !== 'idle' ? (
              <button 
                onClick={endCall}
                className="px-8 h-12 md:h-14 bg-red-500 text-white rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:bg-red-400 transition-all active:scale-95"
              >
                <i className="fa-solid fa-phone-slash text-xl"></i>
                <span className="font-black uppercase tracking-widest text-xs">Завершить</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
