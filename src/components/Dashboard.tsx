import React, { useState, useRef } from 'react';
import {
  BarChart3, TrendingDown, Leaf, PlusCircle, Download,
  Upload, Activity, Globe, Cpu, CheckCircle2, ShieldCheck, UserCheck
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, LineChart, Line, Legend
} from 'recharts';
import type { EmissionRecord, EmissionScope, UserRole } from '../types/esg';
import { EMISSION_FACTORS, calculateCO2eTonnes } from '../utils/carbonCalculator';
import { exportRecordsToCSV } from '../utils/csvHelper';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ESGReportPDF } from './ESGReportPDF';
import { fetchAIEmissionPrediction } from '../services/api';

const INITIAL_RECORDS: EmissionRecord[] = [
  { id: '1', date: '2026-11-01', scope: 'Scope 1', category: 'Diesel Fuel (Fleet/Generators)', activityAmount: 15000, unit: 'Liters', co2eTonnes: 40.2, status: 'Verified' },
  { id: '2', date: '2026-11-05', scope: 'Scope 2', category: 'Grid Electricity', activityAmount: 85000, unit: 'kWh', co2eTonnes: 38.25, status: 'Verified' },
  { id: '3', date: '2026-11-10', scope: 'Scope 3', category: 'Business Air Travel', activityAmount: 45000, unit: 'km', co2eTonnes: 6.75, status: 'Pending Audit' },
];

const FORECAST_DATA = [
  { month: 'Jun', actual: 95, predicted: 92, target: 90 },
  { month: 'Jul', actual: 88, predicted: 89, target: 85 },
  { month: 'Aug', actual: 92, predicted: 90, target: 80 },
  { month: 'Sep', actual: 85, predicted: 86, target: 75 },
  { month: 'Oct', actual: 82, predicted: 83, target: 70 },
  { month: 'Nov', actual: 85, predicted: 84, target: 65 },
  { month: 'Dec', predicted: 78, target: 60 },
  { month: 'Jan', predicted: 72, target: 55 },
];

export const Dashboard: React.FC = () => {
  const [records, setRecords] = useState<EmissionRecord[]>(INITIAL_RECORDS);
  const [currentRole, setCurrentRole] = useState<UserRole>('Admin');
  const [scopeFilter, setScopeFilter] = useState<'All' | EmissionScope>('All');
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(Object.keys(EMISSION_FACTORS)[0]);
  const [amount, setAmount] = useState<number>(1000);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddEmission = async (e: React.FormEvent) => {
    e.preventDefault();
    const factorObj = EMISSION_FACTORS[selectedCategory];
    
    // Call Python FastAPI Random Forest Model Backend
    let tonnes = calculateCO2eTonnes(selectedCategory, amount);
    try {
      const aiResult = await fetchAIEmissionPrediction({
        activityAmount: amount,
        categoryIndex: Object.keys(EMISSION_FACTORS).indexOf(selectedCategory) + 1
      });
      tonnes = aiResult.predicted_co2e_tonnes;
    } catch (err) {
      console.log('Using local calculation fallback');
    }

    const newRec: EmissionRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      scope: factorObj.scope,
      category: selectedCategory,
      activityAmount: amount,
      unit: factorObj.unit,
      co2eTonnes: tonnes,
      status: 'Pending Audit',
    };

    setRecords([newRec, ...records]);
    setShowModal(false);
    setAmount(1000);
  };

  const handleVerifyRecord = (id: string) => {
    setRecords(records.map((rec) => (rec.id === id ? { ...rec, status: 'Verified' } : rec)));
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').slice(1);
      const imported: EmissionRecord[] = [];

      lines.forEach((line, idx) => {
        const cols = line.split(',');
        if (cols.length >= 2) {
          const cat = cols[0].trim().replace(/"/g, '');
          const amt = Number(cols[1].trim());
          if (EMISSION_FACTORS[cat] && amt > 0) {
            imported.push({
              id: `${Date.now()}-${idx}`,
              date: new Date().toISOString().split('T')[0],
              scope: EMISSION_FACTORS[cat].scope,
              category: cat,
              activityAmount: amt,
              unit: EMISSION_FACTORS[cat].unit,
              co2eTonnes: calculateCO2eTonnes(cat, amt),
              status: 'Pending Audit',
            });
          }
        }
      });

      if (imported.length > 0) {
        setRecords([...imported, ...records]);
        alert(`Successfully imported ${imported.length} emission records!`);
      } else {
        alert('Invalid CSV format. Use columns: Category, ActivityAmount');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredRecords = scopeFilter === 'All' 
    ? records 
    : records.filter((r) => r.scope === scopeFilter);

  const totalEmissions = records.reduce((acc, curr) => acc + curr.co2eTonnes, 0).toFixed(2);
  const scope1Total = records.filter(r => r.scope === 'Scope 1').reduce((a, b) => a + b.co2eTonnes, 0).toFixed(2);
  const scope2Total = records.filter(r => r.scope === 'Scope 2').reduce((a, b) => a + b.co2eTonnes, 0).toFixed(2);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur sticky top-0 z-30 px-6 py-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
            <Leaf className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              GreenOps <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">Enterprise ESG</span>
            </h1>
            <p className="text-xs text-slate-400">AI-Powered Carbon Accounting & Scope 1-3 Forecasting</p>
          </div>
        </div>

        {/* Role Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <UserCheck className="w-4 h-4 text-emerald-400 mr-2" />
            <span className="text-slate-400 mr-2">Role:</span>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as UserRole)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="Admin" className="bg-slate-900">Admin (ESG Manager)</option>
              <option value="Auditor" className="bg-slate-900">External Auditor</option>
              <option value="Viewer" className="bg-slate-900">Executive Viewer</option>
            </select>
          </div>

          {/* Export CSV */}
          <button
            onClick={() => exportRecordsToCSV(filteredRecords)}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-medium transition border border-slate-700"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          {/* Download PDF Report */}
          <PDFDownloadLink
            document={<ESGReportPDF records={filteredRecords} totalEmissions={totalEmissions} />}
            fileName={`GreenOps_ESG_Audit_Report_${new Date().toISOString().split('T')[0]}.pdf`}
            className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-medium transition shadow"
          >
            {({ loading }) => (
              <>
                <Download className="w-4 h-4" />
                <span>{loading ? 'Preparing PDF...' : 'Download PDF'}</span>
              </>
            )}
          </PDFDownloadLink>

          {currentRole === 'Admin' && (
            <>
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleCSVUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-medium transition border border-slate-700"
              >
                <Upload className="w-4 h-4" />
                <span>Bulk CSV</span>
              </button>

              <button
                onClick={() => setShowModal(true)}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-medium transition shadow-lg shadow-emerald-900/20"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Log Emission</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Footprint</span>
              <Globe className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{totalEmissions} <span className="text-sm font-normal text-slate-400">tCO2e</span></div>
            <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> -4.2% vs last month
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Scope 1 (Direct)</span>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{scope1Total} <span className="text-sm font-normal text-slate-400">tCO2e</span></div>
            <div className="text-xs text-slate-400 mt-2">Fleet & Generators</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Scope 2 (Energy)</span>
              <BarChart3 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{scope2Total} <span className="text-sm font-normal text-slate-400">tCO2e</span></div>
            <div className="text-xs text-slate-400 mt-2">Grid Electricity</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Compliance Status</span>
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {records.filter(r => r.status === 'Verified').length}/{records.length} <span className="text-sm font-normal text-slate-400">Verified</span>
            </div>
            <div className="text-xs text-amber-400 mt-2">GHG Protocol Aligned</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" /> ML Emission Forecast & Targets
              </h2>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={FORECAST_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }} />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} name="Actual Emissions" />
                  <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" name="AI Predicted" />
                  <Line type="monotone" dataKey="target" stroke="#ef4444" strokeWidth={1.5} name="Target Threshold" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" /> Emissions by Category (tCO2e)
              </h2>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredRecords}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} tick={{ fill: '#94a3b8' }} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }} />
                  <Bar dataKey="co2eTonnes" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-sm font-semibold text-white">ESG Activity & Audit Ledger</h2>
              <p className="text-xs text-slate-400">Filter by GHG Scope or verify pending audit records</p>
            </div>

            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(['All', 'Scope 1', 'Scope 2', 'Scope 3'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setScopeFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    scopeFilter === tab
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Scope</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Activity Amount</th>
                  <th className="py-3 px-4">CO2e (Tonnes)</th>
                  <th className="py-3 px-4">Status</th>
                  {currentRole === 'Auditor' && <th className="py-3 px-4">Audit Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono text-xs">{rec.date}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400 font-mono text-xs">
                        {rec.scope}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-white">{rec.category}</td>
                    <td className="py-3 px-4 font-mono">{rec.activityAmount.toLocaleString()} {rec.unit}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{rec.co2eTonnes} t</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        rec.status === 'Verified'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    {currentRole === 'Auditor' && (
                      <td className="py-3 px-4">
                        {rec.status === 'Pending Audit' ? (
                          <button
                            onClick={() => handleVerifyRecord(rec.id)}
                            className="flex items-center gap-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 px-2.5 py-1 rounded-lg text-xs transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">Signed Off</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Log New Emission Source</h3>
            <form onSubmit={handleAddEmission} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Emission Category</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {Object.keys(EMISSION_FACTORS).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat} ({EMISSION_FACTORS[cat].scope})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Activity Amount ({EMISSION_FACTORS[selectedCategory]?.unit})
                </label>
                <input 
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-400">
                Estimated CO2e: <span className="font-bold text-emerald-400 font-mono text-sm">
                  {calculateCO2eTonnes(selectedCategory, amount)} Tonnes
                </span>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-900/20"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};