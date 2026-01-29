
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [peerReady, setPeerReady] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerInstance = useRef<any>(null);
  const currentCall = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const location = useLocation();

  const resetCall = useCallback(() => {
    if (currentCall.current) {
      currentCall.current.close();
    }
    setCallStatus('idle');
    setIncomingCaller(null);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, []);

  const setupCall = useCallback((call: any) => {
    currentCall.current = call;
    call.on('stream', (remoteStream: MediaStream) => {
      setCallStatus('connected');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        // Forces mobile browsers to render the stream
        setTimeout(() => {
          remoteVideoRef.current?.play().catch(console.error);
        }, 100);
      }
    });
    call.on('close', resetCall);
    call.on('error', (err: any) => {
      console.error("Call Error:", err);
      resetCall();
    });
  }, [resetCall]);

  const initPeer = useCallback(() => {
    if (typeof Peer === 'undefined') {
      setErrorMsg("PeerJS library failed to load. Please check your internet connection.");
      return;
    }

    const peerId = `connectly_${user.id}`;
    
    if (peerInstance.current) {
      peerInstance.current.destroy();
    }

    const peer = new Peer(peerId, {
      debug: 2,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ],
        sdpSemantics: 'unified-plan'
      }
    });

    peer.on('open', (id: string) => {
      console.log("Peer signaling open with ID:", id);
      setPeerReady(true);
      setIsSessionStarted(true);
      setErrorMsg(null);
    });

    peer.on('call', (call: any) => {
      setIncomingCaller(call.peer.replace('connectly_', ''));
      setCallStatus('incoming');
      currentCall.current = call;
    });

    peer.on('disconnected', () => {
      console.log("Signaling disconnected. Attempting reconnect...");
      setPeerReady(false);
      peer.reconnect();
    });

    peer.on('error', (err: any) => {
      console.error('PeerJS Event Error:', err.type);
      if (err.type === 'peer-unavailable') {
        alert('Пользователь сейчас не в сети');
        resetCall();
      } else if (err.type === 'network' || err.type === 'server-error') {
        setPeerReady(false);
        setErrorMsg("Проблема с сетью. Пробуем восстановить...");
        setTimeout(initPeer, 5000);
      }
    });

    peerInstance.current = peer;
  }, [user.id, resetCall]);

  const startSession = async () => {
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setErrorMsg("Для работы камеры необходим HTTPS протокол.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user', 
          width: { ideal: 640 },
          height: { ideal: 480 }
        }, 
        audio: true 
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(console.error);
      }
      initPeer();
    } catch (err: any) {
      console.error("Camera Error:", err);
      setErrorMsg(err.name === 'NotAllowedError' ? 'Доступ к камере отклонен' : 'Камера не найдена или занята');
    }
  };

  const handleCall = (id: string = targetId) => {
    if (!id || !peerReady || !localStreamRef.current || !peerInstance.current) return;
    setCallStatus('calling');
    const call = peerInstance.current.call(`connectly_${id}`, localStreamRef.current);
    setupCall(call);
  };

  const acceptCall = () => {
    if (!currentCall.current || !localStreamRef.current) return;
    currentCall.current.answer(localStreamRef.current);
    setupCall(currentCall.current);
  };

  useEffect(() => {
    if (peerReady && location.state?.callId) {
      handleCall(location.state.callId);
    }
  }, [peerReady, location.state]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isSessionStarted && peerInstance.current?.disconnected) {
        peerInstance.current.reconnect();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      peerInstance.current?.destroy();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [isSessionStarted]);

  if (!isSessionStarted) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-white z-[999]">
        <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/20 animate-pulse">
          <i className="fa-solid fa-video text-4xl"></i>
        </div>
        <h1 className="text-3xl font-black mb-4">Connectly</h1>
        <p className="text-slate-400 mb-10 max-w-xs text-sm leading-relaxed">
          Чтобы начать общение по P2P каналу, необходимо запустить сессию и разрешить доступ к камере.
        </p>
        
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl mb-6 text-rose-400 text-xs font-bold">
            <i className="fa-solid fa-triangle-exclamation mr-2"></i>
            {errorMsg}
          </div>
        )}

        <button 
          onClick={startSession}
          className="w-full max-w-xs bg-white text-slate-900 py-5 rounded-[2rem] font-black text-lg shadow-xl active:scale-95 transition-all"
        >
          Запустить сессию
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* REMOTE VIDEO (The Person you are talking to) */}
      <video 
        ref={remoteVideoRef} 
        autoPlay 
        playsInline 
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-700 ${callStatus === 'connected' ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* BACKGROUND (When no active video) */}
      {callStatus !== 'connected' && (
        <div className="absolute inset-0 bg-white z-0 flex flex-col items-center justify-center p-6 text-center">
           {!peerReady ? (
             <div className="flex flex-col items-center">
                <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                <p className="text-slate-800 font-black uppercase tracking-widest text-xs">Подключение к сети...</p>
             </div>
           ) : (
             <>
               <div className={`w-32 h-32 rounded-[3.5rem] bg-slate-50 border border-slate-100 shadow-xl flex items-center justify-center mb-8 ${callStatus === 'calling' ? 'animate-bounce text-indigo-600' : 'text-slate-200'}`}>
                  <i className={`fa-solid ${callStatus === 'calling' ? 'fa-phone-volume' : 'fa-video'} text-5xl`}></i>
               </div>
               <h2 className="text-3xl font-black text-slate-800 mb-2">
                 {callStatus === 'calling' ? 'Вызов...' : callStatus === 'incoming' ? 'Входящий звонок' : 'Готов к звонку'}
               </h2>
               <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 rounded-full">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <p className="text-emerald-700 text-[10px] font-black uppercase tracking-widest">P2P Network Active</p>
               </div>
             </>
           )}
        </div>
      )}

      {/* UI OVERLAY */}
      <div className="relative z-50 p-6 flex justify-between items-start pointer-events-none pt-safe">
        <div 
          onClick={() => {
            navigator.clipboard.writeText(user.id);
            setCopyFeedback(true);
            setTimeout(() => setCopyFeedback(false), 2000);
          }}
          className="pointer-events-auto cursor-pointer bg-white/95 backdrop-blur-xl border border-slate-200 rounded-[2rem] px-6 py-3 flex items-center gap-4 shadow-xl active:scale-95 transition-transform"
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{t.yourId}</span>
            <span className="text-2xl font-mono font-black text-slate-800 tracking-widest">{user.id}</span>
          </div>
          <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <i className={`fa-solid ${copyFeedback ? 'fa-check text-emerald-500' : 'fa-copy'}`}></i>
          </div>
        </div>
      </div>

      {/* SELF PREVIEW */}
      <div className={`absolute z-40 transition-all duration-700 shadow-2xl overflow-hidden bg-slate-100
        ${callStatus === 'idle' 
          ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-64 md:w-80 aspect-[3/4] rounded-[3.5rem] border-8 border-white' 
          : 'bottom-44 right-6 w-28 md:w-56 aspect-[3/4] rounded-3xl border-4 border-white'
        }`}
      >
        <video 
          ref={localVideoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover scale-x-[-1]"
        />
      </div>

      {/* CONTROL PANEL */}
      <div className="absolute bottom-32 md:bottom-10 left-0 right-0 z-[100] px-4 flex flex-col items-center pointer-events-none pb-safe">
        <div className="w-full max-w-sm bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-[2.5rem] p-3 pointer-events-auto shadow-2xl flex flex-col gap-3">
          
          {callStatus === 'idle' && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-14 bg-slate-50 rounded-[1.5rem] flex items-center px-5 border border-slate-100">
                <span className="text-slate-300 mr-2 text-xl font-mono">#</span>
                <input 
                  type="text" 
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="ID"
                  className="w-full bg-transparent text-2xl font-mono font-black outline-none text-slate-800 tracking-widest"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <button 
                onClick={() => handleCall()}
                disabled={targetId.length !== 4 || !peerReady}
                className="h-14 px-8 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-lg shadow-indigo-100 disabled:opacity-30 active:scale-95 transition-all"
              >
                CALL
              </button>
            </div>
          )}

          {callStatus !== 'idle' && (
            <div className="flex items-center justify-between px-2 h-16">
              <div className="flex gap-3">
                 <button className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                    <i className="fa-solid fa-microphone"></i>
                 </button>
                 <button className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                    <i className="fa-solid fa-camera-rotate"></i>
                 </button>
              </div>

              {callStatus === 'incoming' ? (
                <div className="flex gap-3">
                  <button onClick={acceptCall} className="w-14 h-14 bg-emerald-500 text-white rounded-xl shadow-xl shadow-emerald-200 animate-pulse">
                    <i className="fa-solid fa-phone text-xl"></i>
                  </button>
                  <button onClick={resetCall} className="w-14 h-14 bg-rose-500 text-white rounded-xl shadow-xl shadow-rose-200">
                    <i className="fa-solid fa-phone-slash text-xl"></i>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={resetCall}
                  className="bg-rose-500 text-white px-8 h-14 rounded-xl font-black flex items-center gap-3 shadow-xl active:scale-95 transition-all"
                >
                  <i className="fa-solid fa-phone-slash text-xl"></i>
                  <span className="text-xs font-black uppercase tracking-widest">End Call</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
