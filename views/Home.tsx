
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
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const location = useLocation();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerInstance = useRef<any>(null);
  const currentCall = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // 1. Core Initialization: Permissions -> PeerJS
  useEffect(() => {
    const startApp = async () => {
      try {
        // Request permissions first - this triggers the system prompt
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 640 } }, 
          audio: true 
        });
        
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(e => console.error("Local play failed", e));
        }

        // Initialize PeerJS with a persistent ID
        const peerId = `connectly_${user.id}`;
        peerInstance.current = new Peer(peerId, {
          debug: 2,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:stun3.l.google.com:19302' },
              { urls: 'stun:stun4.l.google.com:19302' }
            ]
          }
        });

        peerInstance.current.on('open', (id: string) => {
          console.log('Peer connected with ID:', id);
          setPeerReady(true);
        });

        peerInstance.current.on('call', (call: any) => {
          console.log('Incoming call from:', call.peer);
          setIncomingCaller(call.peer.replace('connectly_', ''));
          setCallStatus('incoming');
          currentCall.current = call;
        });

        peerInstance.current.on('error', (err: any) => {
          console.error('PeerJS error:', err.type, err);
          if (err.type === 'peer-unavailable') {
            alert("User not found or offline");
            endCall();
          }
        });

      } catch (err: any) {
        console.error("Initialization error:", err);
        setPermissionError(err.message || "Camera/Mic access denied");
      }
    };

    startApp();

    return () => {
      peerInstance.current?.destroy();
      localStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, [user.id]);

  // Handle auto-calling from contacts
  useEffect(() => {
    if (peerReady && location.state?.callId) {
      handleCall(location.state.callId);
    }
  }, [peerReady, location.state]);

  const handleCall = (id: string = targetId) => {
    if (!id || id === user.id || !localStreamRef.current || !peerReady) return;
    
    console.log('Starting call to:', id);
    setCallStatus('calling');
    const call = peerInstance.current.call(`connectly_${id}`, localStreamRef.current);
    setupCallListeners(call);
    currentCall.current = call;
  };

  const acceptCall = () => {
    if (!currentCall.current || !localStreamRef.current) return;
    console.log('Accepting call');
    currentCall.current.answer(localStreamRef.current);
    setupCallListeners(currentCall.current);
  };

  const setupCallListeners = (call: any) => {
    call.on('stream', (remoteStream: MediaStream) => {
      console.log('Received remote stream');
      setCallStatus('connected');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        // Important for mobile: explicitly call play()
        remoteVideoRef.current.play().catch(e => console.error("Remote play failed", e));
      }
    });
    
    call.on('close', () => endCall());
    call.on('error', (e: any) => {
      console.error("Call error:", e);
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

  if (permissionError) {
    return (
      <div className="h-full bg-white flex flex-col items-center justify-center p-10 text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <i className="fa-solid fa-triangle-exclamation text-3xl"></i>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-500 text-sm mb-8">Please enable camera and microphone in your browser settings to use Connectly.</p>
        <button onClick={() => window.location.reload()} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-white overflow-hidden flex flex-col">
      {/* REMOTE VIDEO (Background when connected) */}
      <div className={`absolute inset-0 z-0 transition-colors duration-500 ${callStatus === 'connected' ? 'bg-black' : 'bg-white'}`}>
        <video 
          ref={remoteVideoRef} 
          autoPlay 
          playsInline 
          className={`w-full h-full object-cover transition-opacity duration-700 ${callStatus === 'connected' ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {/* Waiting State UI */}
        {callStatus !== 'connected' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-6 bg-slate-50 border border-slate-100 shadow-xl ${callStatus === 'calling' ? 'animate-bounce text-indigo-600' : 'text-slate-300'}`}>
              <i className={`fa-solid ${callStatus === 'calling' ? 'fa-phone-volume' : 'fa-video'} text-4xl`}></i>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">
              {callStatus === 'calling' ? t.isCalling.replace('{id}', targetId) : 
               callStatus === 'incoming' ? t.isIncoming.replace('{id}', incomingCaller) : 
               t.videoChat}
            </h2>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
               <div className={`w-2 h-2 rounded-full bg-emerald-500 ${peerReady ? 'animate-pulse' : 'bg-slate-300'}`}></div>
               <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                 {peerReady ? 'Secure Network Ready' : 'Connecting...'}
               </span>
            </div>
          </div>
        )}
      </div>

      {/* TOP ID BOX */}
      <div className="relative z-50 p-5 flex justify-between items-start pointer-events-none">
        <div 
          onClick={() => {
            navigator.clipboard.writeText(user.id);
            setCopyFeedback(true);
            setTimeout(() => setCopyFeedback(false), 2000);
          }}
          className="pointer-events-auto cursor-pointer bg-white/90 backdrop-blur-xl border border-slate-200 p-4 rounded-3xl flex items-center gap-4 shadow-xl active:scale-95 transition-transform"
        >
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider">{t.yourId}</span>
            <span className="text-xl font-mono font-black text-slate-800 tracking-widest">{user.id}</span>
          </div>
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
            <i className={`fa-solid ${copyFeedback ? 'fa-check text-emerald-500' : 'fa-copy'}`}></i>
          </div>
        </div>
      </div>

      {/* LOCAL PIP VIDEO - Raised for mobile */}
      <div className={`absolute z-40 transition-all duration-700 shadow-2xl overflow-hidden bg-slate-200
        ${callStatus === 'idle' 
          ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-60 aspect-[3/4] rounded-[3rem] border-8 border-white' 
          : 'bottom-48 right-4 w-28 md:w-48 aspect-[3/4] rounded-2xl border-4 border-white'
        }`}
      >
        <video 
          ref={localVideoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`w-full h-full object-cover scale-x-[-1] transition-opacity ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
        />
        {isVideoOff && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400">
            <i className="fa-solid fa-video-slash text-2xl"></i>
          </div>
        )}
      </div>

      {/* CALL CONTROLS - Positioned to be CLEAR of mobile navigation */}
      <div className="absolute bottom-40 md:bottom-10 left-0 right-0 z-50 px-4 flex flex-col items-center pointer-events-none">
        <div className="w-full max-w-sm bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-[2.5rem] p-3 flex flex-col gap-4 pointer-events-auto shadow-2xl">
          
          {callStatus === 'idle' && (
            <div className="flex gap-2">
              <div className="flex-1 bg-slate-50 rounded-2xl flex items-center px-4 border border-slate-100">
                <span className="text-slate-300 mr-2 text-xl font-mono">#</span>
                <input 
                  type="text" 
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="ID"
                  className="w-full bg-transparent py-3 text-xl font-mono font-bold outline-none text-slate-800"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <button 
                onClick={() => handleCall()}
                disabled={targetId.length !== 4 || !peerReady}
                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-indigo-100 disabled:opacity-30 active:scale-95 transition-transform"
              >
                {t.call}
              </button>
            </div>
          )}

          {callStatus !== 'idle' && (
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex gap-3">
                <button 
                  onClick={toggleMute}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isMuted ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  <i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
                </button>
                <button 
                  onClick={toggleVideo}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isVideoOff ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  <i className={`fa-solid ${isVideoOff ? 'fa-video-slash' : 'fa-video'}`}></i>
                </button>
              </div>

              {callStatus === 'incoming' ? (
                <div className="flex gap-3">
                  <button onClick={acceptCall} className="w-12 h-12 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-100 animate-pulse">
                    <i className="fa-solid fa-phone"></i>
                  </button>
                  <button onClick={endCall} className="w-12 h-12 bg-rose-500 text-white rounded-xl">
                    <i className="fa-solid fa-phone-slash"></i>
                  </button>
                </div>
              ) : (
                <button onClick={endCall} className="bg-rose-500 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 active:scale-95 transition-transform">
                  <i className="fa-solid fa-phone-slash"></i>
                  <span className="text-xs uppercase tracking-widest">End</span>
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
