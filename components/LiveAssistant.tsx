import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, X, Radio, Volume2, AlertTriangle } from 'lucide-react';
import { createBlob, decode, decodeAudioData } from '../utils/audioUtils';

// YOUR SHARED API KEY
const DEFAULT_API_KEY = "AIzaSyCQOaKrf3o3JfBsgd3bOW0dnVAZYoyXUGo";

interface LiveAssistantProps {
  onClose: () => void;
  userName?: string;
  apiKey?: string;
}

const LiveAssistant: React.FC<LiveAssistantProps> = ({ onClose, userName, apiKey }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [status, setStatus] = useState<string>("Connecting...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audio Contexts
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  // Session & Playback
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    startSession();

    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, []);

  const startSession = async () => {
    setErrorMsg(null);
    setStatus("Connecting...");

    const finalApiKey = apiKey || DEFAULT_API_KEY;
    if (!finalApiKey) {
      setStatus("Configuration Error");
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: finalApiKey });

      // Setup Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      inputAudioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      outputAudioContextRef.current = new AudioContextClass({ sampleRate: 24000 });

      // Request Mic
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Connect to Gemini Live (WebSocket)
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }, 
          },
          systemInstruction: `You are Quizzy, a helpful study companion. The user is ${userName || 'Student'}. Keep it conversational.`,
        },
        callbacks: {
          onopen: () => {
            if (!isMountedRef.current) return;
            setStatus("Listening");
            setIsConnected(true);

            // Stream Audio Input
            if (!inputAudioContextRef.current) return;
            
            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
            const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = processor;

            processor.onaudioprocess = (e) => {
              if (isMuted) return;
              
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Visualizer Math
              let sum = 0;
              for(let i=0; i < inputData.length; i+=10) sum += Math.abs(inputData[i]);
              setVolumeLevel(sum / (inputData.length / 10));

              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (!isMountedRef.current || !outputAudioContextRef.current) return;

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            
            if (base64Audio) {
              setStatus("Speaking...");
              const ctx = outputAudioContextRef.current;
              
              // Ensure context is running
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
            if (isMountedRef.current) {
              setStatus("Disconnected");
              setIsConnected(false);
            }
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            if (isMountedRef.current) {
                setStatus("Error");
                setErrorMsg("Connection failed. (Check API Key Restrictions)");
            }
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (err) {
      console.error("Failed to start live session:", err);
      setStatus("Failed");
      setErrorMsg("Could not access microphone or API.");
    }
  };

  const cleanup = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
    }
    if (outputAudioContextRef.current) {
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

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Visualizer Orb */}
      <div className="relative w-64 h-64 mb-12 flex items-center justify-center">
        <div 
           className={`absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 blur-3xl transition-all duration-100 ease-out ${status === 'Speaking...' ? 'animate-pulse opacity-80' : 'opacity-20'}`}
           style={{ transform: `scale(${1 + volumeLevel * 5})` }}
        />
        
        <div className="relative w-40 h-40 bg-black rounded-full border-4 border-white/10 flex items-center justify-center shadow-2xl shadow-violet-500/30 overflow-hidden">
           <div className={`absolute inset-0 bg-gradient-to-t from-violet-900/50 to-transparent transition-all duration-75`} 
                style={{ height: `${30 + volumeLevel * 200}%` }} 
           />
           
           <div className="z-10">
             {status === 'Connecting...' && <Radio className="w-10 h-10 text-zinc-500 animate-pulse" />}
             {status === 'Listening' && <Mic className="w-10 h-10 text-white" />}
             {status === 'Speaking...' && <Volume2 className="w-10 h-10 text-fuchsia-400 animate-bounce" />}
             {(status === 'Disconnected' || status === 'Error') && <AlertTriangle className="w-10 h-10 text-red-500" />}
           </div>
        </div>
      </div>

      {/* Status Text */}
      <h2 className="text-2xl font-display font-bold text-white mb-2">{status}</h2>
      
      {errorMsg ? (
          <p className="text-red-400 mb-12 max-w-md text-center px-4">{errorMsg}</p>
      ) : (
          <p className="text-zinc-400 mb-12 text-center">
            {status === 'Listening' ? "I'm listening..." : 
             status === 'Speaking...' ? "Quizzy is speaking..." : 
             "Initializing..."}
          </p>
      )}

      {/* Controls */}
      <div className="flex items-center gap-6">
        <button
          onClick={toggleMute}
          className={`p-6 rounded-full border-2 transition-all ${
            isMuted 
              ? 'bg-red-500/20 border-red-500 text-red-500 hover:bg-red-500/30' 
              : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
          }`}
        >
          {isMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
        </button>

        <button
          onClick={onClose}
          className="px-8 py-4 rounded-full bg-white text-black font-bold hover:bg-zinc-200 transition-colors"
        >
          End Session
        </button>
      </div>
    </div>
  );
};

export default LiveAssistant;