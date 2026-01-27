
import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { User, SignalingMessage } from '../types';

interface HomeProps {
  user: User;
  t: any;
}

const Home: React.FC<HomeProps> = ({ user, t }) => {
  const [targetId, setTargetId] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [incomingCall, setIncomingCall] = useState<SignalingMessage | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const location = useLocation();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const signalingChannel = useRef<BroadcastChannel | null>(null);

  // Check for auto-call from location state
  useEffect(() => {
    if (location.state && location.state.callId) {
      setTargetId(location.state.callId);
      // We'll trigger startCall after the camera is ready
    }
  }, [location.state]);

  useEffect(() => {
    signalingChannel.current = new BroadcastChannel('connectly_signaling');
    signalingChannel.current.onmessage = async (event: MessageEvent<SignalingMessage>) => {
      const msg = event.data;
      if (msg.targetId !== user.id) return;

      switch (msg.type) {
        case 'offer':
          setIncomingCall(msg);
          break;
        case 'answer':
          if (pcRef.current) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.payload));
            setIsConnected(true);
            setIsCalling(false);
          }
          break;
        case 'candidate':
          if (pcRef.current) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.payload));
          }
          break;
      }
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        
        // If there's an auto-call waiting, trigger it
        if (location.state && location.state.callId) {
          triggerCall(location.state.callId);
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    };
    startCamera();

    return () => {
      signalingChannel.current?.close();
      localStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, [user.id]);

  const setupPeerConnection = (idToCall: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signalingChannel.current?.postMessage({
          type: 'candidate',
          senderId: user.id,
          targetId: idToCall,
          payload: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setIsConnected(true);
      }
    };

    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current!);
    });

    pcRef.current = pc;
    return pc;
  };

  const triggerCall = async (id: string) => {
    if (!id || id === user.id) return;
    setIsCalling(true);
    const pc = setupPeerConnection(id);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    signalingChannel.current?.postMessage({
      type: 'offer',
      senderId: user.id,
      targetId: id,
      payload: offer
    });
  };

  const startCall = () => triggerCall(targetId);

  const acceptCall = async () => {
    if (!incomingCall) return;
    const pc = setupPeerConnection(incomingCall.senderId);
    await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.payload));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    signalingChannel.current?.postMessage({
      type: 'answer',
      senderId: user.id,
      targetId: incomingCall.senderId,
      payload: answer
    });
    setIncomingCall(null);
    setIsConnected(true);
  };

  const endCall = () => {
    pcRef.current?.close();
    pcRef.current = null;
    setIsCalling(false);
    setIsConnected(false);
    setIncomingCall(null);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const copyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 max-w-6xl mx-auto overflow-hidden">
      <header className="mb-4 md:mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="hidden md:block">
          <h1 className="text-2xl font-bold text-slate-800">{t.videoChat}</h1>
          <p className="text-slate-500 text-sm">{t.connectId}</p>
        </div>
        <div 
          onClick={copyId}
          className="cursor-pointer group bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-between md:justify-start gap-4 active:scale-95 transition-all"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
            <span className="text-[10px] md:text-xs font-bold opacity-80 uppercase tracking-widest">{t.yourId}</span>
            <span className="text-2xl font-black tracking-widest font-mono">{user.id}</span>
          </div>
          <div className="bg-white/20 p-2 rounded-xl group-hover:bg-white/30 transition-colors">
            <i className={`fa-solid ${copyFeedback ? 'fa-check text-emerald-300' : 'fa-copy'}`}></i>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="relative flex-1 bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white group">
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover bg-slate-800"
            />
            
            {!isConnected && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900/60 backdrop-blur-md p-6 text-center z-10">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 border border-slate-700 ${isCalling ? 'animate-pulse bg-indigo-500/20 text-indigo-400' : 'bg-slate-800'}`}>
                  <i className={`fa-solid ${isCalling ? 'fa-signal' : 'fa-video-slash'} text-3xl`}></i>
                </div>
                <p className="text-xl font-bold text-white mb-2">
                  {isCalling ? t.isCalling.replace('{id}', targetId) : t.waitConn}
                </p>
                {!isCalling && <p className="text-sm opacity-60 max-w-xs">{t.connectId}</p>}
                
                {isCalling && (
                  <button onClick={endCall} className="mt-6 px-8 py-3 bg-red-500 text-white rounded-2xl font-bold shadow-lg hover:bg-red-600 transition-all">
                    Cancel Call
                  </button>
                )}
              </div>
            )}
            
            <div className={`absolute bottom-4 right-4 w-28 md:w-56 aspect-video bg-slate-800 rounded-2xl overflow-hidden border-2 border-white shadow-2xl z-20 transition-all duration-500 ${isConnected ? 'scale-100 opacity-100' : 'scale-90 opacity-40'}`}>
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/40 backdrop-blur-md text-[8px] font-bold text-white rounded uppercase tracking-widest">You</div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-30">
               {isConnected && (
                <button 
                  onClick={endCall}
                  className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all animate-in fade-in zoom-in"
                >
                  <i className="fa-solid fa-phone-slash text-2xl"></i>
                </button>
               )}
            </div>
          </div>

          {!isConnected && !isCalling && (
            <div className="mt-4 shrink-0 px-2 pb-20 md:pb-0">
              <div className="flex items-center bg-white p-2 rounded-[2rem] shadow-xl border border-slate-100 w-full max-w-md mx-auto">
                <div className="w-12 h-12 flex items-center justify-center text-indigo-500 ml-2">
                  <i className="fa-solid fa-hashtag text-xl"></i>
                </div>
                <input 
                  type="text" 
                  maxLength={4}
                  placeholder={t.enterId}
                  className="flex-1 px-2 py-2 outline-none font-mono text-xl md:text-2xl tracking-[0.5em] text-slate-700 bg-transparent placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value.replace(/\D/g, ''))}
                />
                <button 
                  onClick={startCall}
                  disabled={targetId.length !== 4 || isCalling}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-8 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
                >
                  <i className="fa-solid fa-phone"></i>
                  <span className="hidden sm:inline">{t.call}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={`space-y-4 md:space-y-6 lg:w-80 shrink-0 overflow-y-auto ${isConnected ? 'hidden lg:block' : 'block'}`}>
          {incomingCall && (
            <div className="bg-indigo-600 text-white p-6 rounded-[2rem] shadow-xl animate-bounce border-4 border-indigo-400/30">
              <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                <i className="fa-solid fa-phone-volume animate-pulse"></i>
                {t.incoming}
              </h3>
              <p className="mb-6 opacity-90 text-sm">{t.isIncoming.replace('{id}', incomingCall.senderId)}</p>
              <div className="flex gap-3">
                <button 
                  onClick={acceptCall} 
                  className="flex-1 bg-white text-indigo-600 py-3 rounded-2xl font-black text-sm hover:bg-slate-50 active:scale-95 transition-all shadow-lg"
                >
                  {t.accept}
                </button>
                <button 
                  onClick={() => setIncomingCall(null)} 
                  className="bg-red-500 text-white px-5 rounded-2xl font-bold text-sm hover:bg-red-600 transition-all shadow-lg"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hidden md:block">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-circle-info text-indigo-500"></i>
              {t.howToCall}
            </h3>
            <ul className="space-y-4 text-xs text-slate-600">
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 font-bold text-[10px]">1</span>
                <span>{t.step1}</span>
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 font-bold text-[10px]">2</span>
                <span>{t.step2}</span>
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 font-bold text-[10px]">3</span>
                <span>{t.step3}</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-900 p-6 rounded-[2rem] shadow-sm text-white">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-sm">
              <i className="fa-solid fa-shield-halved text-emerald-400"></i>
              {t.connStatus}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] py-1 border-b border-white/10">
                <span className="opacity-50">{t.signaling}</span>
                <span className="text-emerald-400 font-bold uppercase tracking-wider">{t.online}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] py-1 border-b border-white/10">
                <span className="opacity-50">{t.media}</span>
                <span className={localStreamRef.current ? "text-emerald-400" : "text-amber-400"}>
                  {localStreamRef.current ? t.granted : t.checking}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] py-1">
                <span className="opacity-50">{t.peer}</span>
                <span className={isConnected ? "text-indigo-400 font-bold" : "text-slate-500"}>
                  {isConnected ? t.connected : t.idle}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
