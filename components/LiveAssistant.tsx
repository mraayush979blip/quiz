import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, X, Radio, Volume2, AlertTriangle, Loader2 } from 'lucide-react';

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
  const [isMuted, setIsMuted] = useState(false);

  // Refs for Audio Handling
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(true);

  // Initialize
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
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  };

  const startListening = async () => {
    if (!isMountedRef.current) return;
    try {
      setStatus('listening');
      setErrorMsg(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup Visualizer & Silence Detection
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);

      // Setup Recorder
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'; // Safari
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        if (isMountedRef.current && status !== 'error') {
          processAudio(new Blob(audioChunksRef.current, { type: mimeType }));
        }
      };

      recorder.start(100); // Chunk every 100ms
      monitorAudioLevels();

    } catch (err: any) {
      console.error("Mic Error:", err);
      setStatus('error');
      setErrorMsg("Microphone access denied or not available.");
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
      
      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      
      // Update Visualizer
      setVolumeLevel(Math.min(average / 50, 1.5));

      // Silence Detection Logic
      const THRESHOLD = 10; // Noise floor
      const SILENCE_DURATION = 1500; // 1.5 seconds of silence to stop

      if (average > THRESHOLD) {
        silenceStart = Date.now();
        if (!isSpeaking) isSpeaking = true;
      } else if (isSpeaking && Date.now() - silenceStart > SILENCE_DURATION) {
        // User stopped speaking
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          return; // Stop loop
        }
      }

      if (!isMuted) {
        requestAnimationFrame(checkLevel);
      }
    };

    checkLevel();
  };

  const processAudio = async (audioBlob: Blob) => {
    setStatus('processing');
    
    // Convert Blob to Base64
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
               parts: [{ text: `You are Quizzy, a friendly voice tutor for ${userName || 'Student'}. Keep answers conversational, short (1-2 sentences), and encouraging.` }]
            },
            generationConfig: {
               temperature: 0.7
            }
          })
        });

        if (!response.ok) {
           throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (textResponse) {
          speakResponse(textResponse);
        } else {
          // No response? Just listen again
          startListening();
        }

      } catch (err) {
        console.error("Gemini API Error", err);
        setStatus('error');
        setErrorMsg("Connection error. Please try again.");
      }
    };
  };

  const speakResponse = (text: string) => {
    setStatus('speaking');
    
    // Cancel any previous speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Try to select a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('en')) || voices.find(v => v.lang.includes('en'));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      if (isMountedRef.current) {
        startListening();
      }
    };

    utterance.onerror = (e) => {
      console.error("TTS Error", e);
      if (isMountedRef.current) {
        startListening();
      }
    };

    window.speechSynthesis.speak(utterance);
    
    // Visualizer for AI speaking
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

  const toggleMute = () => {
    if (isMuted) {
       setIsMuted(false);
       if (status === 'idle' || status === 'listening') startListening();
    } else {
       setIsMuted(true);
       if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
         mediaRecorderRef.current.stop();
       }
       window.speechSynthesis.cancel();
       setStatus('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
      >
        <X className="w-6 h-6" />
      </button>

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
             {status === 'idle' && <MicOff className="w-10 h-10 text-zinc-500" />}
             {status === 'listening' && <Mic className="w-10 h-10 text-white animate-pulse" />}
             {status === 'processing' && <Loader2 className="w-10 h-10 text-fuchsia-400 animate-spin" />}
             {status === 'speaking' && <Volume2 className="w-10 h-10 text-fuchsia-400 animate-bounce" />}
             {status === 'error' && <AlertTriangle className="w-10 h-10 text-red-500" />}
           </div>
        </div>
      </div>

      <h2 className="text-2xl font-display font-bold text-white mb-2 capitalize">
        {status === 'processing' ? 'Thinking...' : status}
      </h2>
      
      {errorMsg ? (
        <div className="max-w-md text-center px-4">
          <p className="text-red-400 mb-6">{errorMsg}</p>
        </div>
      ) : (
        <p className="text-zinc-400 mb-12 h-6 text-center">
          {status === 'listening' ? "Listening... (stop speaking to send)" : 
           status === 'processing' ? "Analyzing your voice..." : 
           status === 'speaking' ? "Quizzy is speaking..." : 
           "Paused"}
        </p>
      )}

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