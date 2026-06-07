'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';

export function DateTimePickerModal({
  initialDate,
  initialTime,
  onClose,
  onConfirm
}: {
  initialDate: string;
  initialTime: string;
  onClose: () => void;
  onConfirm: (date: string, time: string) => void;
}) {
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(initialTime || '19:00');

  const initialHour = parseInt((initialTime || '19:00').split(':')[0], 10) || 19;
  const initialMin = (initialTime || '19:00').split(':')[1] || '00';
  
  const [h12, setH12] = useState(String(initialHour % 12 || 12));
  const [m, setM] = useState(initialMin);
  const [period, setPeriod] = useState(initialHour >= 12 ? 'PM' : 'AM');

  useEffect(() => {
    let h = parseInt(h12, 10);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    setTime(`${String(h).padStart(2, '0')}:${m}`);
  }, [h12, m, period]);

  const [viewDate, setViewDate] = useState(new Date(date || new Date()));
  
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  
  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const handleConfirm = () => {
    onConfirm(date, time);
    onClose();
  };

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-zinc-900 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-slide-up sm:animate-scale-up">
        <button onClick={onClose} className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-white bg-zinc-800 rounded-full transition-colors">
          <X className="h-4 w-4" />
        </button>
        
        <h2 className="text-lg font-serif font-bold text-white mb-6">Select Date & Time</h2>
        
        {/* Calendar */}
        <div className="bg-zinc-950/50 border border-white/5 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={handlePrevMonth} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-bold text-sm text-white">{months[month]} {year}</span>
            <button onClick={handleNextMonth} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {days.map(d => <div key={d} className="text-center text-[10px] font-bold text-zinc-500">{d}</div>)}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = date === dateStr;
              const isToday = new Date().toISOString().split('T')[0] === dateStr;
              
              return (
                <button
                  key={dayNum}
                  onClick={() => setDate(dateStr)}
                  className={`
                    h-8 flex items-center justify-center rounded-lg text-sm transition-colors
                    ${isSelected ? 'bg-red-600 text-white font-bold' : isToday ? 'bg-zinc-800 text-red-400 font-bold border border-red-500/20' : 'text-zinc-300 hover:bg-zinc-800'}
                  `}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="flex items-center justify-between bg-zinc-950/50 border border-white/5 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-zinc-400 font-medium">
            <Clock className="h-4 w-4" /> Time
          </div>
          <div className="flex items-center gap-1.5">
            <select
              value={h12}
              onChange={e => setH12(e.target.value)}
              className="bg-zinc-900 border border-white/10 rounded-lg px-2 py-1.5 text-white font-mono text-sm focus:border-red-500/50 focus:outline-none appearance-none text-center min-w-[3rem] cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            <span className="text-zinc-500 font-bold">:</span>
            <select
              value={m}
              onChange={e => setM(e.target.value)}
              className="bg-zinc-900 border border-white/10 rounded-lg px-2 py-1.5 text-white font-mono text-sm focus:border-red-500/50 focus:outline-none appearance-none text-center min-w-[3rem] cursor-pointer"
            >
              {['00', '15', '30', '45'].map(min => (
                <option key={min} value={min}>{min}</option>
              ))}
            </select>
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="bg-zinc-900 border border-white/10 rounded-lg px-2 py-1.5 text-white font-mono text-sm font-bold focus:border-red-500/50 focus:outline-none appearance-none text-center ml-1 cursor-pointer"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>
        
        <button 
          onClick={handleConfirm}
          className="w-full bg-white hover:bg-zinc-100 text-black font-bold py-3.5 rounded-xl transition-all active:scale-[0.98]"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
