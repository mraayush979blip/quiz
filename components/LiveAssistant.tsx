
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, X, Radio, Volume2 } from 'lucide-react';
import { createBlob, decode, decodeAudioData } from '../utils/audioUtils';

// Re-using the key from geminiService (in a real app, use a shared constant file)
const INTERNAL_API_KEY = "AIzaSyBtAiQznbRhnRRZPrWf3wb2vBRsrfcXCdA";

interface LiveAssistantProps {
  onClose: () => void;
  userName?: string;
}

const LiveAssistant: React.FC<LiveAssistantProps> = ({ onClose, userName }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [status, setStatus] = useState<string>("Connecting...");

  // Audio Contexts
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  // Session & Playback
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    let isMounted = true;

    const startSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: INTERNAL_API_KEY });

        // Setup Audio Contexts
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        // Request Mic
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        // Connect to Gemini Live
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }, // Options: Puck, Charon, Kore, Fenrir, Zephyr
            },
            systemInstruction: `You are Quizzy, a helpful and friendly study companion. The user's name is ${userName || 'Student'}. Always speak in English. Keep answers concise, encouraging, and spoken in a natural conversational tone. You can help with quizzing, explaining concepts, or just chatting about study topics.`,
          },
          callbacks: {
            onopen: () => {
              if (!isMounted) return;
              setStatus("Listening");
              setIsConnected(true);

              // Setup Input Processing
              if (!inputAudioContextRef.current) return;
              
              const source = inputAudioContextRef.current.createMediaStreamSource(stream);
              const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
              scriptProcessorRef.current = processor;

              processor.onaudioprocess = (e) => {
                if (isMuted) return;
                
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Simple visualizer calculation
                let sum = 0;
                for(let i=0; i < inputData.length; i+=10) {
                   sum += Math.abs(inputData[i]);
                }
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
              if (!isMounted || !outputAudioContextRef.current) return;

              // Handle Audio Output
              const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              
              if (base64Audio) {
                setStatus("Speaking...");
                const ctx = outputAudioContextRef.current;
                
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
                   if (sourcesRef.current.size === 0 && isMounted) {
                     setStatus("Listening");
                   }
                });

                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              }

              // Handle Interruption
              if (message.serverContent?.interrupted) {
                 sourcesRef.current.forEach(src => {
                   src.stop();
                   sourcesRef.current.delete(src);
                 });
                 nextStartTimeRef.current = 0;
              }
            },
            onclose: () => {
              if (isMounted) {
                setStatus("Disconnected");
                setIsConnected(false);
              }
            },
            onerror: (err) => {
              console.error("Live API Error:", err);
              if (isMounted) setStatus("Error occurred");
            }
          }
        });

        sessionPromiseRef.current = sessionPromise;

      } catch (err) {
        console.error("Failed to start live session:", err);
        setStatus("Failed to connect");
      }
    };

    startSession();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [userName]); // Re-run if user changes, mostly runs once on mount

  const cleanup = () => {
    // Stop Input
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
    }

    // Stop Output
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
    }
    sourcesRef.current.forEach(src => tryStop(src));
    sourcesRef.current.clear();

    // Close Session
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close());
    }
  };

  const tryStop = (src: AudioBufferSourceNode) => {
    try { src.stop(); } catch(e) {}
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

      {/* Visualizer Area */}
      <div className="relative w-64 h-64 mb-12 flex items-center justify-center">
        {/* Outer Glow */}
        <div 
           className={`absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 blur-3xl transition-all duration-100 ease-out ${status === 'Speaking...' ? 'animate-pulse opacity-80' : 'opacity-20'}`}
           style={{ transform: `scale(${1 + volumeLevel * 5})` }}
        />
        
        {/* Core Orb */}
        <div className="relative w-40 h-40 bg-black rounded-full border-4 border-white/10 flex items-center justify-center shadow-2xl shadow-violet-500/30 overflow-hidden">
           {/* Inner Waves */}
           <div className={`absolute inset-0 bg-gradient-to-t from-violet-900/50 to-transparent transition-all duration-75`} 
                style={{ height: `${30 + volumeLevel * 200}%` }} 
           />
           
           <div className="z-10">
             {status === 'Connecting...' && <Radio className="w-10 h-10 text-zinc-500 animate-pulse" />}
             {status === 'Listening' && <Mic className="w-10 h-10 text-white" />}
             {status === 'Speaking...' && <Volume2 className="w-10 h-10 text-fuchsia-400 animate-bounce" />}
             {status === 'Disconnected' && <X className="w-10 h-10 text-red-500" />}
           </div>
        </div>
      </div>

      {/* Status Text */}
      <h2 className="text-2xl font-display font-bold text-white mb-2">{status}</h2>
      <p className="text-zinc-400 mb-12">
        {status === 'Listening' ? "I'm listening..." : status === 'Speaking...' ? "Quizzy is speaking..." : "Initializing audio..."}
      </p>

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
