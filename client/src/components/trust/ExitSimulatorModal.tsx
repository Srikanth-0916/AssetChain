import React, { useState } from 'react';
import { X, Calculator, TrendingUp, DollarSign, Percent, ShieldCheck, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface ExitSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExitSimulatorModal({ isOpen, onClose }: ExitSimulatorModalProps) {
  const [investment, setInvestment] = useState<number>(50000);
  const [holdingYears, setHoldingYears] = useState<number>(3);
  const [expectedGrowth, setExpectedGrowth] = useState<number>(8.5);
  const [rentalYield, setRentalYield] = useState<number>(8.2);
  const [taxRate, setTaxRate] = useState<number>(10);

  if (!isOpen) return null;

  // Calculation
  const totalRentalIncome = investment * (rentalYield / 100) * holdingYears;
  const capitalAppreciation = investment * Math.pow(1 + expectedGrowth / 100, holdingYears) - investment;
  const grossReturn = investment + totalRentalIncome + capitalAppreciation;
  const estimatedTax = (totalRentalIncome + capitalAppreciation) * (taxRate / 100);
  const netReturn = grossReturn - estimatedTax;
  const netProfit = netReturn - investment;
  const roiPct = ((netProfit / investment) * 100).toFixed(2);
  const irrPct = (Math.pow(netReturn / investment, 1 / holdingYears) - 1) * 100;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl space-y-6 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <span className="pill-badge pill-success text-[10px]">Financial Simulator</span>
              <span className="text-xs text-slate-400">Institutional Yield & IRR Model</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">Exit Return & IRR Simulator</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs & Outputs Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Investment Capital</span>
                <span className="text-indigo-400">${investment.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={5000}
                max={500000}
                step={5000}
                value={investment}
                onChange={e => setInvestment(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Holding Period</span>
                <span className="text-indigo-400">{holdingYears} Years</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={holdingYears}
                onChange={e => setHoldingYears(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Expected Property Growth (p.a.)</span>
                <span className="text-indigo-400">{expectedGrowth}%</span>
              </div>
              <input
                type="range"
                min={2}
                max={20}
                step={0.5}
                value={expectedGrowth}
                onChange={e => setExpectedGrowth(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Annual Rental Yield</span>
                <span className="text-indigo-400">{rentalYield}%</span>
              </div>
              <input
                type="range"
                min={4}
                max={15}
                step={0.1}
                value={rentalYield}
                onChange={e => setRentalYield(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>

          {/* Results Card */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-indigo-500/20 space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Simulated Exit Return</h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Total Net Return</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">${Math.round(netReturn).toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Simulated Net Profit</div>
                <div className="text-lg font-bold text-white mt-0.5">+${Math.round(netProfit).toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Projected IRR</div>
                <div className="text-lg font-bold text-indigo-300 mt-0.5">{irrPct.toFixed(2)}% p.a.</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Total ROI %</div>
                <div className="text-lg font-bold text-amber-400 mt-0.5">+{roiPct}%</div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 space-y-1 border-t border-white/[0.06] pt-3">
              <div className="flex justify-between">
                <span>Rental Dividends Total:</span>
                <span className="text-slate-300">${Math.round(totalRentalIncome).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Capital Growth Total:</span>
                <span className="text-slate-300">${Math.round(capitalAppreciation).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax Deducted ({taxRate}%):</span>
                <span className="text-red-400">-${Math.round(estimatedTax).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-primary text-xs py-2 px-6">
            Apply Simulation to Portfolio
          </button>
        </div>
      </div>
    </div>
  );
}
