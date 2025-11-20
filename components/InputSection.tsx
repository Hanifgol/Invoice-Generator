
import React, { useState, useRef, useCallback } from 'react';
import { AppState, InvoiceData, InvoiceStatus, Client } from '../types';

interface InputSectionProps {
  onGenerate: (text: string, imageFile: File | null, audioFile: File | null) => void;
  appState: AppState;
  currentData: InvoiceData;
  onManualUpdate: (field: keyof InvoiceData, value: any) => void;
  savedClients?: Client[];
  onPdfExport?: () => void;
  onAutoGenerateInvoiceNumber?: () => void;
}

export const InputSection: React.FC<InputSectionProps> = ({ 
    onGenerate, 
    appState, 
    currentData, 
    onManualUpdate, 
    savedClients = [], 
    onPdfExport,
    onAutoGenerateInvoiceNumber 
}) => {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback((files: File[]) => {
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        setImageFile(file);
        setImagePreviewUrl(URL.createObjectURL(file));
      } else if (file.type.startsWith('audio/')) {
        setAudioFile(file);
      } else if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (typeof e.target?.result === 'string') {
            setText(prev => (prev ? prev + '\n\n' : '') + e.target?.result);
          }
        };
        reader.readAsText(file);
      }
    });
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) processFiles(files);
  };

  const handleClientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value;
      onManualUpdate('clientName', newName);
      const match = savedClients.find(c => c.name.toLowerCase() === newName.toLowerCase());
      if (match && match.address) {
          onManualUpdate('clientAddress', match.address);
      }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreviewUrl(null);
  };

  const removeAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAudioFile(null);
  };

  const handleSubmit = () => {
    if (!text.trim() && !imageFile && !audioFile) return;
    onGenerate(text, imageFile, audioFile);
  };

  const isProcessing = appState === AppState.PROCESSING;

  return (
    <div className="p-4 space-y-8">
      
      {/* 1. Manual Details Section */}
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#C5A059] font-bold text-xs uppercase tracking-widest">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                <span>Details</span>
            </div>
            {onPdfExport && (
                <button onClick={onPdfExport} className="text-slate-400 hover:text-[#0F172A] transition-colors p-2" title="Quick PDF Export">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </button>
            )}
        </div>
        
        <div className="space-y-4">
            <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">Client Name</label>
                <input 
                    type="text" 
                    list="client-suggestions"
                    value={currentData.clientName}
                    onChange={handleClientNameChange}
                    placeholder="e.g. Chevron Nigeria Ltd"
                    className="w-full px-3 py-3 md:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base md:text-sm focus:border-[#C5A059] focus:ring-0 outline-none transition-colors focus:bg-white"
                />
                <datalist id="client-suggestions">
                    {savedClients.map((client) => (
                        <option key={client.id} value={client.name} />
                    ))}
                </datalist>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">Invoice #</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={currentData.invoiceNumber || ''}
                            onChange={(e) => onManualUpdate('invoiceNumber', e.target.value)}
                            placeholder="INV-001"
                            className="w-full pl-3 pr-8 py-3 md:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base md:text-sm focus:border-[#C5A059] focus:ring-0 outline-none transition-colors focus:bg-white font-mono"
                        />
                        {onAutoGenerateInvoiceNumber && (
                            <button 
                                onClick={onAutoGenerateInvoiceNumber}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-[#C5A059] p-1 rounded hover:bg-slate-100 transition-colors"
                                title="Reset to Auto Number"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </button>
                        )}
                    </div>
                </div>
                <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">Date</label>
                    <input 
                        type="date" 
                        value={currentData.invoiceDate}
                        onChange={(e) => onManualUpdate('invoiceDate', e.target.value)}
                        className="w-full px-3 py-3 md:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base md:text-sm focus:border-[#C5A059] focus:ring-0 outline-none transition-colors focus:bg-white"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">Status</label>
                    <select 
                        value={currentData.status || 'PENDING'}
                        onChange={(e) => onManualUpdate('status', e.target.value as InvoiceStatus)}
                        className={`w-full px-3 py-3 md:py-2.5 border rounded-lg text-xs font-bold uppercase tracking-wide focus:ring-0 outline-none appearance-none
                            ${currentData.status === 'PAID' ? 'bg-green-50 border-green-200 text-green-700' : 
                              currentData.status === 'OVERDUE' ? 'bg-red-50 border-red-200 text-red-700' : 
                              'bg-slate-50 border-slate-200 text-slate-700'}
                        `}
                    >
                        <option value="PENDING">PENDING</option>
                        <option value="PAID">PAID</option>
                        <option value="OVERDUE">OVERDUE</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">Closing Note</label>
                    <input 
                        type="text" 
                        value={currentData.closingMessage}
                        onChange={(e) => onManualUpdate('closingMessage', e.target.value)}
                        placeholder="Thank you..."
                        className="w-full px-3 py-3 md:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base md:text-sm focus:border-[#C5A059] focus:ring-0 outline-none transition-colors focus:bg-white"
                    />
                 </div>
            </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* 2. AI Input Section */}
      <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#C5A059] font-bold text-xs uppercase tracking-widest">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <span>AI Generator</span>
            </div>
            
            <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                className={`
                    relative w-full min-h-[140px] rounded-xl border-2 border-dashed transition-all duration-300 
                    flex flex-col items-center justify-center p-4 gap-3 cursor-pointer group active:bg-slate-100
                    ${isDragging 
                        ? 'border-[#C5A059] bg-[#C5A059]/10 scale-[1.01]' 
                        : 'border-slate-200 bg-slate-50 hover:border-[#C5A059]/50 hover:bg-white'
                    }
                    ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    multiple 
                    accept="image/*,audio/*,text/plain" 
                    onChange={handleFileSelect} 
                    disabled={isProcessing}
                />

                {!imageFile && !audioFile && (
                    <>
                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-[#C5A059] transition-colors">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-bold text-slate-700">Drop files here</p>
                            <p className="text-[10px] text-slate-400">Voice notes, Images, Text</p>
                        </div>
                    </>
                )}

                {/* Uploaded Files Display */}
                {(imageFile || audioFile) && (
                    <div className="w-full flex flex-col gap-2 z-10">
                        {imageFile && (
                            <div className="flex items-center p-2 bg-white border border-slate-200 rounded-lg shadow-sm gap-3" onClick={(e) => e.stopPropagation()}>
                                <div className="h-8 w-8 rounded bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-100">
                                    {imagePreviewUrl && <img src={imagePreviewUrl} className="h-full w-full object-cover" alt="Preview" />}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="text-xs font-bold text-slate-700 truncate">{imageFile.name}</p>
                                </div>
                                <button onClick={removeImage} className="text-slate-400 hover:text-red-500 p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </div>
                        )}
                        {audioFile && (
                            <div className="flex items-center p-2 bg-[#0F172A] border border-slate-200 rounded-lg shadow-sm gap-3" onClick={(e) => e.stopPropagation()}>
                                <div className="h-8 w-8 rounded bg-white/10 flex items-center justify-center flex-shrink-0 text-[#C5A059]"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg></div>
                                <div className="flex-grow min-w-0">
                                    <p className="text-xs font-bold text-white truncate">{audioFile.name}</p>
                                </div>
                                <button onClick={removeAudio} className="text-slate-400 hover:text-white p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <textarea
                className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#C5A059] focus:bg-white transition-all resize-none text-base md:text-xs text-slate-700 placeholder-slate-400 leading-relaxed"
                placeholder="Or type notes here (e.g. Pick up at Airport 9am...)"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isProcessing}
            />

            <button
                onClick={handleSubmit}
                disabled={(!text && !imageFile && !audioFile) || isProcessing}
                className={`w-full py-3.5 md:py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all shadow-md
                    ${(!text && !imageFile && !audioFile) || isProcessing
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-[#0F172A] text-white hover:bg-[#1E293B] hover:shadow-lg active:scale-95'
                    }
                `}
            >
                {isProcessing ? 'Processing...' : 'Generate'}
            </button>
      </div>
    </div>
  );
};
