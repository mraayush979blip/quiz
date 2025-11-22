import React, { useEffect, useRef, useState } from 'react';
import { Mic, X, Radio, Volume2, AlertTriangle, Loader2, Send } from 'lucide-react';

// YOUR SHARED API KEY
const DEFAULT_API_KEY = "AIzaSyCQOaKrf3o3JfBsgd3bOW0dnVAZYoyXUGo";

interface LiveAssistantProps {
  onClose: () => void;
  userName?: string;
  apiKey?: string;
}

const LiveAssistant: React.FC<LiveAssistantProps> = ({ onClose, userName, apiKey }) => {
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking' | 'error'>('idle');
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Audio Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    startListening();

    return () => {
      isMountedRef.current = false;
      stopEverything();
      window.speechSynthesis.cancel();
    };
  }, []);

  const stopEverything = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const startListening = async () => {
    if (!isMountedRef.current) return;
    try {
      setStatus('listening');
      setErrorMsg(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup Audio Context & Visualizer
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      // Setup Recorder
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        if (isMountedRef.current && status !== 'error') {
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          if (blob.size > 0) {
            processAudio(blob);
          } else {
            // If recording was empty (clicked too fast), restart
            startListening();
          }
        }
      };

      recorder.start(100);
      monitorAudioLevels();

    } catch (err: any) {
      console.error("Mic Error:", err);
      setStatus('error');
      setErrorMsg("Microphone access denied.");
    }
  };

  const monitorAudioLevels = () => {
    if (!analyserRef.current || !isMountedRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    let silenceStart = Date.now();
    let isSpeaking = false;

    const checkLevel = () => {
      if (!analyserRef.current || !isMountedRef.current || status !== 'listening') return;

      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate volume
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      setVolumeLevel(Math.min(average / 50, 1.5));

      // Auto-Silence Detection
      const THRESHOLD = 15; 
      const SILENCE_DURATION = 2500; // 2.5 seconds

      if (average > THRESHOLD) {
        silenceStart = Date.now();
        if (!isSpeaking) isSpeaking = true;
      } else if (isSpeaking && Date.now() - silenceStart > SILENCE_DURATION) {
        handleStopRecording();
        return;
      }

      requestAnimationFrame(checkLevel);
    };

    checkLevel();
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setStatus('processing');
    
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      
      try {
        const finalApiKey = apiKey || DEFAULT_API_KEY;
        const modelName = 'gemini-2.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${finalApiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{
                inlineData: {
                  mimeType: audioBlob.type,
                  data: base64String
                }
              }]
            }],
            systemInstruction: {
               parts: [{ text: `You are Quizzy, a friendly voice tutor for ${userName || 'Student'}. Keep answers conversational, short (max 2 sentences), and encouraging.` }]
            },
            generationConfig: { temperature: 0.7 }
          })
        });

        if (!response.ok) {
           if (response.status === 403) {
             throw new Error("API Key Restricted (403). Check console.");
           }
           throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (textResponse) {
          speakResponse(textResponse);
        } else {
          startListening();
        }

      } catch (err: any) {
        console.error("Gemini API Error", err);
        setStatus('error');
        setErrorMsg(err.message || "Connection error.");
      }
    };
  };

  const speakResponse = (text: string) => {
    setStatus('speaking');
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('en')) || voices.find(v => v.lang.includes('en'));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      if (isMountedRef.current) startListening();
    };

    utterance.onerror = () => {
      if (isMountedRef.current) startListening();
    };

    window.speechSynthesis.speak(utterance);
    
    const simulateTalking = () => {
      if (status === 'speaking' && isMountedRef.current) {
        setVolumeLevel(Math.random() * 0.8 + 0.2);
        if (window.speechSynthesis.speaking) {
          requestAnimationFrame(simulateTalking);
        } else {
          setVolumeLevel(0);
        }
      }
    };
    simulateTalking();
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
      <div className="relative w-64 h-64 mb-8 flex items-center justify-center">
        <div 
           className={`absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 blur-3xl transition-all duration-100 ease-out ${status === 'speaking' || status === 'listening' ? 'opacity-60' : 'opacity-20'}`}
           style={{ transform: `scale(${1 + volumeLevel * 0.5})` }}
        />
        
        <div className="relative w-40 h-40 bg-black rounded-full border-4 border-white/10 flex items-center justify-center shadow-2xl shadow-violet-500/30 overflow-hidden">
           <div className={`absolute inset-0 bg-gradient-to-t from-violet-900/50 to-transparent transition-all duration-75`} 
                style={{ height: `${30 + volumeLevel * 100}%` }} 
           />
           
           <div className="z-10">
             {status === 'listening' && <Mic className="w-10 h-10 text-white animate-pulse" />}
             {status === 'processing' && <Loader2 className="w-10 h-10 text-fuchsia-400 animate-spin" />}
             {status === 'speaking' && <Volume2 className="w-10 h-10 text-fuchsia-400 animate-bounce" />}
             {status === 'error' && <AlertTriangle className="w-10 h-10 text-red-500" />}
             {status === 'idle' && <Radio className="w-10 h-10 text-zinc-500" />}
           </div>
        </div>
      </div>

      {/* Status Text */}
      <h2 className="text-2xl font-display font-bold text-white mb-2 capitalize">
        {status === 'processing' ? 'Thinking...' : status}
      </h2>
      
      {errorMsg ? (
        <div className="max-w-md text-center px-4">
          <p className="text-red-400 mb-6">{errorMsg}</p>
          <button 
            onClick={startListening}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <p className="text-zinc-400 mb-12 h-6 text-center">
          {status === 'listening' ? "Speak now (or tap Send)" : 
           status === 'processing' ? "Analyzing audio..." : 
           status === 'speaking' ? "Quizzy is replying..." : 
           "Ready"}
        </p>
      )}

      {/* Controls */}
      <div className="flex items-center gap-6">
        {status === 'listening' ? (
          <button
            onClick={handleStopRecording}
            className="px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold hover:scale-105 transition-all shadow-lg shadow-fuchsia-500/30 flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            Stop & Send
          </button>
        ) : (
          <button
            onClick={onClose}
            className="px-8 py-4 rounded-full bg-white text-black font-bold hover:bg-zinc-200 transition-colors"
          >
            End Session
          </button>
        )}
      </div>
    </div>
  );
};

export default LiveAssistant;