import React, { useState, useCallback, useEffect } from 'react';
import { InputSection } from './components/InputSection';
import { InvoiceTemplate } from './components/InvoiceTemplate';
import { SettingsModal } from './components/SettingsModal';
import { InvoiceArchive } from './components/InvoiceArchive';
import { Dashboard } from './components/Dashboard';
import { PaymentReceipt } from './components/PaymentReceipt';
import { AppState, InvoiceData, CompanyProfile, ArchivedInvoice, InvoiceStatus, Client, InvoiceItem, InvoiceTemplateType } from './types';
import { parseInvoiceFromNotes } from './services/geminiService';
import { generateDocx } from './services/docxGenerator';
import { generateCsv } from './services/csvGenerator';

declare var html2pdf: any;

// Default company profile
const DEFAULT_PROFILE: CompanyProfile = {
  companyName: "amm empress car hire service",
  companyAddress: "Adeleke Adedoyin Victoria Island, Eti Osa, Lagos",
  email: "ammempresscarhire@gmail.com",
  phone: "08032127110",
  website: "",
  taxId: "",
  bankDetails: "Bank Name: Kuda\nAccount Number: 3002574195\nAccount Name: Amm Empress Car Hire Services",
  logoBase64: null,
  signatureBase64: null,
  brandColor: "#0F172A", // Midnight Blue
  currencySymbol: "₦", // Default to Naira
  termsAndConditions: "",
  selectedTemplate: 'executive'
};

// Utility to manage invoice numbering
const getNextInvoiceNumber = (): string => {
  if (typeof window === 'undefined') return "INV-001";
  const savedSeq = localStorage.getItem('keeper_invoice_sequence');
  const nextNum = savedSeq ? parseInt(savedSeq, 10) + 1 : 1;
  return `INV-${String(nextNum).padStart(3, '0')}`;
};

const commitAndIncrementInvoiceNumber = (currentNumber: string) => {
  const match = currentNumber.match(/(\d+)$/);
  let nextSeq = 1;
  if (match) {
    nextSeq = parseInt(match[0], 10);
  } else {
    const savedSeq = localStorage.getItem('keeper_invoice_sequence');
    nextSeq = savedSeq ? parseInt(savedSeq, 10) + 1 : 1;
  }
  localStorage.setItem('keeper_invoice_sequence', nextSeq.toString());
};

// Default Invoice Draft Generator
const createDefaultInvoice = (): InvoiceData => ({
  clientName: "",
  clientAddress: "",
  invoiceDate: new Date().toISOString().split('T')[0],
  invoiceNumber: getNextInvoiceNumber(),
  items: [],
  subtotal: 0,
  totalAmount: 0,
  closingMessage: "Thank you for your business.",
  status: 'PENDING'
});

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(createDefaultInvoice);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState(0); 
  
  // View Mode: Generator, Archive, or Dashboard
  const [viewMode, setViewMode] = useState<'generator' | 'archive' | 'dashboard'>('generator');

  // Mobile Tab State
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');

  // Edit Mode State
  const [isEditMode, setIsEditMode] = useState(false);
  const [backupData, setBackupData] = useState<InvoiceData | null>(null);

  // Settings & Archive State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(DEFAULT_PROFILE);
  const [archivedInvoices, setArchivedInvoices] = useState<ArchivedInvoice[]>([]);
  
  // Receipt Modal State
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<InvoiceData | null>(null);

  // Client Address Book
  const [savedClients, setSavedClients] = useState<Client[]>([]);

  // Load Data on Mount
  useEffect(() => {
    // Profile
    const savedProfile = localStorage.getItem('keeper_company_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setCompanyProfile({ ...DEFAULT_PROFILE, ...parsed });
      } catch (e) { console.error(e); }
    } else {
      setCompanyProfile(DEFAULT_PROFILE);
    }

    // Archive
    const savedArchive = localStorage.getItem('keeper_invoice_archive');
    if (savedArchive) {
      try {
        setArchivedInvoices(JSON.parse(savedArchive));
      } catch (e) { console.error(e); }
    }
    
    // Clients
    const savedClientsData = localStorage.getItem('keeper_saved_clients');
    if (savedClientsData) {
      try {
        setSavedClients(JSON.parse(savedClientsData));
      } catch (e) { console.error(e); }
    }
  }, []);

  const handleSaveProfile = (profile: CompanyProfile) => {
    setCompanyProfile(profile);
    try {
      localStorage.setItem('keeper_company_profile', JSON.stringify(profile));
    } catch (e) {
      console.error("Storage failed", e);
      alert("Storage limit reached! Your logo might be too large.");
    }
  };

  const handleResetProfile = () => {
    setCompanyProfile(DEFAULT_PROFILE);
    localStorage.removeItem('keeper_company_profile');
    setIsSettingsOpen(false);
  };

  // Client Management Logic
  const saveClientIfNew = (name: string, address?: string) => {
      if (!name) return;
      const normalizedName = name.trim();
      
      setSavedClients(prev => {
          const existingIndex = prev.findIndex(c => c.name.toLowerCase() === normalizedName.toLowerCase());
          let newClients = [...prev];
          
          if (existingIndex >= 0) {
              newClients[existingIndex] = {
                  ...newClients[existingIndex],
                  lastSeen: Date.now(),
                  address: address || newClients[existingIndex].address
              };
          } else {
              newClients.push({
                  id: Date.now().toString(),
                  name: normalizedName,
                  address: address || '',
                  lastSeen: Date.now()
              });
          }
          
          newClients.sort((a, b) => b.lastSeen - a.lastSeen);
          localStorage.setItem('keeper_saved_clients', JSON.stringify(newClients));
          return newClients;
      });
  };

  // Archive Logic
  const saveToArchive = (invoice: InvoiceData) => {
    if (invoice.items.length === 0 && !invoice.clientName) return;
    saveClientIfNew(invoice.clientName, invoice.clientAddress);

    const newEntry: ArchivedInvoice = {
      id: Date.now().toString(),
      createdAt: Date.now(),
      data: invoice
    };

    const updatedArchive = [newEntry, ...archivedInvoices];
    setArchivedInvoices(updatedArchive);
    localStorage.setItem('keeper_invoice_archive', JSON.stringify(updatedArchive));
  };

  const handleDeleteArchive = (id: string) => {
    const updatedArchive = archivedInvoices.filter(inv => inv.id !== id);
    setArchivedInvoices(updatedArchive);
    localStorage.setItem('keeper_invoice_archive', JSON.stringify(updatedArchive));
  };

  const handleArchiveStatusUpdate = (id: string, newStatus: InvoiceStatus) => {
    const updatedArchive = archivedInvoices.map(inv => 
        inv.id === id ? { ...inv, data: { ...inv.data, status: newStatus } } : inv
    );
    setArchivedInvoices(updatedArchive);
    localStorage.setItem('keeper_invoice_archive', JSON.stringify(updatedArchive));
  };

  const handleLoadArchive = (archived: ArchivedInvoice) => {
    setInvoiceData(archived.data);
    setViewMode('generator');
    setMobileTab('preview'); // Switch to preview on load
  };

  // Receipt Handlers
  const handleOpenReceipt = (data: InvoiceData) => {
      setReceiptData(data);
      setIsReceiptOpen(true);
  };

  // Input & Generation Logic
  const handleManualUpdate = (field: keyof InvoiceData, value: any) => {
    setInvoiceData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleAutoGenerateInvoiceNumber = () => {
    const nextNum = getNextInvoiceNumber();
    setInvoiceData(prev => ({ ...prev, invoiceNumber: nextNum }));
  };

  const handleGenerate = useCallback(async (text: string, imageFile: File | null, audioFile: File | null) => {
    setAppState(AppState.PROCESSING);
    setError(null);
    setIsEditMode(false);
    setBackupData(null);

    try {
      let imageBase64: string | undefined = undefined;
      let imageMime: string = 'image/jpeg';
      if (imageFile) {
        imageBase64 = await fileToBase64(imageFile);
        imageMime = imageFile.type;
      }

      let audioBase64: string | undefined = undefined;
      let audioMime: string = 'audio/mp3';
      if (audioFile) {
        audioBase64 = await fileToBase64(audioFile);
        audioMime = audioFile.type;
      }

      const currentContext = {
        clientName: invoiceData.clientName,
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceDate: invoiceData.invoiceDate,
      };

      const generatedData = await parseInvoiceFromNotes(text, imageBase64, imageMime, audioBase64, audioMime, currentContext);
      
      const normalizedClientName = generatedData.clientName.trim().toLowerCase();
      const existingClient = savedClients.find(c => c.name.toLowerCase() === normalizedClientName);
      
      if (existingClient && !generatedData.clientAddress) {
          generatedData.clientAddress = existingClient.address;
      }

      setInvoiceData(generatedData);
      setAppState(AppState.SUCCESS);
      setMobileTab('preview'); // Auto switch to preview on mobile after generation
    } catch (err: any) {
      console.error(err);
      setError(err.message || "The Keeper could not decipher these notes. Please try again.");
      setAppState(AppState.ERROR);
    }
  }, [invoiceData, savedClients]); 

  const handleExportDocx = () => {
    generateDocx(invoiceData, companyProfile);
  };

  const handleExportCsv = () => {
    generateCsv(invoiceData);
  };

  const handleDownloadPdf = async () => {
    const element = document.getElementById('invoice-preview-container');
    if (!element) return;

    // Create offscreen overlay with Fixed Desktop Width (1024px)
    // This forces the layout to render in "Desktop Mode" (side-by-side columns) 
    // rather than stacking vertically which happens at narrower widths.
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed', 
      top: '-10000px', 
      left: '-10000px',
      width: '1024px', // Force desktop width
      backgroundColor: '#ffffff',
      zIndex: '1000',
    });
    document.body.appendChild(overlay);

    // Clone element
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Apply PDF Mode class (defined in index.html)
    clone.classList.add('pdf-mode');
    
    // Remove UI specific classes that might conflict or look bad in print
    clone.classList.remove('ring-4', 'ring-amber-400', 'shadow-2xl', 'rounded-sm', 'rounded-lg', 'border');
    
    overlay.appendChild(clone);

    // Wait for a moment to ensure clone is rendered by the browser
    await new Promise(resolve => setTimeout(resolve, 500));

    const sanitizedClient = (invoiceData.clientName || 'Client').replace(/[^a-z0-9]/gi, '_');
    const sanitizedDate = (invoiceData.invoiceDate || new Date().toISOString().split('T')[0]);
    const filename = `Invoice_${sanitizedClient}_${sanitizedDate}.pdf`;
    
    const opt = {
      margin: [10, 10, 10, 10], // 10mm margins
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, // Higher resolution for crisp text
        useCORS: true, 
        letterRendering: true,
        scrollY: 0,
        windowWidth: 1024, // IMPORTANT: Tell html2canvas to render at desktop width
        width: 1024        // IMPORTANT: Capture at desktop width
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      await html2pdf().set(opt).from(clone).save();
    } catch (e) {
      console.error("PDF Generation Error", e);
      alert("Could not generate PDF. Please try DOCX export instead.");
    } finally {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }
  };

  const handleArchiveDownloadPdf = async (invoice: ArchivedInvoice) => {
    // 1. Switch to Generator View so the template renders in the background
    setInvoiceData(invoice.data);
    setViewMode('generator');
    setMobileTab('preview');

    // 2. Wait for DOM update then Download
    // Increased timeout slightly to ensure complex templates render fully
    setTimeout(() => {
        handleDownloadPdf();
    }, 800);
  };

  const handleNewInvoice = () => {
    if (invoiceData.items.length > 0 || invoiceData.totalAmount > 0) {
        saveToArchive(invoiceData);
    }
    if (invoiceData.invoiceNumber) {
        commitAndIncrementInvoiceNumber(invoiceData.invoiceNumber);
    }
    setAppState(AppState.IDLE);
    setError(null);
    setInvoiceData(createDefaultInvoice());
    setSessionId(prev => prev + 1);
    setViewMode('generator');
    setMobileTab('editor');
    setIsEditMode(false);
    setBackupData(null);
  };

  const cycleTemplate = () => {
      const templates: InvoiceTemplateType[] = ['executive', 'modern', 'classic'];
      const currentIndex = templates.indexOf(companyProfile.selectedTemplate);
      const nextIndex = (currentIndex + 1) % templates.length;
      const nextTemplate = templates[nextIndex];
      const newProfile = { ...companyProfile, selectedTemplate: nextTemplate };
      setCompanyProfile(newProfile);
      localStorage.setItem('keeper_company_profile', JSON.stringify(newProfile));
  };

  const toggleEditMode = () => {
    if (isEditMode) {
        if (backupData) setInvoiceData(backupData);
        setIsEditMode(false);
        setBackupData(null);
    } else {
        setBackupData({ ...invoiceData });
        setIsEditMode(true);
    }
  };

  const saveEdits = () => {
      setIsEditMode(false);
      setBackupData(null);
  };

  const handleLineItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
      setInvoiceData(prev => {
          const newItems = [...prev.items];
          newItems[index] = { ...newItems[index], [field]: value };
          const newTotal = newItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
          return { ...prev, items: newItems, subtotal: newTotal, totalAmount: newTotal };
      });
  };

  const handleDeleteLineItem = (index: number) => {
      setInvoiceData(prev => {
          const newItems = prev.items.filter((_, i) => i !== index);
          const newTotal = newItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
           return { ...prev, items: newItems, subtotal: newTotal, totalAmount: newTotal };
      });
  };

  const handleAddLineItem = () => {
      setInvoiceData(prev => {
          const newItems = [...prev.items, { date: prev.invoiceDate, description: "New Trip", amount: 0 }];
          return { ...prev, items: newItems };
      });
  }

  // --- ICONS ---
  const HomeIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
  const HistoryIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  const ChartIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
  const SettingsIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

  return (
    <div className="h-screen w-screen bg-slate-100 flex overflow-hidden font-sans text-slate-800">
        
        {/* --- 1. SIDEBAR NAVIGATION (Desktop) --- */}
        <nav className="w-16 md:w-20 bg-[#0F172A] flex flex-col items-center py-6 gap-8 z-50 flex-shrink-0 shadow-xl hidden md:flex">
            {/* Logo */}
            <div className="w-10 h-10 rounded-xl bg-[#C5A059] flex items-center justify-center text-[#0F172A] font-bold text-lg mb-4 shadow-lg shadow-[#C5A059]/20 cursor-pointer" onClick={handleNewInvoice} title="New Invoice">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>

            {/* Nav Items */}
            <div className="flex flex-col gap-6 w-full">
                <button 
                    onClick={() => setViewMode('generator')}
                    className={`w-full h-12 flex items-center justify-center relative group ${viewMode === 'generator' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                    title="Editor"
                >
                    <HomeIcon />
                    {viewMode === 'generator' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C5A059] rounded-r"></div>}
                </button>
                <button 
                    onClick={() => setViewMode('archive')}
                    className={`w-full h-12 flex items-center justify-center relative group ${viewMode === 'archive' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                    title="History"
                >
                    <HistoryIcon />
                    {viewMode === 'archive' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C5A059] rounded-r"></div>}
                </button>
                <button 
                    onClick={() => setViewMode('dashboard')}
                    className={`w-full h-12 flex items-center justify-center relative group ${viewMode === 'dashboard' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                    title="Dashboard"
                >
                    <ChartIcon />
                    {viewMode === 'dashboard' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C5A059] rounded-r"></div>}
                </button>
            </div>

            <div className="mt-auto mb-4">
                 <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-700 hover:border-[#C5A059] transition-all"
                    title="Settings"
                >
                    {companyProfile.logoBase64 ? (
                        <img src={companyProfile.logoBase64} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400"><SettingsIcon /></div>
                    )}
                </button>
            </div>
        </nav>

        {/* --- MOBILE BOTTOM TAB BAR --- */}
        {viewMode === 'generator' && (
            <div className="md:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-[#0F172A] text-white rounded-full shadow-2xl p-1 flex items-center gap-1 border border-slate-700">
                <button 
                    onClick={() => setMobileTab('editor')}
                    className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${mobileTab === 'editor' ? 'bg-[#C5A059] text-[#0F172A]' : 'hover:bg-white/10 text-slate-300'}`}
                >
                    Editor
                </button>
                <button 
                    onClick={() => setMobileTab('preview')}
                    className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${mobileTab === 'preview' ? 'bg-[#C5A059] text-[#0F172A]' : 'hover:bg-white/10 text-slate-300'}`}
                >
                    Invoice
                </button>
            </div>
        )}
        
        {/* Mobile Header & Nav */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#0F172A] z-50 flex items-center justify-between px-4 shadow-lg">
             <div className="w-8 h-8 rounded-lg bg-[#C5A059] flex items-center justify-center text-[#0F172A] font-bold" onClick={() => setIsSettingsOpen(true)}>
                {companyProfile.logoBase64 ? (
                     <img src={companyProfile.logoBase64} className="w-full h-full object-cover rounded-lg" />
                ) : (
                     <SettingsIcon />
                )}
             </div>
             <div className="flex gap-4 text-slate-400">
                  <button onClick={() => setViewMode('generator')} className={`${viewMode === 'generator' ? 'text-white' : ''}`}><HomeIcon /></button>
                  <button onClick={() => setViewMode('archive')} className={`${viewMode === 'archive' ? 'text-white' : ''}`}><HistoryIcon /></button>
                  <button onClick={() => setViewMode('dashboard')} className={`${viewMode === 'dashboard' ? 'text-white' : ''}`}><ChartIcon /></button>
             </div>
             <button onClick={handleNewInvoice} className="text-[#C5A059] font-bold text-xl h-10 w-10 flex items-center justify-center">+</button>
        </div>

        {/* --- 2. CONTENT AREA --- */}
        <div className="flex-1 flex overflow-hidden relative pt-14 md:pt-0">
            
            {/* --- COLUMN A: INPUT PANEL (Only in Generator Mode) --- */}
            {viewMode === 'generator' && (
                <div className={`w-full md:w-[400px] lg:w-[450px] bg-white border-r border-slate-200 flex flex-col z-40 transition-all duration-300 shadow-xl 
                    ${mobileTab === 'editor' ? 'flex' : 'hidden md:flex'}
                    ${isEditMode ? 'opacity-40 pointer-events-none grayscale' : ''}
                `}>
                     <div className="p-5 border-b border-slate-100 bg-white sticky top-0 z-10">
                        <h2 className="text-lg font-bold text-[#0F172A] brand-font tracking-wide">Journey Details</h2>
                        <p className="text-xs text-slate-400">Input trip information below</p>
                     </div>
                     <div className="flex-1 overflow-y-auto pb-24 md:pb-0">
                         <InputSection 
                             key={sessionId}
                             onGenerate={handleGenerate} 
                             appState={appState}
                             currentData={invoiceData}
                             onManualUpdate={handleManualUpdate}
                             savedClients={savedClients}
                             onPdfExport={handleDownloadPdf}
                             onAutoGenerateInvoiceNumber={handleAutoGenerateInvoiceNumber}
                         />
                         {appState === AppState.ERROR && error && (
                            <div className="m-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
                                <p className="text-sm text-red-700 font-medium">{error}</p>
                            </div>
                        )}
                     </div>
                </div>
            )}

            {/* --- COLUMN B: MAIN STAGE (Invoice / Archive / Dashboard) --- */}
            <div className={`flex-1 bg-slate-100 relative flex-col overflow-hidden 
                ${viewMode === 'generator' && mobileTab === 'editor' ? 'hidden md:flex' : 'flex'}
            `}>
                
                {/* TOP BAR (Floating Actions) - Only for Generator */}
                {viewMode === 'generator' && (
                     <div className="absolute top-4 left-0 right-0 z-30 px-2 md:px-8 flex justify-center pointer-events-none">
                        <div className="bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-lg rounded-full p-1.5 flex items-center gap-1 pointer-events-auto animate-fade-in delay-200 overflow-x-auto max-w-full md:max-w-fit no-scrollbar">
                            {isEditMode ? (
                                <>
                                    <button onClick={toggleEditMode} className="px-4 py-2 rounded-full text-sm md:text-xs font-bold uppercase tracking-wide text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap">Cancel</button>
                                    <button onClick={saveEdits} className="px-4 py-2 rounded-full text-sm md:text-xs font-bold uppercase tracking-wide bg-green-600 text-white hover:bg-green-700 shadow-sm whitespace-nowrap">Save Changes</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={cycleTemplate} className="px-4 py-2 rounded-full text-sm md:text-xs font-bold uppercase tracking-wide text-slate-600 hover:text-[#0F172A] hover:bg-slate-50 transition-colors flex items-center gap-2 whitespace-nowrap" title="Switch Style">
                                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                                         <span>{companyProfile.selectedTemplate}</span>
                                    </button>
                                    <div className="w-px h-4 bg-slate-200 mx-1 flex-shrink-0"></div>
                                    <button onClick={toggleEditMode} className="p-3 md:p-2 rounded-full text-slate-500 hover:text-[#0F172A] hover:bg-slate-100 transition-colors" title="Edit Lines">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                    {invoiceData.status === 'PAID' && (
                                        <button onClick={() => handleOpenReceipt(invoiceData)} className="p-3 md:p-2 rounded-full text-green-600 hover:bg-green-50 transition-colors" title="Receipt">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        </button>
                                    )}
                                    <button onClick={() => saveToArchive(invoiceData)} className="p-3 md:p-2 rounded-full text-slate-500 hover:text-[#0F172A] hover:bg-slate-100 transition-colors" title="Save">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                    </button>
                                    <div className="w-px h-4 bg-slate-200 mx-1 flex-shrink-0"></div>
                                    <button onClick={handleDownloadPdf} className="px-4 py-2 rounded-full bg-[#0F172A] text-white text-sm md:text-xs font-bold uppercase tracking-wide hover:bg-[#1E293B] shadow-md transition-all flex items-center gap-2 whitespace-nowrap">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        <span>PDF</span>
                                    </button>
                                    <div className="flex items-center pl-2 gap-2">
                                        <button onClick={handleExportDocx} className="text-xs md:text-[10px] font-bold text-slate-400 hover:text-[#0F172A] px-2 py-2">DOCX</button>
                                        <button onClick={handleExportCsv} className="text-xs md:text-[10px] font-bold text-slate-400 hover:text-[#0F172A] px-2 py-2">CSV</button>
                                    </div>
                                </>
                            )}
                        </div>
                     </div>
                )}

                {/* MAIN SCROLLABLE AREA */}
                {/* Increased top padding on mobile to ensure content sits below the floating toolbar */}
                <div className={`flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 flex justify-center pb-24 md:pb-8 ${viewMode === 'generator' ? 'pt-24 md:pt-8' : 'pt-4'}`}>
                    {viewMode === 'generator' && (
                        <div className="w-full max-w-[800px] animate-scale-in">
                             {appState === AppState.PROCESSING && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-100/50 backdrop-blur-sm">
                                     <div className="flex flex-col items-center bg-white p-8 rounded-2xl shadow-2xl border border-slate-100">
                                        <div className="w-12 h-12 border-4 border-slate-100 border-t-[#C5A059] rounded-full animate-spin mb-4"></div>
                                        <h3 className="text-lg brand-font text-[#0F172A] animate-pulse-subtle">Keeper Processing...</h3>
                                     </div>
                                </div>
                             )}
                             
                             <div id="invoice-preview-container" className={`printable-area transition-all duration-300 origin-top ${isEditMode ? 'ring-4 ring-amber-400 rounded-sm scale-[0.98]' : 'shadow-2xl'}`}>
                                <InvoiceTemplate 
                                    data={invoiceData} 
                                    companyProfile={companyProfile}
                                    isEditing={isEditMode}
                                    onItemChange={handleLineItemChange}
                                    onDeleteItem={handleDeleteLineItem}
                                    onAddItem={handleAddLineItem}
                                />
                            </div>
                            <div className="h-20"></div> {/* Bottom Spacer */}
                        </div>
                    )}

                    {viewMode === 'archive' && (
                        <div className="w-full max-w-5xl animate-fade-in-up">
                            <InvoiceArchive 
                                invoices={archivedInvoices} 
                                companyProfile={companyProfile}
                                onLoad={handleLoadArchive}
                                onDelete={handleDeleteArchive}
                                onStatusChange={handleArchiveStatusUpdate}
                                currencySymbol={companyProfile.currencySymbol}
                                onClose={() => setViewMode('generator')}
                                onOpenReceipt={handleOpenReceipt}
                                onDownloadPdf={handleArchiveDownloadPdf}
                            />
                        </div>
                    )}

                    {viewMode === 'dashboard' && (
                        <div className="w-full max-w-5xl animate-fade-in-up">
                            <Dashboard 
                                invoices={archivedInvoices}
                                currencySymbol={companyProfile.currencySymbol}
                                onClose={() => setViewMode('generator')}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>

      {/* Modals */}
      <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          profile={companyProfile}
          onSave={handleSaveProfile}
          onReset={handleResetProfile}
      />
      
      {receiptData && (
          <PaymentReceipt
              isOpen={isReceiptOpen}
              onClose={() => setIsReceiptOpen(false)}
              data={receiptData}
              companyProfile={companyProfile}
          />
      )}
    </div>
  );
};

export default App;