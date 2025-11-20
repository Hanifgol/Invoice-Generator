
import React, { useState, useEffect } from 'react';
import { InvoiceData, CompanyProfile } from '../types';

declare var html2pdf: any;

interface PaymentReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  data: InvoiceData;
  companyProfile: CompanyProfile;
}

export const PaymentReceipt: React.FC<PaymentReceiptProps> = ({ isOpen, onClose, data, companyProfile }) => {
  // Local State for Editable Receipt Details
  const [isEditing, setIsEditing] = useState(false);
  const [receiptAmount, setReceiptAmount] = useState(data.totalAmount || 0);
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [payerName, setPayerName] = useState(data.clientName || '');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');

  // Reset state when modal opens with new data
  useEffect(() => {
    if (isOpen) {
        setReceiptAmount(data.totalAmount || 0);
        setReceiptDate(new Date().toISOString().split('T')[0]); // Default to today
        setPayerName(data.clientName || '');
        setIsEditing(false);
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  const { brandColor, currencySymbol } = companyProfile;
  const totalAmount = data.totalAmount || 0;
  const balanceDue = Math.max(0, totalAmount - receiptAmount);
  const isPartialPayment = receiptAmount < totalAmount;

  const handlePrint = () => {
    const printContent = document.getElementById('payment-receipt-container');
    if (!printContent) return;

    // Ensure we are not in edit mode when printing
    setIsEditing(false);

    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime();
    const windowName = 'Print' + uniqueName;
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt - ${data.invoiceNumber}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; }
              .brand-font { font-family: 'Cormorant Garamond', serif; }
            </style>
          </head>
          <body class="bg-white p-8 flex justify-center">
            ${printContent.outerHTML}
            <script>
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownloadPdf = async () => {
      // Ensure we are not in edit mode
      setIsEditing(false);
      
      // Wait for render update
      await new Promise(resolve => setTimeout(resolve, 100));

      const element = document.getElementById('payment-receipt-container');
      if (!element) return;
      
      // OVERLAY STRATEGY: Solves blank/cut-off issues in modals
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.backgroundColor = 'white';
      overlay.style.zIndex = '99999';
      overlay.style.display = 'flex';
      overlay.style.justifyContent = 'center';
      overlay.style.alignItems = 'flex-start'; 
      overlay.style.paddingTop = '40px';
      document.body.appendChild(overlay);

      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.width = '600px';
      clone.style.boxShadow = 'none';
      clone.style.margin = '0';
      overlay.appendChild(clone);

      await new Promise(resolve => setTimeout(resolve, 800));

      const sanitizedClient = (payerName || 'Client').replace(/[^a-z0-9]/gi, '_');
      const filename = `Receipt_${sanitizedClient}_${data.invoiceNumber}.pdf`;

      const opt = {
        margin: 0.2,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true, 
            scrollY: 0,
            windowWidth: 600,
            letterRendering: true,
        },
        jsPDF: { unit: 'in', format: 'a5', orientation: 'portrait' }
      };
      
      try {
        await html2pdf().from(clone).set(opt).save();
      } catch (err: any) {
        console.error("Receipt PDF Error:", err);
        alert("Could not generate PDF. Please try the Print button instead.");
      } finally {
        if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
        }
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-scale-in">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-[#0F172A] brand-font">Payment Receipt</h3>
              {isEditing ? (
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded uppercase tracking-widest border border-amber-100">Editing</span>
              ) : (
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded uppercase tracking-widest border border-green-100">Preview</span>
              )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-[#0F172A] transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-8 bg-[#FDFBF7] flex-grow flex justify-center">
          
          {/* RECEIPT CANVAS */}
          <div id="payment-receipt-container" className={`bg-white w-full max-w-lg p-8 shadow-lg border border-slate-200 relative transition-all ${isEditing ? 'ring-4 ring-amber-100' : ''}`}>
            
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-[0.03]">
               {companyProfile.logoBase64 ? (
                   <img src={companyProfile.logoBase64} className="w-64 grayscale transform -rotate-12" alt="" />
               ) : (
                   <div className="text-9xl font-bold">PAID</div>
               )}
            </div>

            {/* Receipt Header */}
            <div className="text-center mb-8 relative z-10">
                {companyProfile.logoBase64 && (
                    <img src={companyProfile.logoBase64} alt="Logo" className="h-16 mx-auto mb-4 object-contain" />
                )}
                <h2 className="text-xl font-bold text-slate-900 uppercase tracking-widest mb-1">{companyProfile.companyName}</h2>
                <p className="text-xs text-slate-500">{companyProfile.companyAddress}</p>
                <p className="text-xs text-slate-500">{companyProfile.email}</p>
            </div>

            <div className="border-b-2 border-dashed border-slate-300 my-6"></div>

            {/* Title & Amount */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold brand-font text-[#0F172A] mb-4">PAYMENT RECEIPT</h1>
                <div className="flex flex-col items-center justify-center">
                    {isEditing ? (
                         <div className="flex items-center border-b-2 border-[#C5A059] bg-amber-50/50">
                             <span className="text-2xl font-mono font-bold text-slate-500 pl-2">{currencySymbol}</span>
                             <input 
                                type="number" 
                                value={receiptAmount}
                                onChange={(e) => setReceiptAmount(parseFloat(e.target.value))}
                                className="text-2xl font-mono font-bold text-green-700 w-40 bg-transparent border-none focus:ring-0 text-center"
                             />
                         </div>
                    ) : (
                        <div className="inline-block px-6 py-2 bg-green-50 border border-green-200 rounded-full">
                            <span className="text-2xl font-mono font-bold text-green-700">{currencySymbol}{(receiptAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    )}
                    
                    {isPartialPayment && (
                        <div className="mt-2 text-xs text-slate-400 font-medium uppercase tracking-wide">
                            Part payment of <span className="text-slate-600 font-bold">{currencySymbol}{totalAmount.toLocaleString()}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Details Grid */}
            <div className="space-y-4 text-sm relative z-10">
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-slate-500">Payment Date</span>
                    {isEditing ? (
                         <input 
                            type="date"
                            value={receiptDate}
                            onChange={(e) => setReceiptDate(e.target.value)}
                            className="text-right font-bold text-slate-800 bg-amber-50/50 border-b border-[#C5A059] focus:outline-none text-sm"
                         />
                    ) : (
                        <span className="font-bold text-slate-800">{new Date(receiptDate).toLocaleDateString()}</span>
                    )}
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-slate-500">Invoice Reference</span>
                    <span className="font-bold text-slate-800 font-mono">{data.invoiceNumber}</span>
                </div>

                {/* Partial Payment Info */}
                {isPartialPayment && (
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                        <span className="text-slate-500">Total Invoice Amount</span>
                        <span className="font-bold text-slate-800 font-mono">{currencySymbol}{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                )}

                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-slate-500">Received From</span>
                    {isEditing ? (
                        <input 
                            type="text"
                            value={payerName}
                            onChange={(e) => setPayerName(e.target.value)}
                            className="text-right font-bold text-slate-800 bg-amber-50/50 border-b border-[#C5A059] focus:outline-none w-48"
                        />
                    ) : (
                        <span className="font-bold text-slate-800 text-right">{payerName}</span>
                    )}
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-slate-500">Payment Mode</span>
                    {isEditing ? (
                         <select 
                            value={paymentMethod} 
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="text-right font-bold text-slate-800 bg-amber-50/50 border-b border-[#C5A059] focus:outline-none text-sm appearance-none pr-2"
                        >
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cash">Cash</option>
                            <option value="POS">POS</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Transfer">Transfer</option>
                        </select>
                    ) : (
                        <span className="font-bold text-slate-800 text-right">{paymentMethod}</span>
                    )}
                </div>
                
                {/* Balance Due */}
                {balanceDue > 0 && (
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                        <span className="text-slate-500">Balance Due</span>
                        <span className="font-bold text-red-600 font-mono">{currencySymbol}{balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                )}

                 <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-slate-500">Status</span>
                    <span className="font-bold text-green-600 uppercase tracking-widest text-xs bg-green-50 px-2 py-0.5 rounded">Success</span>
                </div>
            </div>

            {/* Bank / Method Info */}
            <div className="mt-8 bg-slate-50 p-4 rounded-lg text-xs text-slate-500 text-center">
                <p className="mb-1">Payment received into:</p>
                <p className="font-mono text-slate-700 whitespace-pre-line">{companyProfile.bankDetails}</p>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
                <p className="text-lg brand-font italic text-slate-400">"Thank you for your patronage."</p>
                {companyProfile.signatureBase64 && (
                    <div className="mt-4 flex justify-center">
                        <img src={companyProfile.signatureBase64} className="h-12 object-contain opacity-70" alt="Signed" />
                    </div>
                )}
                <p className="text-[10px] uppercase font-bold text-slate-300 mt-2 tracking-widest">Authorized Signature</p>
            </div>

          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-white border-t border-slate-100 rounded-b-2xl flex justify-between items-center gap-3">
            
            <div>
                 {isEditing ? (
                     <button 
                        onClick={() => setIsEditing(false)} 
                        className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors text-sm shadow-lg animate-pulse-subtle"
                     >
                        Done Editing
                     </button>
                 ) : (
                     <button 
                        onClick={() => setIsEditing(true)} 
                        className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 font-bold rounded-lg hover:bg-amber-100 transition-colors text-sm flex items-center gap-2"
                     >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        Edit Receipt
                     </button>
                 )}
            </div>

            <div className="flex gap-3">
                <button 
                    onClick={onClose} 
                    className="hidden md:block px-4 py-2 text-slate-500 hover:text-slate-800 font-medium text-sm"
                >
                    Close
                </button>
                
                <button 
                    onClick={handlePrint}
                    disabled={isEditing}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 hover:text-[#0F172A] transition-all active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    <span className="hidden md:inline">Print</span>
                </button>

                <button 
                    onClick={handleDownloadPdf}
                    disabled={isEditing}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white font-bold rounded-lg hover:bg-[#1E293B] shadow-lg hover:shadow-xl transition-all active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span>PDF</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
