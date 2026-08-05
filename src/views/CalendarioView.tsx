import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Processo } from '../lib/types';
import { Card, Badge } from '../components/ui';
import { getEtapaLabel, STATUS_PROCESSO } from '../lib/constants';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function CalendarioView({
  processos,
  onOpenProcesso,
}: {
  processos: Processo[];
  onOpenProcesso: (id: string) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1)); // August 2026

  const processosByDate = useMemo(() => {
    const map: Record<string, Processo[]> = {};
    processos.forEach((p) => {
      if (p.data_prevista) {
        const key = p.data_prevista;
        if (!map[key]) map[key] = [];
        map[key].push(p);
      }
    });
    return map;
  }, [processos]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const isToday = (day: number) =>
    today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)); }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)); }

  return (
    <div className="mx-auto max-w-7xl px-8 py-8 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Calendário</h1>
          <p className="mt-1 text-sm text-tertiary">Prazos previstos dos processos</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-subtle text-secondary hover:bg-hover-state">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-primary w-36 text-center">{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-subtle text-secondary hover:bg-hover-state">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 border-b border-subtle">
          {DAYS.map((d) => (
            <div key={d} className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-tertiary">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) return <div key={idx} className="min-h-[100px] border-b border-r border-subtle bg-base/30" />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayProcessos = processosByDate[dateStr] || [];
            const overdue = dayProcessos.some((p) => p.status !== 'concluido' && new Date(dateStr) < today);
            return (
              <div key={idx} className={`min-h-[100px] border-b border-r border-subtle p-1.5 ${isToday(day) ? 'bg-blue-500/5' : ''}`}>
                <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs ${isToday(day) ? 'bg-blue-500 text-white font-semibold' : 'text-secondary'}`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {dayProcessos.slice(0, 3).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onOpenProcesso(p.id)}
                      className="block w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] transition-colors hover:bg-hover-state"
                      style={{
                        backgroundColor: (p.frente?.cor || '#3b82f6') + '20',
                        color: p.frente?.cor || '#3b82f6',
                      }}
                    >
                      {p.nome}
                    </button>
                  ))}
                  {dayProcessos.length > 3 && (
                    <p className="px-1.5 text-[10px] text-tertiary">+{dayProcessos.length - 3} mais</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
