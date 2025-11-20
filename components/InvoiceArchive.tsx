import React, { useState, useMemo } from 'react';
import { ArchivedInvoice, CompanyProfile, InvoiceStatus, InvoiceData } from '../types';
import { generateDocx } from '../services/docxGenerator';
import { generateCsv } from '../services/csvGenerator';

interface InvoiceArchiveProps {
  invoices: ArchivedInvoice[];
  companyProfile: CompanyProfile; 
  onLoad: (invoice: ArchivedInvoice) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: InvoiceStatus) => void;
  currencySymbol: string;
  onClose: () => void;
  onOpenReceipt: (data: InvoiceData) => void;
  onDownloadPdf?: (invoice: ArchivedInvoice) => void;
}

export const InvoiceArchive: React.FC<InvoiceArchiveProps> = ({ invoices, companyProfile, onLoad, onDelete, onStatusChange, currencySymbol, onClose, onOpenReceipt, onDownloadPdf }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const searchLower = searchTerm.toLowerCase();
      return (
        inv.data.clientName.toLowerCase().includes(searchLower) ||
        (inv.data.invoiceNumber || '').toLowerCase().includes(searchLower) ||
        inv.data.invoiceDate.includes(searchLower)
      );
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [invoices, searchTerm]);

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-700 border-green-200';
      case 'OVERDUE': return 'bg-red-100 text-red-700 border-red-200';
      case 'PENDING': 
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const toggleStatus = (e: React.MouseEvent, id: string, currentStatus: InvoiceStatus) => {
    e.stopPropagation();
    const statuses: InvoiceStatus[] = ['PENDING', 'PAID', 'OVERDUE'];
    const nextIndex = (statuses.indexOf(currentStatus) + 1) % statuses.length;
    onStatusChange(id, statuses[nextIndex]);
  };

  const handleDocxDownload = (e: React.MouseEvent, invoice: ArchivedInvoice) => {
      e.stopPropagation();
      generateDocx(invoice.data, companyProfile);
  };

  const handleCsvDownload = (e: React.MouseEvent, invoice: ArchivedInvoice) => {
      e.stopPropagation();
      generateCsv(invoice.data);
  };

  return (
    <div className="w-full mx-auto p-4 md:p-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
         <div>
             <h2 className="text-3xl font-bold text-[#0F172A] brand-font mb-2">Invoice Archive</h2>
             <p className="text-sm text-slate-500">Your history of {invoices.length} generated invoices.</p>
         </div>
         <div className="w-full md:w-auto relative">
             <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full md:w-64 bg-white border border-slate-200 rounded-full text-sm focus:border-[#C5A059] focus:ring-0 outline-none shadow-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
         </div>
      </div>

      <div className="space-y-4">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-400 font-medium">No invoices found</p>
          </div>
        ) : (
          filteredInvoices.map((invoice, index) => (
            <div 
              key={invoice.id} 
              className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-[#C5A059] transition-all animate-fade-in cursor-pointer flex flex-col lg:flex-row items-center gap-6"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => onLoad(invoice)}
            >
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Client</p>
                        <h3 className="text-base font-bold text-[#0F172A] truncate">{invoice.data.clientName || 'Unknown'}</h3>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Invoice #</p>
                        <p className="text-sm font-mono text-slate-600">{invoice.data.invoiceNumber || '---'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Date</p>
                        <p className="text-sm text-slate-600">{invoice.data.invoiceDate}</p>
                    </div>
                     <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Total</p>
                        <p className="text-sm font-bold text-[#C5A059]">{currencySymbol}{(invoice.data.totalAmount || 0).toLocaleString()}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0">
                    <button
                      onClick={(e) => toggleStatus(e, invoice.id, invoice.data.status || 'PENDING')}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-full border uppercase tracking-wide transition-all ${getStatusColor(invoice.data.status || 'PENDING')}`}
                    >
                      {invoice.data.status || 'PENDING'}
                    </button>

                    <div className="flex items-center gap-2">
                        {invoice.data.status === 'PAID' && (
                            <button onClick={(e) => { e.stopPropagation(); onOpenReceipt(invoice.data); }} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Receipt">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </button>
                        )}
                        {onDownloadPdf && (
                            <button onClick={(e) => { e.stopPropagation(); onDownloadPdf(invoice); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="PDF">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </button>
                        )}
                         <button onClick={(e) => handleDocxDownload(e, invoice)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="DOCX">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(invoice.id); }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Delete">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};