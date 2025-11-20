import React from 'react';
import { InvoiceData, CompanyProfile, InvoiceStatus, InvoiceItem } from '../types';

interface InvoiceTemplateProps {
  data: InvoiceData;
  companyProfile: CompanyProfile;
  isEditing?: boolean;
  onItemChange?: (index: number, field: keyof InvoiceItem, value: any) => void;
  onDeleteItem?: (index: number) => void;
  onAddItem?: () => void;
}

// --- Icons ---
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
);
const MapPinIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);
const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
);
const MailIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
);
const TrashIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
);

// --- Utility Components ---

const StatusBadge: React.FC<{ status?: InvoiceStatus }> = ({ status }) => {
  if (!status) return null;

  const styles = {
    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    OVERDUE: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const currentStyle = styles[status] || styles.PENDING;

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${currentStyle}`}>
      {status}
    </span>
  );
};

const GhostRows = () => (
  <>
    {Array(3).fill(0).map((_, i) => (
      <tr key={i} className="animate-pulse avoid-break">
        <td className="py-6 px-4"><div className="h-3 bg-slate-100 rounded w-20"></div></td>
        <td className="py-6 px-4"><div className="h-3 bg-slate-100 rounded w-3/4 mb-3"></div><div className="h-2 bg-slate-50 rounded w-1/2"></div></td>
        <td className="py-6 px-4"><div className="h-3 bg-slate-100 rounded w-12 ml-auto"></div></td>
      </tr>
    ))}
  </>
);

const AddRowButton = ({ onClick }: { onClick?: () => void }) => (
    <button 
        onClick={onClick}
        className="mt-4 w-full border-2 border-dashed border-[#C5A059] bg-[#C5A059]/5 text-[#C5A059] py-3 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-[#C5A059]/10 transition-colors flex items-center justify-center gap-2"
    >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
        Add Trip Line
    </button>
);

// --- EXECUTIVE TEMPLATE (Luxury Minimalist Letterhead) ---
const ExecutiveTemplate: React.FC<InvoiceTemplateProps> = ({ data, companyProfile, isEditing, onItemChange, onDeleteItem, onAddItem }) => {
  const { brandColor, currencySymbol: currency, companyName } = companyProfile;
  // Safe access for items array
  const items = data?.items || [];
  const isEmpty = items.length === 0;

  return (
    <div className="bg-white p-8 md:p-16 rounded-sm shadow-2xl text-slate-800 mx-auto w-full flex flex-col relative overflow-hidden min-h-[1000px] font-sans border border-slate-100">
      
      {/* Brand Watermark */}
      {companyProfile.logoBase64 ? (
         <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
             <img 
                src={companyProfile.logoBase64} 
                className="w-[80%] max-w-[600px] opacity-[0.03] grayscale transform -rotate-12" 
                alt="Watermark"
             />
         </div>
      ) : (
         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.02] pointer-events-none mix-blend-multiply"
           style={{ background: `radial-gradient(circle, ${brandColor} 0%, transparent 70%)` }}>
         </div>
      )}

      {/* --- HEADER SECTION --- */}
      <div className="relative z-10 mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            
            {/* Left: Identity */}
            <div className="flex flex-col items-start">
                {companyProfile.logoBase64 ? (
                    <img src={companyProfile.logoBase64} alt="Logo" className="h-20 md:h-24 w-auto object-contain mb-6" />
                ) : (
                    <div className="h-16 w-16 border-2 border-slate-900 flex items-center justify-center mb-6 text-slate-900 font-bold text-2xl brand-font">AE</div>
                )}
                <h1 className="text-3xl md:text-4xl font-bold brand-font text-slate-900 uppercase tracking-wide leading-none">
                    {companyName || "Amm Empress Car Hire"}
                </h1>
            </div>

            {/* Right: Contact */}
            <div className="text-left md:text-right space-y-2 mt-2">
                <p className="font-medium text-slate-800 text-sm md:text-base max-w-xs md:ml-auto leading-relaxed">
                    {companyProfile.companyAddress}
                </p>
                <div className="flex flex-col md:items-end gap-1 text-sm text-slate-500 font-light">
                    {companyProfile.email && (
                        <div className="flex items-center gap-2">
                            <span className="md:hidden"><MailIcon className="w-4 h-4" /></span>
                            <span>{companyProfile.email}</span>
                            <span className="hidden md:inline"><MailIcon className="w-4 h-4" /></span>
                        </div>
                    )}
                    {companyProfile.phone && (
                        <div className="flex items-center gap-2">
                             <span className="md:hidden"><PhoneIcon className="w-4 h-4" /></span>
                             <span>{companyProfile.phone}</span>
                             <span className="hidden md:inline"><PhoneIcon className="w-4 h-4" /></span>
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        {/* Delicate Divider */}
        <div className="w-full h-[2px] mt-8 opacity-80" style={{ backgroundColor: brandColor }}></div>
      </div>

      {/* --- INVOICE META --- */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-16 gap-12 relative z-10 avoid-break">
          
          {/* Bill To */}
          <div className="w-full md:w-1/2 space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1 flex items-center gap-2">
                  <span>Bill To Client</span>
                  <div className="h-px w-10 bg-slate-200"></div>
              </h3>
              {data.clientName ? (
                  <div className="pl-4 border-l-2 border-slate-100 transition-all hover:border-[#C5A059]">
                      <div className="text-2xl brand-font text-slate-900 font-bold">{data.clientName}</div>
                      {data.clientAddress && (
                        <div className="text-sm text-slate-500 mt-2 font-light leading-relaxed whitespace-pre-line flex items-start gap-2">
                            <MapPinIcon className="w-4 h-4 mt-0.5 opacity-50 flex-shrink-0" />
                            {data.clientAddress}
                        </div>
                      )}
                  </div>
              ) : (
                  <div className="text-xl text-slate-200 italic brand-font pl-4 border-l-2 border-slate-50">Client Name</div>
              )}
          </div>

          {/* Invoice Details */}
          <div className="w-full md:w-auto min-w-[200px] space-y-4">
               <div className="flex justify-between items-center md:justify-end gap-6 border-b border-slate-50 pb-2">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</span>
                   <StatusBadge status={data.status} />
               </div>
               <div className="flex justify-between items-center md:justify-end gap-6 border-b border-slate-50 pb-2">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Invoice No</span>
                   <span className="text-lg font-mono text-slate-900 font-medium">{data.invoiceNumber || '---'}</span>
               </div>
               <div className="flex justify-between items-center md:justify-end gap-6 border-b border-slate-50 pb-2">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</span>
                   <div className="flex items-center gap-2">
                       <CalendarIcon className="w-4 h-4 text-slate-300" />
                       <span className="text-sm text-slate-700 font-medium">{data.invoiceDate}</span>
                   </div>
               </div>
               {companyProfile.taxId && (
                   <div className="flex justify-between items-center md:justify-end gap-6 pt-1">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tax ID</span>
                       <span className="text-xs text-slate-500">{companyProfile.taxId}</span>
                   </div>
               )}
          </div>
      </div>

      {/* --- TABLE --- */}
      <div className="flex-grow mb-12 relative z-10">
        <table className="w-full border-collapse">
            <thead>
                <tr>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b-2 border-slate-100 w-32 bg-slate-50/50 rounded-l-lg">
                        <span className="flex items-center gap-2"><CalendarIcon className="w-3 h-3" /> Date</span>
                    </th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b-2 border-slate-100 bg-slate-50/50">
                        Trip Details
                    </th>
                    <th className="text-right py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b-2 border-slate-100 w-40 bg-slate-50/50 rounded-r-lg">
                        Amount
                    </th>
                    {isEditing && <th className="w-10"></th>}
                </tr>
            </thead>
            <tbody>
                {!isEmpty || isEditing ? (
                    items.map((item, index) => (
                        <tr key={index} className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/40 transition-colors avoid-break">
                            <td className="py-6 px-4 text-slate-500 font-mono text-xs align-top">
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        value={item.date} 
                                        onChange={(e) => onItemChange?.(index, 'date', e.target.value)}
                                        className="w-full bg-yellow-50/50 border-b border-yellow-200 focus:outline-none focus:border-yellow-500 px-1 text-xs"
                                    />
                                ) : item.date}
                            </td>
                            <td className="py-6 px-4 text-slate-800 align-top">
                                {isEditing ? (
                                    <div className="space-y-2">
                                        <textarea 
                                            value={item.description} 
                                            onChange={(e) => onItemChange?.(index, 'description', e.target.value)}
                                            className="w-full bg-yellow-50/50 border-b border-yellow-200 focus:outline-none focus:border-yellow-500 px-1 text-sm min-h-[20px]"
                                            rows={2}
                                        />
                                        <div className="flex gap-2">
                                            <input 
                                                placeholder="Time In"
                                                value={item.timeIn || ''} 
                                                onChange={(e) => onItemChange?.(index, 'timeIn', e.target.value)}
                                                className="w-20 bg-yellow-50/50 border-b border-yellow-200 focus:outline-none focus:border-yellow-500 px-1 text-xs"
                                            />
                                            <input 
                                                placeholder="Time Out"
                                                value={item.timeOut || ''} 
                                                onChange={(e) => onItemChange?.(index, 'timeOut', e.target.value)}
                                                className="w-20 bg-yellow-50/50 border-b border-yellow-200 focus:outline-none focus:border-yellow-500 px-1 text-xs"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="font-medium text-base leading-relaxed">{item.description}</p>
                                        {(item.timeIn || item.timeOut) && (
                                            <div className="flex flex-wrap gap-4 mt-3">
                                                {item.timeIn && (
                                                    <span className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium uppercase tracking-wide bg-slate-100 px-2 py-1 rounded">
                                                        <ClockIcon className="w-3 h-3 text-green-500" /> 
                                                        In: {item.timeIn}
                                                    </span>
                                                )}
                                                {item.timeOut && (
                                                    <span className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium uppercase tracking-wide bg-slate-100 px-2 py-1 rounded">
                                                        <ClockIcon className="w-3 h-3 text-red-500" /> 
                                                        Out: {item.timeOut}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </td>
                            <td className="py-6 px-4 text-right font-mono text-slate-900 text-base font-medium align-top">
                                {isEditing ? (
                                     <input 
                                        type="number" 
                                        value={item.amount} 
                                        onChange={(e) => onItemChange?.(index, 'amount', parseFloat(e.target.value))}
                                        className="w-full text-right bg-yellow-50/50 border-b border-yellow-200 focus:outline-none focus:border-yellow-500 px-1"
                                    />
                                ) : (
                                    `${currency}${(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                )}
                            </td>
                            {isEditing && (
                                <td className="py-6 px-2 align-top">
                                    <button 
                                        onClick={() => onDeleteItem?.(index)}
                                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                        title="Delete line"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))
                ) : <GhostRows />}
            </tbody>
        </table>
        {isEditing && onAddItem && <AddRowButton onClick={onAddItem} />}
      </div>

      {/* --- TOTALS & FOOTER --- */}
      <div className="relative z-10 avoid-break">
          {/* Totals Section */}
          <div className="flex justify-end mb-16">
              <div className="w-full md:w-1/3 bg-slate-50/50 p-6 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-sm text-slate-500 mb-4">
                      <span>Subtotal</span>
                      <span className="font-mono text-slate-700">{currency}{data.subtotal ? (data.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) : (data.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="w-full h-px bg-slate-200 mb-4"></div>
                  <div className="flex justify-between items-end">
                      <span className="text-lg brand-font text-slate-900 font-bold">Total Due</span>
                      <span className="text-3xl font-light font-mono leading-none" style={{ color: brandColor }}>
                        {currency}{(data.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                  </div>
              </div>
          </div>

          {/* Bottom Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end border-t border-slate-100 pt-10">
              
              {/* Bank & Terms */}
              <div className="space-y-8 text-xs text-slate-500">
                  {companyProfile.bankDetails && (
                      <div>
                          <p className="font-bold text-slate-900 uppercase text-[10px] mb-3 tracking-widest flex items-center gap-2">
                            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                            Payment Instructions
                          </p>
                          <div className="bg-slate-50 p-4 rounded-lg border-l-2 border-slate-200 font-mono leading-relaxed whitespace-pre-line text-slate-600">
                            {companyProfile.bankDetails}
                          </div>
                      </div>
                  )}
                  {companyProfile.termsAndConditions && (
                       <div>
                           <p className="font-bold text-slate-900 uppercase text-[10px] mb-2 tracking-widest">Terms</p>
                           <p className="opacity-80 leading-relaxed">{companyProfile.termsAndConditions}</p>
                       </div>
                  )}
              </div>
              
              {/* Signature & Closing */}
              <div className="flex flex-col items-start md:items-end text-right">
                   <p className="text-lg font-serif italic text-slate-400 mb-6">"{data.closingMessage}"</p>
                   
                   <div className="flex flex-col items-center w-48">
                        {companyProfile.signatureBase64 ? (
                            <img src={companyProfile.signatureBase64} alt="Signature" className="h-16 w-auto object-contain mb-2" />
                        ) : (
                            <div className="h-16 w-full"></div> // Spacer for physical signature
                        )}
                        <div className="w-full border-b border-slate-300 mb-2"></div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Authorized Signature</p>
                   </div>
              </div>
          </div>
      </div>
      
      {/* --- FOOTER TAGLINE --- */}
      <div className="mt-auto pt-12 text-center">
          <p className="text-[9px] text-slate-300 tracking-[0.4em] uppercase font-light">
            Generated by Keeper of Journeys • {companyName}
          </p>
      </div>

    </div>
  );
}

// --- MODERN TEMPLATE ---
const ModernTemplate: React.FC<InvoiceTemplateProps> = ({ data, companyProfile, isEditing, onItemChange, onDeleteItem, onAddItem }) => {
  const { brandColor, currencySymbol: currency, companyName } = companyProfile;
  const items = data?.items || [];
  const isEmpty = items.length === 0;

  return (
    <div className="bg-white rounded-lg shadow-2xl text-slate-800 mx-auto w-full flex flex-col relative overflow-hidden min-h-[600px] md:min-h-[800px] border border-slate-100">
      
      {/* Full Width Header */}
      <div className="p-6 md:p-12 text-white flex flex-col md:flex-row justify-between items-start gap-6" style={{ backgroundColor: brandColor }}>
        <div className="space-y-4 md:space-y-6 w-full md:max-w-[60%]">
             {/* Branding Lockup */}
             <div className="flex items-center gap-4 md:gap-6">
                 {companyProfile.logoBase64 && (
                    <div className="bg-white p-2 md:p-3 rounded-xl shadow-sm flex-shrink-0 overflow-hidden">
                        <img src={companyProfile.logoBase64} alt="Logo" className="h-10 md:h-12 w-auto max-w-[80px] md:max-w-[120px] object-contain" />
                    </div>
                 )}
                 <div>
                    <h1 className={`font-bold brand-font leading-tight ${companyProfile.logoBase64 ? 'text-xl md:text-2xl' : 'text-3xl md:text-4xl'}`}>
                        {companyName || "Your Company"}
                    </h1>
                 </div>
             </div>
             
             {/* Contact Info */}
             <div className="text-xs md:text-sm opacity-90 font-light space-y-1 pl-4 border-l-2 border-white/30">
                {companyProfile.companyAddress && <p>{companyProfile.companyAddress}</p>}
                <div className="flex flex-wrap gap-x-4">
                   {companyProfile.email && <p>{companyProfile.email}</p>}
                   {companyProfile.phone && <p>{companyProfile.phone}</p>}
                </div>
                {companyProfile.website && <p>{companyProfile.website}</p>}
             </div>
        </div>
        <div className="w-full md:w-auto text-left md:text-right">
            <h2 className="text-4xl md:text-5xl font-bold opacity-20 uppercase tracking-tight">Invoice</h2>
            <div className="mt-4 md:text-right space-y-1">
                 <div className="flex md:justify-end gap-4 text-sm opacity-90">
                     <StatusBadge status={data.status} />
                 </div>
                <div className="flex md:justify-end gap-4 text-sm opacity-90 mt-2">
                    <span className="uppercase tracking-wide font-semibold">No:</span>
                    <span className="font-mono">{data.invoiceNumber || '---'}</span>
                </div>
                 <div className="flex md:justify-end gap-4 text-sm opacity-90">
                    <span className="uppercase tracking-wide font-semibold">Date:</span>
                    <span className="font-mono">{data.invoiceDate || '---'}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 md:p-12 flex-grow flex flex-col">
        
        {/* Client Info Card */}
        <div className="bg-slate-50 rounded-lg p-4 md:p-6 mb-8 md:mb-10 border-l-4 avoid-break" style={{ borderColor: brandColor }}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Bill To</h3>
             {data.clientName ? (
              <>
                  <div className="text-lg md:text-xl font-bold text-slate-900">{data.clientName}</div>
                  {data.clientAddress && <div className="text-sm text-slate-500 mt-1 whitespace-pre-line">{data.clientAddress}</div>}
              </>
            ) : (
              <div className="text-lg md:text-xl text-slate-300 italic">Client Name</div>
            )}
        </div>

        {/* Table */}
        <div className="mb-10">
            <div className="grid grid-cols-12 gap-2 md:gap-4 pb-3 border-b-2 border-slate-100 text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">
                <div className="col-span-3 md:col-span-2">Date</div>
                <div className="col-span-6 md:col-span-8">Description</div>
                <div className="col-span-3 md:col-span-2 text-right">Amount</div>
            </div>
            <div className="divide-y divide-slate-50">
                {!isEmpty || isEditing ? (
                    items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 md:gap-4 py-4 items-start text-sm animate-fade-in avoid-break" style={{ animationDelay: `${index * 50}ms` }}>
                             <div className="col-span-3 md:col-span-2 font-mono text-slate-500 text-xs md:text-sm">
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        value={item.date} 
                                        onChange={(e) => onItemChange?.(index, 'date', e.target.value)}
                                        className="w-full bg-yellow-50/50 border-b border-yellow-200 focus:outline-none focus:border-yellow-500 px-1 text-xs"
                                    />
                                ) : item.date}
                             </div>
                             <div className="col-span-6 md:col-span-8 text-slate-800">
                                {isEditing ? (
                                    <div className="space-y-2">
                                        <textarea 
                                            value={item.description} 
                                            onChange={(e) => onItemChange?.(index, 'description', e.target.value)}
                                            className="w-full bg-yellow-50/50 border-b border-yellow-200 focus:outline-none focus:border-yellow-500 px-1 text-sm min-h-[20px]"
                                            rows={2}
                                        />
                                        <div className="flex gap-2">
                                            <input 
                                                placeholder="Time In"
                                                value={item.timeIn || ''} 
                                                onChange={(e) => onItemChange?.(index, 'timeIn', e.target.value)}
                                                className="w-20 bg-yellow-50/50 border-b border-yellow-200 focus:outline-none focus:border-yellow-500 px-1 text-xs"
                                            />
                                            <input 
                                                placeholder="Time Out"
                                                value={item.timeOut || ''} 
                                                onChange={(e) => onItemChange?.(index, 'timeOut', e.target.value)}
                                                className="w-20 bg-yellow-50/50 border-b border-yellow-200 focus:outline-none focus:border-yellow-500 px-1 text-xs"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="font-medium text-xs md:text-base">{item.description}</p>
                                        {(item.timeIn || item.timeOut) && (
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {item.timeIn && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">In: {item.timeIn}</span>}
                                                {item.timeOut && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">Out: {item.timeOut}</span>}
                                            </div>
                                        )}
                                    </>
                                )}
                             </div>
                             <div className="col-span-3 md:col-span-2 text-right font-mono font-semibold text-slate-900 text-xs md:text-base flex gap-2 justify-end items-start">
                                {isEditing ? (
                                    <>
                                        <input 
                                            type="number" 
                                            value={item.amount} 
                                            onChange={(e) => onItemChange?.(index, 'amount', parseFloat(e.target.value))}
                                            className="w-full text-right bg-yellow-50/50 border-b border-yellow-200 focus:outline-none focus:border-yellow-500 px-1"
                                        />
                                        <button 
                                            onClick={() => onDeleteItem?.(index)}
                                            className="text-red-400 hover:text-red-600"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    `${currency}${(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                  )}
                             </div>
                        </div>
                    ))
                ) : (
                    <div className="py-4 text-slate-300 italic text-center">Add trips to generate invoice lines...</div>
                )}
            </div>
            {isEditing && onAddItem && <AddRowButton onClick={onAddItem} />}
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-12 avoid-break">
            <div className="w-full md:w-1/3 bg-slate-50 p-4 md:p-6 rounded-xl space-y-3">
                <div className="flex justify-between text-sm text-slate-500">
                    <span>Subtotal</span>
                    <span>{currency}{data.subtotal ? data.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 }) : (data.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="h-px bg-slate-200"></div>
                <div className="flex justify-between items-center text-slate-900">
                    <span className="font-bold text-base md:text-lg">Total</span>
                    <span className="font-bold text-xl md:text-2xl" style={{ color: brandColor }}>{currency}{(data.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="mt-auto grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-slate-500 border-t border-slate-100 pt-6 avoid-break">
             <div>
                <h4 className="font-bold text-slate-700 mb-1">Payment Details</h4>
                <p className="whitespace-pre-line font-mono leading-relaxed">{companyProfile.bankDetails || 'Bank details not provided.'}</p>
             </div>
             <div className="text-left md:text-right flex flex-col items-start md:items-end">
                 {companyProfile.termsAndConditions && (
                     <div className="mb-4 w-full">
                        <h4 className="font-bold text-slate-700 mb-1">Terms</h4>
                        <p className="leading-relaxed opacity-80">{companyProfile.termsAndConditions}</p>
                     </div>
                 )}
                 
                 {companyProfile.signatureBase64 && (
                    <div className="mt-4 flex flex-col items-start md:items-end">
                         <img src={companyProfile.signatureBase64} alt="Signature" className="h-10 md:h-14 w-auto object-contain mb-1" />
                         <div className="border-t border-slate-300 w-32"></div>
                         <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Authorized Signature</span>
                    </div>
                 )}
                 
                 <p className="mt-4 italic opacity-60">{data.closingMessage}</p>
             </div>
        </div>

      </div>
    </div>
  );
}


// --- CLASSIC TEMPLATE ---
const ClassicTemplate: React.FC<InvoiceTemplateProps> = ({ data, companyProfile, isEditing, onItemChange, onDeleteItem, onAddItem }) => {
  const { brandColor, currencySymbol: currency, companyName } = companyProfile;
  const items = data?.items || [];
  const isEmpty = items.length === 0;

  return (
    <div className="bg-white p-6 md:p-12 text-slate-900 mx-auto w-full flex flex-col relative min-h-[600px] md:min-h-[800px] shadow-2xl border border-slate-100">
      
      <div className="absolute top-6 right-6">
         <StatusBadge status={data.status} />
      </div>

      {/* Double Border Container */}
      <div className="border-4 border-double border-slate-300 h-full flex-grow flex flex-col p-4 md:p-12">
        
        {/* Centered Header */}
        <div className="text-center border-b-2 border-slate-800 pb-8 mb-8">
             {/* Prominent Centered Logo */}
             {companyProfile.logoBase64 && (
                <div className="mb-6">
                    <img src={companyProfile.logoBase64} alt="Logo" className="h-20 md:h-28 w-auto max-w-[200px] md:max-w-[300px] mx-auto object-contain" />
                </div>
             )}
             <h1 className="text-2xl md:text-4xl font-serif font-bold tracking-wide uppercase mb-3 text-slate-900">
                {companyName || "Company Name"}
             </h1>
             
             {/* Centered Contact Info with Separators */}
             <div className="flex flex-col md:flex-row flex-wrap justify-center items-center gap-x-4 gap-y-1 text-xs md:text-sm font-serif italic text-slate-600">
                {companyProfile.companyAddress && <span>{companyProfile.companyAddress}</span>}
                <span className="hidden md:inline text-slate-400">&bull;</span>
                {companyProfile.email && <span>{companyProfile.email}</span>}
                <span className="hidden md:inline text-slate-400">&bull;</span>
                {companyProfile.phone && <span>{companyProfile.phone}</span>}
             </div>
        </div>

        {/* Invoice Details Grid */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 font-serif gap-6 avoid-break">
            <div className="border border-slate-300 p-4 w-full md:w-auto md:min-w-[250px]">
                <h3 className="text-xs font-bold uppercase underline mb-2">Bill To:</h3>
                {data.clientName ? (
                    <>
                         <div className="font-bold text-lg">{data.clientName}</div>
                         <div className="text-sm whitespace-pre-line">{data.clientAddress}</div>
                    </>
                ) : <span className="text-slate-300 italic">Client Name</span>}
            </div>
            <div className="text-left md:text-right w-full md:w-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2 uppercase tracking-widest">Invoice</h2>
                <table className="md:ml-auto text-sm w-full md:w-auto">
                    <tbody>
                        <tr>
                            <td className="pr-4 font-bold text-slate-600">Invoice #:</td>
                            <td className="font-mono font-bold text-right">{data.invoiceNumber || '---'}</td>
                        </tr>
                        <tr>
                            <td className="pr-4 font-bold text-slate-600">Date:</td>
                            <td className="font-mono text-right">{data.invoiceDate || '---'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        {/* Classic Table */}
        <div className="overflow-x-auto">
          <table className="w-full mb-8 border-collapse border border-slate-800 min-w-[500px]">
              <thead className="bg-slate-100">
                  <tr>
                      <th className="border border-slate-800 py-2 px-4 text-left font-serif font-bold w-32 text-xs md:text-base">DATE</th>
                      <th className="border border-slate-800 py-2 px-4 text-left font-serif font-bold text-xs md:text-base">DESCRIPTION</th>
                      <th className="border border-slate-800 py-2 px-4 text-right font-serif font-bold w-32 text-xs md:text-base">AMOUNT</th>
                      {isEditing && <th className="border border-slate-800 w-10"></th>}
                  </tr>
              </thead>
              <tbody>
                  {!isEmpty || isEditing ? (
                      items.map((item, index) => (
                          <tr key={index} className="animate-fade-in avoid-break" style={{ animationDelay: `${index * 50}ms` }}>
                              <td className="border border-slate-800 py-3 px-4 font-mono text-xs md:text-sm align-top">
                                  {isEditing ? (
                                    <input 
                                        type="text" 
                                        value={item.date} 
                                        onChange={(e) => onItemChange?.(index, 'date', e.target.value)}
                                        className="w-full bg-yellow-50/50 border-b border-yellow-200 focus:outline-none focus:border-yellow-500 px-1 text-xs"
                                    />
                                  ) : item.date}
                              </td>
                              <td className="border border-slate-800 py-3 px-4 align-top">
                                  {isEditing ? (
                                    <div className="space-y-2">
                                        <textarea 
                                            value={item.description} 
                                            onChange={(e) => onItemChange?.(index, 'description', e.target.value)}
                                            className="w-full bg-yellow-50/50 border-b border-yellow-200 focus:outline-none focus:border-yellow-500 px-1 text-sm min-h-[20px]"
                                            rows={2}
                                        />
                                        <div className="flex gap-2">
                                            <input 
                                                placeholder="In"
                                                value={item.timeIn || ''} 
                                                onChange={(e) => onItemChange?.(index, 'timeIn', e.target.value)}
                                                className="w-16 bg-yellow-50/50 border-b border-yellow-200 focus:outline-none focus:border-yellow-500 px-1 text-xs"
                                            />
                                            <input 
                                                placeholder="Out"
                                                value={item.timeOut || ''} 
                                                onChange={(e) => onItemChange?.(index, 'timeOut', e.target.value)}
                                                className="w-16 bg-yellow-50/50 border-b border-yellow-200 focus:outline-none focus:border-yellow-500 px-1 text-xs"
                                            />
                                        </div>
                                    </div>
                                  ) : (
                                    <>
                                        <div className="font-serif text-sm md:text-base">{item.description}</div>
                                        {(item.timeIn || item.timeOut) && (
                                            <div className="text-xs italic mt-1 text-slate-600">
                                                {item.timeIn && `In: ${item.timeIn} `} 
                                                {item.timeOut && `Out: ${item.timeOut}`}
                                            </div>
                                        )}
                                    </>
                                  )}
                              </td>
                              <td className="border border-slate-800 py-3 px-4 text-right font-mono text-sm md:text-base align-top">
                                  {isEditing ? (
                                    <input 
                                        type="number" 
                                        value={item.amount} 
                                        onChange={(e) => onItemChange?.(index, 'amount', parseFloat(e.target.value))}
                                        className="w-full text-right bg-yellow-50/50 border-b border-yellow-200 focus:outline-none focus:border-yellow-500 px-1"
                                    />
                                  ) : (
                                    `${currency}${(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                  )}
                              </td>
                              {isEditing && (
                                <td className="border border-slate-800 py-3 px-2 text-center align-top">
                                    <button 
                                        onClick={() => onDeleteItem?.(index)}
                                        className="text-red-400 hover:text-red-600"
                                    >
                                        <TrashIcon className="w-4 h-4 mx-auto" />
                                    </button>
                                </td>
                              )}
                          </tr>
                      ))
                  ) : (
                      <tr><td colSpan={isEditing ? 4 : 3} className="border border-slate-800 py-8 text-center italic text-slate-400">No items yet...</td></tr>
                  )}
              </tbody>
          </table>
          {isEditing && onAddItem && <AddRowButton onClick={onAddItem} />}
        </div>

        {/* Total & Notes */}
        <div className="flex flex-col md:flex-row justify-between gap-8 avoid-break">
            <div className="w-full md:w-1/2 text-sm font-serif">
                 {companyProfile.bankDetails && (
                     <div className="mb-4">
                        <h4 className="font-bold underline mb-1">Payment Instructions:</h4>
                        <p className="whitespace-pre-line">{companyProfile.bankDetails}</p>
                     </div>
                 )}
                 <p className="italic">"{data.closingMessage}"</p>
            </div>
            <div className="w-full md:w-1/3">
                 <div className="flex justify-between items-center border-b-2 border-slate-800 pb-1 mb-2">
                     <span className="font-serif font-bold">TOTAL</span>
                     <span className="font-mono text-xl font-bold">{currency}{(data.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                 </div>
            </div>
        </div>

        {/* Signature */}
        <div className="mt-auto pt-12 md:pt-16 flex justify-end avoid-break">
            <div className="text-center flex flex-col items-center w-40 md:w-48">
                {companyProfile.signatureBase64 && (
                     <img src={companyProfile.signatureBase64} alt="Signature" className="h-12 md:h-16 w-auto object-contain mb-1" />
                )}
                <div className="border-b border-slate-800 mb-2 w-full"></div>
                <span className="text-[10px] md:text-xs font-serif uppercase">Authorized Signature</span>
            </div>
        </div>

      </div>
    </div>
  );
}

// --- MAIN EXPORT ---
export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = (props) => {
  const { selectedTemplate } = props.companyProfile;

  // Safety Check for Data - if data is null/undefined, provide fallback
  const safeData = props.data || {
    items: [],
    totalAmount: 0,
    subtotal: 0,
    clientName: '',
    invoiceNumber: '',
    invoiceDate: '',
    closingMessage: '',
    status: 'PENDING'
  };

  const propsWithSafeData = { ...props, data: safeData };

  switch (selectedTemplate) {
    case 'modern':
        return <ModernTemplate {...propsWithSafeData} />;
    case 'classic':
        return <ClassicTemplate {...propsWithSafeData} />;
    case 'executive':
    default:
        return <ExecutiveTemplate {...propsWithSafeData} />;
  }
};