import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Phone, Mail, UserPlus, AlertCircle } from 'lucide-react';
import { useContacts } from '../context/ContactsContext';
import { formatPhoneDisplay } from '../utils/phoneUtils';
import { Contact } from '../types';

interface CalendarViewProps {
  onSelectContact: (contact: Contact) => void;
  onOpenAddContact: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onSelectContact,
  onOpenAddContact,
}) => {
  const { contacts } = useContacts();

  // Reference date: current demo time September 2026
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8); // 0-indexed: 8 = September
  const [selectedDayString, setSelectedDayString] = useState<string>('2026-09-18');

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  // Map contacts by YYYY-MM-DD
  const contactsByDay = useMemo(() => {
    const map = new Map<string, Contact[]>();

    contacts.forEach((c) => {
      const dStr = c.createdAt || c.importedAt;
      if (!dStr) return;
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return;

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;

      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    });

    return map;
  }, [contacts]);

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    // Monday start (0=Mon, 6=Sun)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const totalDays = lastDay.getDate();
    const days: { date: number; isCurrentMonth: boolean; dateString: string }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = prevMonthLastDay - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const mm = String(prevMonth + 1).padStart(2, '0');
      const dd = String(prevDate).padStart(2, '0');
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        dateString: `${prevYear}-${mm}-${dd}`,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const mm = String(currentMonth + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      days.push({
        date: d,
        isCurrentMonth: true,
        dateString: `${currentYear}-${mm}-${dd}`,
      });
    }

    // Next month padding to fill grid
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const mm = String(nextMonth + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      days.push({
        date: d,
        isCurrentMonth: false,
        dateString: `${nextYear}-${mm}-${dd}`,
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const selectedDayContacts = contactsByDay.get(selectedDayString) || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Calendar Header Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <span className="text-xs text-slate-500">Visualización de altas por día</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setCurrentYear(2026);
                setCurrentMonth(8);
                setSelectedDayString('2026-09-18');
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={handlePrevMonth}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 dark:text-slate-500 py-2 border-b border-slate-100 dark:border-slate-800">
          <span>LUN</span>
          <span>MAR</span>
          <span>MIÉ</span>
          <span>JUE</span>
          <span>VIE</span>
          <span>SÁB</span>
          <span>DOM</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mt-2">
          {calendarDays.map((dayItem, idx) => {
            const dayContacts = contactsByDay.get(dayItem.dateString) || [];
            const count = dayContacts.length;
            const isSelected = selectedDayString === dayItem.dateString;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDayString(dayItem.dateString)}
                className={`min-h-[64px] sm:min-h-[80px] p-1.5 sm:p-2 rounded-2xl flex flex-col justify-between text-left transition-all border ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                    : dayItem.isCurrentMonth
                    ? 'border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900 hover:border-slate-300'
                    : 'border-transparent bg-transparent opacity-30'
                }`}
              >
                <span
                  className={`text-xs font-semibold ${
                    isSelected
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {dayItem.date}
                </span>

                {count > 0 && (
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-bold ${
                        count >= 5
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : count >= 2
                          ? 'bg-indigo-500 text-white shadow-sm'
                          : 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      {count} {count === 1 ? 'cto' : 'ctos'}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Contacts Drawer */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Contactos del día:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                {selectedDayString}
              </span>
            </h3>
            <span className="text-xs text-slate-500">
              {selectedDayContacts.length} {selectedDayContacts.length === 1 ? 'contacto guardado' : 'contactos guardados'} en esta fecha
            </span>
          </div>

          <button
            onClick={onOpenAddContact}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Añadir contacto</span>
          </button>
        </div>

        {selectedDayContacts.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No hay contactos registrados con fecha de creación en este día.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedDayContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer transition-all shadow-sm hover:shadow"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: contact.color || '#6366f1' }}
                  >
                    {contact.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {contact.name} {contact.lastName || ''}
                    </h4>
                    {contact.phones[0] && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-mono flex items-center gap-1 truncate mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{formatPhoneDisplay(contact.phones[0].number)}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
