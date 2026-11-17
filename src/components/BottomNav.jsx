import React from 'react';
import { PlusCircle, Users, Receipt, BarChart3 } from 'lucide-react';
import { playHapticSound } from '../utils/storage';

export function BottomNav({ activeTab, setActiveTab, invoicesCount, clientsCount }) {
  const tabs = [
    {
      id: 'builder',
      title: 'فاتورة جديدة',
      subtitle: 'Nouvelle Facture',
      icon: PlusCircle,
    },
    {
      id: 'clients',
      title: 'الزبائن',
      subtitle: 'Clients',
      icon: Users,
      badge: clientsCount,
    },
    {
      id: 'history',
      title: 'السجل',
      subtitle: 'Historique',
      icon: Receipt,
      badge: invoicesCount,
    },
    {
      id: 'reports',
      title: 'التقارير',
      subtitle: 'Statistiques',
      icon: BarChart3,
    },
  ];

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg safe-area-bottom">
      <div className="max-w-lg mx-auto grid grid-cols-4 h-16 sm:h-18 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                playHapticSound('tap');
                setActiveTab(tab.id);
              }}
              className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-95 select-none relative ${
                isActive ? 'text-emerald-700 font-black' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'
                  }`}
                />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -left-2.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono bg-slate-900 text-white tabular-nums">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className={`text-xs ${isActive ? 'font-black' : 'font-bold'}`}>
                {tab.title}
              </span>

              {/* Active top line indicator */}
              {isActive && (
                <span className="absolute top-0 w-12 h-1 bg-emerald-600 rounded-b-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
