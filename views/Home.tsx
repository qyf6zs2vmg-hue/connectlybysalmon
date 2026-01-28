
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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const location = useLocation();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerInstance = useRef<any>(null);
  const currentCall = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Function to initialize camera and PeerJS
  const initApp = async () => {
    try {
      // 1. Request Camera/Mic Permissions immediately (System Prompt)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user', 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        }, 
        audio: { echoCancellation: true, noiseSuppression: true } 
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setHasPermission(true);

      // 2. Setup PeerJS after permission is granted
      const peerId = `connectly_${user.id}`;
      peerInstance.current = new Peer(peerId, {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' }
          ]
        }
      });

      peerInstance.current.on('open', () => setPeerReady(true));

      // Handle Incoming Calls
      peerInstance.current.on('call', (call: any) => {
        setIncomingCaller(call.peer.replace('connectly_', ''));
        setCallStatus('incoming');
        currentCall.current = call;
      });

    } catch (err) {
      console.error("Permission denied or Camera error:", err);
      setHasPermission(false);
    }
  };

  useEffect(() => {
    initApp();

    if (location.state?.callId) {
      const cid = location.state.callId;
      setTargetId(cid);
      const tId = setTimeout(() => handleCall(cid), 1500);
      return () => clearTimeout(tId);
    }

    return () => {
      peerInstance.current?.destroy();
      localStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, [user.id]);

  const handleCall = (id: string = targetId) => {
    if (!id || id === user.id || !localStreamRef.current || !peerReady) return;
    setCallStatus('calling');
    
    // Create the call
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
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOff;
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  // Permission Guard UI
  if (hasPermission === false) {
    return (
      <div className="h-full bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
          <i className="fa-solid fa-video-slash text-4xl"></i>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-4">Access Required</h1>
        <p className="text-slate-500 mb-8 max-w-xs">We need camera and microphone access to enable video calls.</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100"
        >
          Enable in System Settings
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-white overflow-hidden flex flex-col">
      {/* REMOTE VIDEO CONTAINER */}
      <div className={`absolute inset-0 z-0 transition-all duration-700 ${callStatus === 'connected' ? 'bg-black' : 'bg-white'}`}>
        <video 
          ref={remoteVideoRef} 
          autoPlay 
          playsInline 
          className={`w-full h-full object-cover transition-opacity duration-700 ${callStatus === 'connected' ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {/* Waiting / Idle Screen */}
        {callStatus !== 'connected' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <div className={`w-32 h-32 rounded-[3rem] flex items-center justify-center mb-10 bg-white border-2 border-slate-100 shadow-2xl ${callStatus === 'calling' ? 'animate-pulse text-indigo-600' : 'text-slate-200'}`}>
              <i className={`fa-solid ${callStatus === 'calling' ? 'fa-phone-volume' : 'fa-video'} text-5xl`}></i>
            </div>
            <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tight">
              {callStatus === 'calling' ? t.isCalling.replace('{id}', targetId) : 
               callStatus === 'incoming' ? t.isIncoming.replace('{id}', incomingCaller) : 
               t.videoChat}
            </h2>
            <div className="flex items-center gap-3 px-6 py-2.5 bg-indigo-50/50 rounded-full border border-indigo-100 shadow-sm">
               <div className={`w-2.5 h-2.5 rounded-full ${peerReady ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
               <p className="text-indigo-700 text-xs font-black uppercase tracking-widest">
                 {peerReady ? 'Server Online' : 'Connecting to Mesh...'}
               </p>
            </div>
          </div>
        )}
      </div>

      {/* TOP BAR: YOUR ID */}
      <div className="relative z-50 p-6 flex justify-between items-start pointer-events-none">
        <div 
          onClick={() => {
            navigator.clipboard.writeText(user.id);
            setCopyFeedback(true);
            setTimeout(() => setCopyFeedback(false), 2000);
          }}
          className="pointer-events-auto cursor-pointer bg-white/90 backdrop-blur-2xl border border-slate-200 text-slate-800 px-6 py-4 rounded-[2rem] flex items-center gap-5 hover:border-indigo-400 transition-all shadow-xl active:scale-95"
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">{t.yourId}</span>
            <span className="text-2xl font-black tracking-[0.2em] font-mono leading-none">{user.id}</span>
          </div>
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <i className={`fa-solid ${copyFeedback ? 'fa-check text-emerald-500' : 'fa-copy text-indigo-400'}`}></i>
          </div>
        </div>
      </div>

      {/* LOCAL VIDEO (PIP) - REPOSITIONED HIGHER TO AVOID NAV OVERLAP */}
      <div className={`absolute z-40 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] overflow-hidden bg-slate-100
        ${callStatus === 'idle' 
          ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 md:w-96 aspect-[3/4] rounded-[3.5rem] border-[12px] border-white' 
          : 'bottom-48 right-6 w-32 md:w-56 aspect-[3/4] rounded-3xl border-4 border-white'
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
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-200">
            <i className="fa-solid fa-video-slash text-4xl"></i>
          </div>
        )}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest">
          {user.name}
        </div>
      </div>

      {/* CONTROL DOCK - POSITIONED HIGH ENOUGH FOR MOBILE NAV */}
      <div className="absolute bottom-32 md:bottom-12 left-0 right-0 z-[60] px-4 md:px-8 flex flex-col items-center pointer-events-none">
        <div className="w-full max-w-lg bg-white/95 backdrop-blur-3xl border-2 border-slate-100 rounded-[3rem] p-4 flex flex-col items-center gap-5 pointer-events-auto shadow-[0_40px_80px_-15px_rgba(0,0,0,0.2)]">
          
          {/* Dialer: Visible when IDLE */}
          {callStatus === 'idle' && (
            <div className="w-full flex items-center bg-slate-50 rounded-[1.8rem] p-2 border-2 border-transparent focus-within:border-indigo-600/20 transition-all">
              <div className="w-12 h-12 flex items-center justify-center text-indigo-600 ml-2">
                <i className="fa-solid fa-hashtag text-2xl"></i>
              </div>
              <input 
                type="text" 
                inputMode="numeric"
                maxLength={4}
                placeholder={t.enterId}
                className="flex-1 px-2 py-2 outline-none font-mono text-3xl tracking-[0.3em] text-slate-800 bg-transparent placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:text-slate-300"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value.replace(/\D/g, ''))}
              />
              <button 
                onClick={() => handleCall()}
                disabled={targetId.length !== 4 || !peerReady}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-20 text-white px-10 py-5 rounded-[1.5rem] font-black transition-all shadow-xl shadow-indigo-200 active:scale-95 flex items-center gap-3"
              >
                <i className="fa-solid fa-phone"></i>
                <span className="uppercase tracking-[0.1em] text-xs">{t.call}</span>
              </button>
            </div>
          )}

          {/* Call Controls */}
          <div className="flex items-center justify-center gap-6">
            {callStatus !== 'idle' && (
              <>
                <button 
                  onClick={toggleMute}
                  className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all ${isMuted ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600 shadow-inner'}`}
                >
                  <i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'} text-2xl`}></i>
                </button>
                <button 
                  onClick={toggleVideo}
                  className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all ${isVideoOff ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600 shadow-inner'}`}
                >
                  <i className={`fa-solid ${isVideoOff ? 'fa-video-slash' : 'fa-video'} text-2xl`}></i>
                </button>
              </>
            )}

            {callStatus === 'incoming' ? (
              <div className="flex gap-6">
                <button onClick={acceptCall} className="w-20 h-20 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-200 animate-bounce">
                  <i className="fa-solid fa-phone text-3xl"></i>
                </button>
                <button onClick={endCall} className="w-20 h-20 bg-red-500 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-red-200">
                  <i className="fa-solid fa-phone-slash text-3xl"></i>
                </button>
              </div>
            ) : callStatus !== 'idle' ? (
              <button 
                onClick={endCall}
                className="px-14 h-16 bg-red-500 text-white rounded-[1.5rem] flex items-center justify-center gap-4 shadow-xl shadow-red-200 active:scale-95"
              >
                <i className="fa-solid fa-phone-slash text-2xl"></i>
                <span className="font-black uppercase tracking-[0.2em] text-xs">End Call</span>
              </button>
            ) : null}
          </div>
        </div>
        
        <div className="mt-4 text-[10px] font-black text-slate-300 uppercase tracking-[1em] opacity-40">
          SECURE P2P MESH
        </div>
      </div>
    </div>
  );
};

export default Home;
