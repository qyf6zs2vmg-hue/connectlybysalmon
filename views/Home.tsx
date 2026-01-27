
import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { User } from '../types';

declare var Peer: any; // PeerJS from index.html

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

  const location = useLocation();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerInstance = useRef<any>(null);
  const currentCall = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const peerId = `connectly_${user.id}`;
    peerInstance.current = new Peer(peerId);

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, 
          audio: true 
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        
        peerInstance.current.on('call', (call: any) => {
          setIncomingCaller(call.peer.replace('connectly_', ''));
          setCallStatus('incoming');
          currentCall.current = call;
        });

        if (location.state && location.state.callId) {
          const autoCallId = location.state.callId;
          setTargetId(autoCallId);
          setTimeout(() => handleCall(autoCallId), 500);
        }
      } catch (err) {
        console.error("Media access error:", err);
      }
    };
    startCamera();

    return () => {
      peerInstance.current?.destroy();
      localStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, [user.id]);

  const handleCall = (id: string = targetId) => {
    if (!id || id === user.id || !localStreamRef.current) return;
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
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      setCallStatus('connected');
    });
    call.on('close', () => endCall());
    call.on('error', () => endCall());
  };

  const endCall = () => {
    currentCall.current?.close();
    setCallStatus('idle');
    setIncomingCaller(null);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks()[0].enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks()[0].enabled = isVideoOff;
      setIsVideoOff(!isVideoOff);
    }
  };

  const isCallActive = callStatus !== 'idle';

  return (
    <div className="relative h-full bg-slate-900 overflow-hidden flex flex-col">
      {/* 1. BACKGROUND / REMOTE VIDEO */}
      <div className="absolute inset-0 z-0 bg-slate-950">
        <video 
          ref={remoteVideoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover transition-all duration-1000"
          style={{ opacity: callStatus === 'connected' ? 1 : 0.1, filter: callStatus === 'connected' ? 'none' : 'blur(20px)' }}
        />
        
        {/* Overlay Info when not connected */}
        {callStatus !== 'connected' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 text-center bg-black/20">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-white/5 border border-white/10 ${callStatus === 'calling' ? 'animate-pulse text-indigo-400' : 'text-slate-500'}`}>
              <i className={`fa-solid ${callStatus === 'calling' ? 'fa-phone-volume' : 'fa-video'} text-3xl`}></i>
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-white mb-2">
              {callStatus === 'calling' ? t.isCalling.replace('{id}', targetId) : 
               callStatus === 'incoming' ? t.isIncoming.replace('{id}', incomingCaller) : 
               t.videoChat}
            </h2>
            <p className="text-slate-400 text-sm md:text-base font-medium max-w-xs">{t.connectId}</p>
          </div>
        )}
      </div>

      {/* 2. TOP BAR (ID DISPLAY) */}
      <div className="relative z-50 p-6 flex justify-between items-start pointer-events-none">
        <div 
          onClick={() => {
            navigator.clipboard.writeText(user.id);
            setCopyFeedback(true);
            setTimeout(() => setCopyFeedback(false), 2000);
          }}
          className="pointer-events-auto cursor-pointer bg-white/10 backdrop-blur-xl border border-white/20 text-white px-5 py-3 rounded-2xl flex items-center gap-4 transition-all hover:bg-white/20 shadow-2xl active:scale-95"
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-tighter opacity-50">{t.yourId}</span>
            <span className="text-xl font-black tracking-[0.2em] font-mono leading-none">{user.id}</span>
          </div>
          <i className={`fa-solid ${copyFeedback ? 'fa-check text-emerald-400' : 'fa-copy opacity-40'}`}></i>
        </div>
        
        <div className="pointer-events-auto bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${callStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Connectly Live</span>
        </div>
      </div>

      {/* 3. LOCAL VIDEO (PIP) - Fixed Corner Positioning */}
      <div 
        className={`absolute z-40 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden shadow-2xl
          ${isCallActive 
            ? 'bottom-28 right-6 w-32 md:w-56 aspect-[3/4] rounded-3xl border-2 border-white/20 ring-4 ring-black/20' 
            : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 md:w-80 aspect-[3/4] rounded-[3rem] border-8 border-white/5 ring-1 ring-white/10'
          }`}
      >
        <video 
          ref={localVideoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`w-full h-full object-cover bg-slate-800 scale-x-[-1] transition-opacity duration-300 ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
        />
        {isVideoOff && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-slate-500 gap-2">
            <i className="fa-solid fa-video-slash text-2xl"></i>
            <span className="text-[10px] font-bold uppercase">Camera Off</span>
          </div>
        )}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[9px] font-bold text-white border border-white/10 uppercase tracking-widest shadow-lg">
          {user.name}
        </div>
      </div>

      {/* 4. CONTROL DOCK (Bottom Panel) */}
      <div className="absolute bottom-0 left-0 right-0 z-50 p-6 flex flex-col items-center pointer-events-none">
        <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-4 flex flex-col md:flex-row items-center gap-4 pointer-events-auto shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.5)]">
          
          {/* Dialing Area (Idle Only) */}
          {callStatus === 'idle' ? (
            <div className="flex-1 w-full flex items-center bg-white/5 rounded-2xl p-1 border border-white/5">
              <div className="w-10 h-10 flex items-center justify-center text-indigo-400 opacity-50 ml-2">
                <i className="fa-solid fa-hashtag text-lg"></i>
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
                disabled={targetId.length !== 4}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 text-white px-8 py-3 rounded-xl font-black transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-2"
              >
                <i className="fa-solid fa-phone"></i>
                <span className="uppercase tracking-widest text-xs">{t.call}</span>
              </button>
            </div>
          ) : (
            <div className="flex-1 hidden md:flex items-center px-4">
               <span className="text-white/40 text-xs font-bold uppercase tracking-widest">
                  {callStatus === 'connected' ? 'Session Secure • P2P' : 'Establishing Connection...'}
               </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Mute/Video Toggles (Show when connected/calling) */}
            {isCallActive && (
              <>
                <button 
                  onClick={toggleMute}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isMuted ? 'bg-rose-500/20 text-rose-500 border-rose-500/40 border' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'}`}
                >
                  <i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
                </button>
                <button 
                  onClick={toggleVideo}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isVideoOff ? 'bg-rose-500/20 text-rose-500 border-rose-500/40 border' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'}`}
                >
                  <i className={`fa-solid ${isVideoOff ? 'fa-video-slash' : 'fa-video'}`}></i>
                </button>
              </>
            )}

            {/* Accept / Decline Logic */}
            {callStatus === 'incoming' ? (
              <>
                <button 
                  onClick={acceptCall}
                  className="w-12 h-12 md:w-14 md:h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-all animate-bounce"
                >
                  <i className="fa-solid fa-phone text-xl"></i>
                </button>
                <button 
                  onClick={endCall}
                  className="w-12 h-12 md:w-14 md:h-14 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 hover:bg-red-400 transition-all"
                >
                  <i className="fa-solid fa-phone-slash text-xl"></i>
                </button>
              </>
            ) : isCallActive ? (
              <button 
                onClick={endCall}
                className="px-6 md:px-8 h-12 md:h-14 bg-red-500 text-white rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-red-500/30 hover:bg-red-400 transition-all active:scale-95"
              >
                <i className="fa-solid fa-phone-slash text-xl"></i>
                <span className="font-black uppercase tracking-widest text-xs hidden md:inline">End Call</span>
              </button>
            ) : null}
          </div>
        </div>
        
        {/* Footer Credit */}
        <div className="mt-4 mb-20 md:mb-0 text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">
          Powered by WebRTC • Salmon Davronov
        </div>
      </div>
    </div>
  );
};

export default Home;
