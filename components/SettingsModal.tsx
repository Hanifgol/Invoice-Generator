
import React, { useState, useRef, useEffect } from 'react';
import { CompanyProfile, InvoiceTemplateType } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CompanyProfile;
  onSave: (profile: CompanyProfile) => void;
  onReset?: () => void;
}

const resizeImage = (file: File, maxWidth: number = 500): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress as JPEG quality 0.7
        } else {
            reject(new Error("Canvas Context Error"));
        }
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, profile, onSave, onReset }) => {
  const [formData, setFormData] = useState<CompanyProfile>(profile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  // Initialize canvas context when modal opens or signature clears
  useEffect(() => {
    if (isOpen && !formData.signatureBase64) {
      // Brief timeout to ensure DOM is rendered
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
           // Set internal resolution to match display for crisp drawing
           const rect = canvas.getBoundingClientRect();
           if (rect.width > 0 && rect.height > 0) {
               canvas.width = rect.width;
               canvas.height = rect.height;
           }
           
           const ctx = canvas.getContext('2d');
           if (ctx) {
             ctx.lineWidth = 2;
             ctx.lineCap = 'round';
             ctx.strokeStyle = '#000';
           }
        }
      }, 100);
    }
  }, [isOpen, formData.signatureBase64]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTemplateChange = (template: InvoiceTemplateType) => {
    setFormData(prev => ({ ...prev, selectedTemplate: template }));
  }

  // --- Logo Logic ---
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
          const resizedBase64 = await resizeImage(file, 400); // Max width 400px
          setFormData(prev => ({ ...prev, logoBase64: resizedBase64 }));
      } catch (error) {
          console.error("Error resizing logo", error);
      }
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logoBase64: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Signature Logic ---
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
          const resizedBase64 = await resizeImage(file, 400);
          setFormData(prev => ({ ...prev, signatureBase64: resizedBase64 }));
      } catch (error) {
          console.error("Error resizing signature", error);
      }
    }
  };

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = (event as React.MouseEvent).clientX;
      clientY = (event as React.MouseEvent).clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    if ('touches' in e) {
        // e.preventDefault(); // Commented out to allow scrolling if needed, but might need for drawing stability
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    e.preventDefault(); // Prevent scrolling while drawing
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { x, y } = getCoordinates(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
       setIsDrawing(false);
       const canvas = canvasRef.current;
       if (canvas) {
           setFormData(prev => ({ ...prev, signatureBase64: canvas.toDataURL() }));
       }
    }
  };

  const clearSignature = () => {
    setFormData(prev => ({ ...prev, signatureBase64: null }));
    if (signatureInputRef.current) signatureInputRef.current.value = '';
  };

  // --- Data Management Logic ---
  
  const handleBackup = () => {
    const data = {
        profile: formData,
        archive: localStorage.getItem('keeper_invoice_archive'),
        clients: localStorage.getItem('keeper_saved_clients'),
        sequence: localStorage.getItem('keeper_invoice_sequence'),
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Keeper_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const content = e.target?.result as string;
              const data = JSON.parse(content);
              
              if (!data.profile) throw new Error("Invalid backup file");

              if (window.confirm("This will overwrite your current data with the backup. Continue?")) {
                  if (data.profile) localStorage.setItem('keeper_company_profile', JSON.stringify(data.profile));
                  if (data.archive) localStorage.setItem('keeper_invoice_archive', data.archive);
                  if (data.clients) localStorage.setItem('keeper_saved_clients', data.clients);
                  if (data.sequence) localStorage.setItem('keeper_invoice_sequence', data.sequence);
                  
                  alert("Restore successful! The app will now reload.");
                  window.location.reload();
              }
          } catch (err) {
              console.error(err);
              alert("Failed to restore. The file might be corrupted or invalid.");
          }
      };
      reader.readAsText(file);
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };
  
  const handleReset = () => {
      if (window.confirm("Are you sure you want to DELETE your profile data? This will remove your logo, signature, and company details from this device. This action cannot be undone.")) {
          if (onReset) onReset();
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/80 backdrop-blur-sm p-0 md:p-4 transition-all animate-fade-in">
      <div className="bg-white w-full h-full md:h-auto md:rounded-2xl shadow-2xl md:max-w-3xl md:max-h-[90vh] overflow-y-auto flex flex-col border border-slate-100 animate-scale-in">
        
        {/* Modal Header */}
        <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 md:rounded-t-2xl sticky top-0 z-10 backdrop-blur-md">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#0F172A] brand-font">Company Profile</h2>
            <p className="text-xs text-slate-500 uppercase tracking-wide mt-1">Identity & Settings</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-[#0F172A] transition-colors bg-white p-2 rounded-full shadow-sm hover:shadow active:scale-95">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-8 space-y-8 md:space-y-10">
          
          {/* Section: Invoice Design */}
          <div className="space-y-6">
             <h3 className="text-sm font-bold text-[#C5A059] uppercase tracking-widest border-b border-slate-100 pb-2">Invoice Design</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Executive */}
                <div 
                  onClick={() => handleTemplateChange('executive')}
                  className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center text-center transition-all active:scale-95 ${formData.selectedTemplate === 'executive' ? 'border-[#C5A059] bg-[#C5A059]/5' : 'border-slate-100 hover:border-slate-300'}`}
                >
                    <div className="w-full h-20 md:h-24 bg-white border border-slate-200 mb-3 rounded shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#0F172A]"></div>
                        <div className="p-2 space-y-1">
                           <div className="w-1/3 h-1 bg-slate-200 rounded"></div>
                           <div className="w-full h-[1px] bg-slate-100 mt-2"></div>
                        </div>
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${formData.selectedTemplate === 'executive' ? 'text-[#C5A059]' : 'text-slate-500'}`}>Executive</span>
                </div>

                {/* Modern */}
                <div 
                  onClick={() => handleTemplateChange('modern')}
                  className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center text-center transition-all active:scale-95 ${formData.selectedTemplate === 'modern' ? 'border-[#C5A059] bg-[#C5A059]/5' : 'border-slate-100 hover:border-slate-300'}`}
                >
                    <div className="w-full h-20 md:h-24 bg-white border border-slate-200 mb-3 rounded shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-8 bg-[#0F172A]"></div>
                        <div className="p-2 pt-10 space-y-1">
                           <div className="w-full h-6 bg-slate-50 rounded border border-slate-100"></div>
                        </div>
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${formData.selectedTemplate === 'modern' ? 'text-[#C5A059]' : 'text-slate-500'}`}>Modern</span>
                </div>

                {/* Classic */}
                <div 
                  onClick={() => handleTemplateChange('classic')}
                  className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center text-center transition-all active:scale-95 ${formData.selectedTemplate === 'classic' ? 'border-[#C5A059] bg-[#C5A059]/5' : 'border-slate-100 hover:border-slate-300'}`}
                >
                    <div className="w-full h-20 md:h-24 bg-white border-4 border-double border-slate-200 mb-3 rounded shadow-sm flex flex-col items-center p-2 relative">
                        <div className="w-8 h-8 border border-slate-300 rounded-full mb-1"></div>
                        <div className="w-16 h-1 bg-slate-200"></div>
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${formData.selectedTemplate === 'classic' ? 'text-[#C5A059]' : 'text-slate-500'}`}>Classic</span>
                </div>
             </div>
          </div>

          {/* Section: Branding */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-[#C5A059] uppercase tracking-widest border-b border-slate-100 pb-2">Branding</h3>
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-shrink-0 w-full md:w-auto">
                    <label className="block text-xs font-semibold text-slate-600 mb-3">Logo</label>
                    <div className="flex items-center gap-4">
                        <div className="relative group h-24 w-24 flex-shrink-0">
                            {formData.logoBase64 ? (
                                <img src={formData.logoBase64} alt="Logo" className="h-full w-full object-contain rounded-xl border border-slate-200 bg-slate-50" />
                            ) : (
                                <div className="h-full w-full rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 text-slate-300">
                                    <span className="text-[10px]">No Logo</span>
                                </div>
                            )}
                             {formData.logoBase64 && (
                                <button onClick={handleRemoveLogo} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            )}
                        </div>
                        <div className="flex-grow">
                            <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#0F172A] file:text-white hover:file:bg-[#1E293B]" />
                        </div>
                    </div>
                </div>
                <div className="flex-grow grid grid-cols-2 gap-4 w-full">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Brand Color</label>
                        <div className="flex items-center gap-3 border border-slate-200 rounded-lg p-2 bg-white">
                            <input type="color" name="brandColor" value={formData.brandColor || "#0F172A"} onChange={handleChange} className="h-8 w-8 rounded border-0 cursor-pointer" />
                            <span className="text-xs font-mono text-slate-500">{formData.brandColor}</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Currency</label>
                        <input type="text" name="currencySymbol" value={formData.currencySymbol || "₦"} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-base md:text-sm focus:border-[#C5A059] focus:ring-0 outline-none bg-slate-50" />
                    </div>
                </div>
            </div>
          </div>

          {/* Section: Company Details */}
          <div className="space-y-6">
             <h3 className="text-sm font-bold text-[#C5A059] uppercase tracking-widest border-b border-slate-100 pb-2">Business Info</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Company Name</label>
                    <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-base md:text-sm focus:border-[#C5A059] focus:ring-0 outline-none" />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
                    <input type="text" name="companyAddress" value={formData.companyAddress} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-base md:text-sm focus:border-[#C5A059] focus:ring-0 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-base md:text-sm focus:border-[#C5A059] focus:ring-0 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-base md:text-sm focus:border-[#C5A059] focus:ring-0 outline-none" />
                </div>
             </div>
          </div>

          {/* Section: Bank Details & Signature */}
          <div className="space-y-6">
             <h3 className="text-sm font-bold text-[#C5A059] uppercase tracking-widest border-b border-slate-100 pb-2">Bank & Legal</h3>
             <div className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Bank Details</label>
                    <textarea name="bankDetails" value={formData.bankDetails} onChange={handleChange} rows={3} className="w-full px-4 py-3 border border-slate-200 rounded-lg text-base md:text-sm focus:border-[#C5A059] focus:ring-0 outline-none resize-none bg-slate-50" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Terms & Conditions</label>
                    <textarea name="termsAndConditions" value={formData.termsAndConditions || ''} onChange={handleChange} rows={2} className="w-full px-4 py-3 border border-slate-200 rounded-lg text-base md:text-sm focus:border-[#C5A059] focus:ring-0 outline-none resize-none bg-slate-50" />
                </div>
                
                {/* Signature Section */}
                <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-2">Authorized Signature</label>
                    <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
                        
                        {/* If signature exists */}
                        {formData.signatureBase64 ? (
                             <div className="relative group bg-slate-50 border border-slate-100 rounded-lg p-4 flex justify-center items-center h-32">
                                 <img src={formData.signatureBase64} alt="Signature" className="max-h-full max-w-full object-contain" />
                                 <button onClick={clearSignature} className="absolute top-2 right-2 bg-white border border-slate-200 text-red-500 p-2 rounded-full shadow hover:bg-red-50 transition-colors" title="Remove Signature">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                 </button>
                             </div>
                        ) : (
                            /* If no signature, show tabs for Draw / Upload */
                            <div className="flex flex-col gap-4">
                                {/* Draw Area */}
                                <div className="relative w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg overflow-hidden touch-none">
                                    <canvas 
                                        ref={canvasRef}
                                        className="w-full h-full cursor-crosshair"
                                        onMouseDown={startDrawing}
                                        onMouseMove={draw}
                                        onMouseUp={stopDrawing}
                                        onMouseLeave={stopDrawing}
                                        onTouchStart={startDrawing}
                                        onTouchMove={draw}
                                        onTouchEnd={stopDrawing}
                                        // We don't strictly need width/height attrs here if using rect logic in useEffect, but good practice
                                        width={600}
                                        height={200}
                                    />
                                    <div className="absolute bottom-2 right-2 text-[10px] text-slate-400 pointer-events-none select-none bg-white/50 px-2 rounded">
                                        Sign here
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <div className="h-px bg-slate-100 flex-grow"></div>
                                    <span className="text-[10px] text-slate-400 uppercase font-bold">OR Upload Image</span>
                                    <div className="h-px bg-slate-100 flex-grow"></div>
                                </div>

                                <div className="flex items-center justify-center">
                                    <input 
                                        type="file" 
                                        ref={signatureInputRef}
                                        onChange={handleSignatureUpload} 
                                        accept="image/*" 
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer" 
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
             </div>
          </div>

          {/* Section: Data Backup (NEW) */}
          <div className="space-y-6">
             <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest border-b border-slate-100 pb-2">Data Safety</h3>
             <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="w-full">
                    <h4 className="text-sm font-bold text-blue-900">Backup & Restore</h4>
                    <p className="text-xs text-blue-700 mt-1">Save your profile, invoices, and clients to a file, or restore from a previous backup.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button 
                        onClick={handleBackup}
                        className="flex-1 whitespace-nowrap px-4 py-2 bg-white border border-blue-200 text-blue-700 text-xs font-bold rounded hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export Backup
                    </button>
                    <div className="relative flex-1">
                         <input 
                            type="file" 
                            ref={backupInputRef}
                            onChange={handleRestore} 
                            accept=".json" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                         />
                         <button className="w-full whitespace-nowrap px-4 py-2 bg-blue-600 border border-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors flex items-center gap-2">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                             Restore Data
                         </button>
                    </div>
                </div>
             </div>
          </div>
          
          {/* Danger Zone */}
          <div className="pt-6 border-t border-red-100">
            <h3 className="text-sm font-bold text-red-600 uppercase tracking-widest mb-3">Danger Zone</h3>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                <div>
                    <p className="text-sm font-bold text-red-800">Delete Profile Data</p>
                    <p className="text-xs text-red-600">Permanently removes all data.</p>
                </div>
                <button 
                    onClick={handleReset}
                    className="px-4 py-2 bg-white border border-red-200 text-red-600 text-xs font-bold rounded hover:bg-red-600 hover:text-white transition-colors"
                >
                    Delete Data
                </button>
            </div>
          </div>

        </div>

        <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50/80 flex justify-end space-x-4 md:rounded-b-2xl pb-8 md:pb-6">
          <button onClick={onClose} className="px-6 py-3 md:py-2 text-slate-500 font-medium hover:text-slate-800 transition-colors text-sm">Cancel</button>
          <button onClick={handleSave} className="px-8 py-3 md:py-2 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all transform active:scale-95 text-sm tracking-wide" style={{ backgroundColor: formData.brandColor || '#0F172A' }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
};
