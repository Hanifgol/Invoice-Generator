import React, { useMemo } from 'react';
import { ArchivedInvoice } from '../types';

interface DashboardProps {
  invoices: ArchivedInvoice[];
  currencySymbol: string;
  onClose: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ invoices, currencySymbol, onClose }) => {
  
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    let totalRevenue = 0;
    let monthRevenue = 0;
    let weekRevenue = 0;
    const clientCounts: Record<string, { count: number; revenue: number }> = {};

    invoices.forEach(inv => {
      const amount = inv.data.totalAmount || 0;
      const date = new Date(inv.data.invoiceDate || inv.createdAt);
      
      totalRevenue += amount;

      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        monthRevenue += amount;
      }

      if (date >= startOfWeek) {
        weekRevenue += amount;
      }

      const clientName = inv.data.clientName?.trim() || 'Unknown Client';
      if (!clientCounts[clientName]) {
        clientCounts[clientName] = { count: 0, revenue: 0 };
      }
      clientCounts[clientName].count += 1;
      clientCounts[clientName].revenue += amount;
    });

    const topClients = Object.entries(clientCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalInvoices: invoices.length,
      totalRevenue,
      monthRevenue,
      weekRevenue,
      topClients
    };
  }, [invoices]);

  return (
    <div id="dashboard-container" className="w-full mx-auto p-4 md:p-8 max-w-6xl printable-area">
      <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#0F172A] brand-font mb-2">Business Overview</h2>
          <p className="text-sm text-slate-500">Financial performance and analytics.</p>
      </div>

      <div className="space-y-8">
        
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Total Revenue</p>
              <h3 className="text-3xl md:text-4xl font-bold text-[#0F172A] brand-font">{currencySymbol}{stats.totalRevenue.toLocaleString()}</h3>
              <p className="text-xs text-slate-500 mt-2">Lifetime earnings</p>
           </div>

           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
               <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">This Month</p>
               <h3 className="text-3xl md:text-4xl font-bold text-[#C5A059] brand-font">{currencySymbol}{stats.monthRevenue.toLocaleString()}</h3>
               <p className="text-xs text-slate-500 mt-2">Revenue in {new Date().toLocaleString('default', { month: 'long' })}</p>
           </div>

            <div className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden group text-white">
               <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Total Invoices</p>
               <h3 className="text-3xl md:text-4xl font-bold brand-font">{stats.totalInvoices}</h3>
               <p className="text-xs text-slate-400 mt-2">Generated & Archived</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-[#0F172A] brand-font mb-6 border-b border-slate-50 pb-2">Top Clients</h3>
                {stats.topClients.length > 0 ? (
                    <div className="space-y-4">
                        {stats.topClients.map((client, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-xs font-bold text-[#C5A059] border border-slate-100">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">{client.name}</p>
                                        <p className="text-[10px] text-slate-400">{client.count} invoice{client.count !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-mono font-medium text-[#0F172A]">{currencySymbol}{client.revenue.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-400 italic text-sm">No client data available yet.</div>
                )}
            </div>

             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                 <h3 className="text-lg font-bold text-[#0F172A] brand-font mb-2">Weekly Snapshot</h3>
                 <p className="text-xs text-slate-400 mb-6">Revenue generated this week (Sun - Sat)</p>
                 
                 <div className="flex items-baseline gap-2">
                     <span className="text-4xl font-bold text-[#0F172A]">{currencySymbol}{stats.weekRevenue.toLocaleString()}</span>
                 </div>
             </div>
        </div>
      </div>
    </div>
  );
};