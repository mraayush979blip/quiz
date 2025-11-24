
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, X, Radio, Volume2, AlertTriangle, RefreshCw, Sparkles, Loader2 } from 'lucide-react';
import { createBlob, decode, decodeAudioData } from '../utils/audioUtils';

// DEFAULT FALLBACK KEY (Used if user doesn't provide one)
const DEFAULT_API_KEY = "AIzaSyBtAiQznbRhnRRZPrWf3wb2vBRsrfcXCdA";

interface LiveAssistantProps {
  onClose: () => void;
  userName?: string;
  apiKey?: string;
}

const LiveAssistant: React.FC<LiveAssistantProps> = ({ onClose, userName, apiKey }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [status, setStatus] = useState<string>("Initializing...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Audio Contexts
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  // Session & Playback
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // State Refs
  const isMountedRef = useRef(true);
  const shouldReconnectRef = useRef(true); 
  const activeSessionRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    shouldReconnectRef.current = true;
    
    startSession();

    return () => {
      isMountedRef.current = false;
      shouldReconnectRef.current = false;
      cleanup();
    };
  }, [reconnectAttempts]);

  const startSession = async () => {
    setErrorMsg(null);
    setStatus(reconnectAttempts > 0 ? "Reconnecting..." : "Connecting...");

    // PRIORITIZE USER KEY, FALLBACK TO DEFAULT
    const finalApiKey = apiKey || DEFAULT_API_KEY;

    if (!finalApiKey) {
      setStatus("Error");
      setErrorMsg("No API Key available. Please add one in settings.");
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: finalApiKey });

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!inputAudioContextRef.current) inputAudioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      if (!outputAudioContextRef.current) outputAudioContextRef.current = new AudioContextClass({ sampleRate: 24000 });

      if (inputAudioContextRef.current.state === 'suspended') await inputAudioContextRef.current.resume();
      if (outputAudioContextRef.current.state === 'suspended') await outputAudioContextRef.current.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }, 
          },
          systemInstruction: `You are Quizzy, a friendly study companion. The user is ${userName || 'Student'}. Be concise and encouraging.`,
        },
        callbacks: {
          onopen: () => {
            if (!isMountedRef.current) return;
            setStatus("Listening");
            setIsConnected(true);
            activeSessionRef.current = true;
            setReconnectAttempts(0); // Reset on success

            if (!inputAudioContextRef.current) return;
            
            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
            const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = processor;

            processor.onaudioprocess = (e) => {
              if (isMuted || !activeSessionRef.current) return;
              
              const inputData = e.inputBuffer.getChannelData(0);
              
              let sum = 0;
              for(let i=0; i < inputData.length; i+=10) sum += Math.abs(inputData[i]);
              setVolumeLevel(sum / (inputData.length / 10));

              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                if (activeSessionRef.current) {
                  session.sendRealtimeInput({ media: pcmBlob });
                }
              }).catch(() => {});
            };

            source.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (!isMountedRef.current || !outputAudioContextRef.current) return;

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            
            if (base64Audio) {
              setStatus("Speaking");
              const ctx = outputAudioContextRef.current;
              
              if(ctx.state === 'suspended') await ctx.resume();

              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                ctx,
                24000,
                1
              );

              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.addEventListener('ended', () => {
                 sourcesRef.current.delete(source);
                 if (sourcesRef.current.size === 0 && isMountedRef.current) {
                   setStatus("Listening");
                 }
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
               sourcesRef.current.forEach(src => {
                 try { src.stop(); } catch(e){}
                 sourcesRef.current.delete(src);
               });
               nextStartTimeRef.current = 0;
            }
          },
          onclose: (e) => {
            console.log("Session closed", e);
            activeSessionRef.current = false;
            
            if (isMountedRef.current) {
              if (shouldReconnectRef.current && reconnectAttempts < 3) {
                setStatus("Reconnecting...");
                setTimeout(() => {
                  if (isMountedRef.current && shouldReconnectRef.current) {
                    setReconnectAttempts(prev => prev + 1);
                  }
                }, 2000);
              } else {
                setIsConnected(false);
                setStatus("Disconnected");
                setErrorMsg("Connection lost. Please check your API Key settings.");
              }
            }
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            activeSessionRef.current = false;
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (err) {
      console.error("Failed to start live session:", err);
      setStatus("Failed");
      setErrorMsg("Could not access microphone or API. Please check permissions.");
    }
  };

  const cleanup = () => {
    activeSessionRef.current = false;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close();
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      outputAudioContextRef.current.close();
    }
    sourcesRef.current.forEach(src => {
        try { src.stop(); } catch(e){}
    });
    sourcesRef.current.clear();

    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close());
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleEndSession = () => {
    shouldReconnectRef.current = false;
    onClose();
  };

  // --- Visual Helpers ---
  const getOrbColor = () => {
    switch(status) {
      case 'Listening': return 'from-cyan-400 to-blue-500';
      case 'Speaking': return 'from-emerald-400 to-teal-500';
      case 'Reconnecting...': return 'from-amber-400 to-orange-500';
      case 'Disconnected': return 'from-red-500 to-pink-600';
      default: return 'from-violet-500 to-fuchsia-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center animate-fade-in overflow-hidden">
      {/* Glossy Background Overlay */}
      <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl z-0"></div>
      
      {/* Floating Blobs Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Close Button */}
      <button 
        onClick={handleEndSession}
        className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-zinc-400 hover:text-white transition-all z-50 backdrop-blur-md"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Content Card */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
        
        {/* --- THE ORB --- */}
        <div className="relative w-64 h-64 mb-12 flex items-center justify-center">
          {/* 1. Ambient Glow */}
          <div 
             className={`absolute inset-0 rounded-full bg-gradient-to-br blur-[60px] transition-all duration-500 ease-out opacity-40 ${getOrbColor()}`}
             style={{ transform: `scale(${1 + volumeLevel * 5})` }}
          />
          
          {/* 2. Core Orb (Glassy) */}
          <div className="relative w-40 h-40 rounded-full flex items-center justify-center overflow-hidden shadow-[inset_0_-5px_20px_rgba(255,255,255,0.1),0_15px_40px_rgba(0,0,0,0.6)] z-10 bg-black/40 backdrop-blur-sm border border-white/10">
             
             {/* Inner Liquid/Wave Effect */}
             <div 
                className={`absolute inset-0 bg-gradient-to-t ${getOrbColor()} transition-all duration-150 opacity-80`} 
                style={{ 
                  height: `${20 + volumeLevel * 200}%`,
                  filter: 'blur(10px)',
                  transform: 'translateY(10%) scale(1.2)'
                }} 
             />
             
             {/* Icon Overlay */}
             <div className="z-20 relative drop-shadow-md">
               {status === 'Listening' && <Mic className="w-12 h-12 text-white transition-opacity opacity-90" />}
               {status === 'Speaking' && <Volume2 className="w-12 h-12 text-white animate-bounce" />}
               {(status === 'Reconnecting...' || status === 'Connecting...') && <Radio className="w-12 h-12 text-white animate-pulse" />}
               {(status === 'Disconnected' || status === 'Failed') && <AlertTriangle className="w-12 h-12 text-white" />}
             </div>

             {/* Shine Reflection */}
             <div className="absolute top-4 left-8 w-16 h-8 bg-white/20 rounded-full blur-lg -rotate-45 pointer-events-none"></div>
          </div>
        </div>

        {/* --- Status & Text --- */}
        <div className="text-center space-y-4 max-w-sm">
          <h2 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tight animate-slide-up">
            {status}
          </h2>
          
          {errorMsg ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 animate-fade-in">
              <p className="text-red-400 text-sm mb-3">{errorMsg}</p>
              {status === 'Disconnected' && (
                <button 
                  onClick={() => setReconnectAttempts(prev => prev + 1)}
                  className="px-5 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-200 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Retry Now
                </button>
              )}
            </div>
          ) : (
            <p className="text-zinc-400 text-sm font-medium tracking-wide h-6 animate-fade-in">
              {status === 'Listening' ? "Speak naturally, I'm listening." : 
               status === 'Speaking' ? "Quizzy is answering..." : 
               status === 'Reconnecting...' ? "Stabilizing connection..." : 
               "Initializing audio core..."}
            </p>
          )}
        </div>

        {/* --- Controls --- */}
        <div className="mt-12 flex items-center justify-center gap-6 w-full">
          <button
            onClick={toggleMute}
            className={`p-5 rounded-full border-2 transition-all backdrop-blur-md ${
              isMuted 
                ? 'bg-red-500/20 border-red-500 text-red-200 hover:bg-red-500/30' 
                : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <button
            onClick={handleEndSession}
            className="px-8 py-4 rounded-full bg-white text-black font-bold hover:bg-zinc-200 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.1)]"
          >
            End Session
          </button>
        </div>

      </div>
    </div>
  );
};

export default LiveAssistant;