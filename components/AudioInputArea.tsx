
import React, { useState, useRef } from 'react';
import { Send, Mic, Square, Loader2, Sparkles, MicOff, Lock } from 'lucide-react';
import { extractListFromAudio } from '../services/geminiService';

interface AudioInputAreaProps {
  onAddItems: (texts: string[]) => void;
  disabled?: boolean;
}

const AudioInputArea: React.FC<AudioInputAreaProps> = ({ onAddItems, disabled = false }) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const handleSendText = () => {
    if (inputText.trim()) {
      onAddItems([inputText.trim()]);
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendText();
    }
  };

  const startRecording = async () => {
    if (disabled) return;
    setPermissionError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setIsProcessing(true);
        try {
          const items = await extractListFromAudio(blob);
          if (items.length > 0) {
            onAddItems(items);
          }
        } catch (error) {
          console.error(error);
          alert("Failed to process audio. Please try again.");
        } finally {
          setIsProcessing(false);
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setPermissionError(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  if (disabled) {
    return (
      <div className="fixed bottom-0 left-0 w-full p-4 pt-12 pb-6 z-10 bg-gradient-to-t from-white via-white to-transparent dark:from-dark-bg dark:via-dark-bg">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-2 text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-dark-card p-3 rounded-full border border-transparent dark:border-gray-700">
          <Lock size={16} />
          <span className="text-sm">View Only Access</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-dark-bg dark:via-dark-bg pt-12 pb-6 z-10">
      <div className="max-w-2xl mx-auto">
        
        {/* Processing Indicator */}
        {isProcessing && (
          <div className="absolute -top-8 left-0 w-full flex justify-center">
             <div className="bg-peach-400 text-white text-sm px-4 py-1 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
               <Sparkles size={14} />
               <span>Gemini is listening...</span>
             </div>
          </div>
        )}

        {/* Permission Error */}
        {permissionError && (
           <div className="absolute -top-12 left-0 w-full flex justify-center px-4">
             <div className="bg-red-100 border border-red-200 text-red-600 text-xs px-4 py-2 rounded-lg shadow-sm flex items-center gap-2">
               <MicOff size={14} />
               <span>Microphone access denied. Please check browser settings.</span>
             </div>
           </div>
        )}

        <div className="flex items-center gap-2 bg-white dark:bg-dark-card p-2 rounded-full shadow-xl border border-peach-100 dark:border-gray-700">
          <input
            type="text"
            dir="auto"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Recording..." : "Add item manually..."}
            disabled={isRecording || isProcessing}
            className="flex-1 bg-transparent px-4 py-2 outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400 disabled:opacity-50"
          />

          {/* Send Text Button */}
          {inputText.length > 0 && !isRecording && (
             <button 
               onClick={handleSendText}
               className="p-3 bg-peach-400 hover:bg-peach-500 text-white rounded-full transition-transform transform hover:scale-105 active:scale-95"
             >
               <Send size={20} />
             </button>
          )}

          {/* Audio Button */}
          {inputText.length === 0 && (
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`
                p-3 rounded-full transition-all duration-300 transform
                ${isRecording 
                  ? 'bg-red-500 text-white animate-pulse scale-110' 
                  : 'bg-peach-400 hover:bg-peach-500 text-white hover:scale-105'
                }
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isProcessing ? (
                <Loader2 size={20} className="animate-spin" />
              ) : isRecording ? (
                <Square size={20} fill="currentColor" />
              ) : (
                <Mic size={20} />
              )}
            </button>
          )}
        </div>
        
        {isRecording && (
          <p className="text-center text-xs text-red-500 mt-2 font-medium animate-pulse">
            Recording... Tap stop when done.
          </p>
        )}
      </div>
    </div>
  );
};

export default AudioInputArea;
