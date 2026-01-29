
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
  const [permissionError, setPermissionError] = useState<string | null>(null);

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
        remoteVideoRef.current.play().catch(console.error);
      }
    });
    call.on('close', resetCall);
    call.on('error', (err: any) => {
      console.error("Call error:", err);
      resetCall();
    });
  }, [resetCall]);

  const initPeer = useCallback(() => {
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
          { urls: 'stun:stun2.l.google.com:19302' }
        ],
        sdpSemantics: 'unified-plan'
      }
    });

    peer.on('open', () => {
      console.log("Peer signaling open");
      setPeerReady(true);
      setIsSessionStarted(true);
    });

    peer.on('call', (call: any) => {
      console.log("Incoming call from", call.peer);
      setIncomingCaller(call.peer.replace('connectly_', ''));
      setCallStatus('incoming');
      currentCall.current = call;
    });

    peer.on('disconnected', () => {
      console.log("Peer disconnected from server, attempting reconnect...");
      setPeerReady(false);
      peer.reconnect();
    });

    peer.on('error', (err: any) => {
      console.error('PeerJS error type:', err.type, err);
      if (err.type === 'peer-unavailable') {
        alert('Пользователь не найден или не в сети');
        resetCall();
      } else if (err.type === 'server-error' || err.type === 'network') {
        console.log("Network error, retrying in 3s...");
        setPeerReady(false);
        setTimeout(initPeer, 3000);
      }
    });

    peerInstance.current = peer;
  }, [user.id, resetCall]);

  const startSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 } }, 
        audio: true 
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      initPeer();
    } catch (err: any) {
      console.error("Media error:", err);
      setPermissionError(err.message || 'Access Denied');
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

  // Handle auto-calling from contacts
  useEffect(() => {
    if (peerReady && location.state?.callId) {
      handleCall(location.state.callId);
    }
  }, [peerReady, location.state]);

  // Handle visibility change (reconnect when user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isSessionStarted) {
        if (peerInstance.current && peerInstance.current.disconnected) {
          console.log("Tab became visible, reconnecting peer...");
          peerInstance.current.reconnect();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isSessionStarted]);

  useEffect(() => {
    return () => {
      peerInstance.current?.destroy();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  if (!isSessionStarted) {
    return (
      <div className="h-full bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-white">
        <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/20">
          <i className="fa-solid fa-video text-4xl"></i>
        </div>
        <h1 className="text-3xl font-black mb-4 tracking-tight">Connectly Video</h1>
        <p className="text-slate-400 mb-10 max-w-xs leading-relaxed">
          Нажмите кнопку ниже, чтобы запустить систему. Это активирует P2P протокол для звонков.
        </p>
        
        {permissionError && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-6 text-red-400 text-sm">
            Ошибка: {permissionError}. Проверьте доступ к камере.
          </div>
        )}

        <button 
          onClick={startSession}
          className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-50 text-white hover:text-indigo-600 py-5 rounded-3xl font-black text-lg shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
        >
          Запустить сессию
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-black overflow-hidden flex flex-col">
      <video 
        ref={remoteVideoRef} 
        autoPlay 
        playsInline 
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-500 ${callStatus === 'connected' ? 'opacity-100' : 'opacity-0'}`}
      />

      {callStatus !== 'connected' && (
        <div className="absolute inset-0 bg-white z-0 flex flex-col items-center justify-center p-6 text-center">
           {!peerReady && isSessionStarted ? (
             <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Восстановление связи...</p>
             </div>
           ) : (
             <>
               <div className={`w-32 h-32 rounded-[3rem] bg-slate-50 border border-slate-100 shadow-xl flex items-center justify-center mb-8 ${callStatus === 'calling' ? 'animate-pulse text-indigo-600' : 'text-slate-200'}`}>
                  <i className={`fa-solid ${callStatus === 'calling' ? 'fa-phone-volume' : 'fa-video'} text-5xl`}></i>
               </div>
               <h2 className="text-3xl font-black text-slate-800 mb-2">
                 {callStatus === 'calling' ? 'Звоним...' : callStatus === 'incoming' ? 'Входящий звонок' : 'Готов к общению'}
               </h2>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Система активна</p>
               </div>
             </>
           )}
        </div>
      )}

      <div className="relative z-50 p-6 pointer-events-none">
        <div 
          onClick={() => {
            navigator.clipboard.writeText(user.id);
            setCopyFeedback(true);
            setTimeout(() => setCopyFeedback(false), 2000);
          }}
          className="pointer-events-auto inline-flex bg-white/90 backdrop-blur-xl border border-slate-200 rounded-[2rem] px-6 py-3 items-center gap-4 shadow-xl shadow-black/5 active:scale-95 transition-transform"
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{t.yourId}</span>
            <span className="text-2xl font-mono font-black text-slate-800 tracking-[0.2em]">{user.id}</span>
          </div>
          <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <i className={`fa-solid ${copyFeedback ? 'fa-check text-emerald-500' : 'fa-copy'}`}></i>
          </div>
        </div>
      </div>

      <div className={`absolute z-40 transition-all duration-700 shadow-2xl overflow-hidden bg-slate-200
        ${callStatus === 'idle' 
          ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-[65%] w-64 md:w-80 aspect-[3/4] rounded-[3.5rem] border-8 border-white' 
          : 'bottom-48 right-6 w-32 md:w-56 aspect-[3/4] rounded-3xl border-4 border-white'
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

      <div className="absolute bottom-32 md:bottom-10 left-0 right-0 z-[100] px-4 flex flex-col items-center pointer-events-none">
        <div className="w-full max-w-sm bg-white border border-slate-100 rounded-[3rem] p-3 pointer-events-auto shadow-[0_30px_60px_-15px_rgba(0,0,0,0.25)] flex flex-col gap-3">
          
          {callStatus === 'idle' && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-16 bg-slate-50 rounded-[1.8rem] flex items-center px-6 border-2 border-transparent focus-within:border-indigo-600/10 transition-all">
                <span className="text-slate-300 mr-3 text-2xl font-mono">#</span>
                <input 
                  type="text" 
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="ID"
                  className="w-full bg-transparent text-3xl font-mono font-black outline-none text-slate-800 tracking-widest"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <button 
                onClick={() => handleCall()}
                disabled={targetId.length !== 4 || !peerReady}
                className="h-16 px-8 bg-indigo-600 text-white rounded-[1.8rem] font-black shadow-lg shadow-indigo-200 disabled:opacity-20 active:scale-95 transition-all"
              >
                ВЫЗОВ
              </button>
            </div>
          )}

          {callStatus !== 'idle' && (
            <div className="flex items-center justify-between px-2 h-20">
              <div className="flex gap-4">
                 <button className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500">
                    <i className="fa-solid fa-microphone"></i>
                 </button>
                 <button className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500">
                    <i className="fa-solid fa-camera-rotate"></i>
                 </button>
              </div>

              {callStatus === 'incoming' ? (
                <div className="flex gap-4">
                  <button onClick={acceptCall} className="w-16 h-16 bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-200 animate-bounce">
                    <i className="fa-solid fa-phone text-2xl"></i>
                  </button>
                  <button onClick={resetCall} className="w-16 h-16 bg-rose-500 text-white rounded-2xl shadow-xl shadow-rose-200">
                    <i className="fa-solid fa-phone-slash text-2xl"></i>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={resetCall}
                  className="bg-rose-500 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-rose-200 active:scale-95"
                >
                  <i className="fa-solid fa-phone-slash text-xl"></i>
                  <span className="text-xs tracking-widest uppercase">Завершить</span>
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
