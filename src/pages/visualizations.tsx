import React, { useMemo } from 'react';
import Layout, { formatSeason } from '@/components/Layout';
import { SeasonData, ManagerStats } from '@/data/parser';
import hockeyData from '@/data/hockey-data.json';
import { Calendar, TrendingUp, Crown } from 'lucide-react';

export default function Visualizations() {
  const seasons = hockeyData.seasons as SeasonData[];
  const managerStats = hockeyData.managerStats as ManagerStats[];

  const eras = [
    { name: 'Early Era', years: [2011, 2012, 2013, 2014, 2015, 2017], label: '2011-2018' },
    { name: 'Middle Era', years: [2018, 2020, 2021, 2022], label: '2018-2023' },
    { name: 'Modern Era', years: [2023, 2024, 2025], label: '2023-2026' },
  ];

  const allYears = [2011, 2012, 2013, 2014, 2015, 2017, 2018, 2020, 2021, 2022, 2023, 2024, 2025];

  // ── Manager Performance Over Time ──
  const performanceData = useMemo(() => {
    const qualified = managerStats
      .filter(m => m.totalSeasons >= 5 && m.manager !== 'unknown')
      .sort((a, b) => {
        if (b.championships !== a.championships) return b.championships - a.championships;
        return a.averageFinish - b.averageFinish;
      });

    return qualified.map(ms => {
      const yearPositions = allYears.map(year => {
        const season = seasons.find(s => s.year === year);
        const mgr = season?.managers.find(m => m.manager === ms.manager);
        return mgr ? mgr.finalPosition : null;
      });
      return {
        manager: ms.manager,
        positions: yearPositions,
        championships: ms.championships,
      };
    });
  }, [managerStats, seasons]);

  // ── Era Dominance ──
  const eraDominance = useMemo(() => {
    return eras.map(era => {
      const champCounts: Record<string, number> = {};
      era.years.forEach(year => {
        const season = seasons.find(s => s.year === year);
        const champ = season?.managers.find(m => m.isChampion);
        if (champ) {
          champCounts[champ.manager] = (champCounts[champ.manager] || 0) + 1;
        }
      });
      const sorted = Object.entries(champCounts).sort((a, b) => b[1] - a[1]);
      return { ...era, champions: sorted, totalSeasons: era.years.length };
    });
  }, [seasons]);

  // ── Helper: position square color ──
  const positionColor = (pos: number | null) => {
    if (pos === null) return 'bg-slate-800 text-slate-600';
    if (pos === 1) return 'bg-amber-500 text-white';
    if (pos <= 3) return 'bg-green-500 text-white';
    if (pos <= 6) return 'bg-slate-600 text-slate-300';
    return 'bg-red-500 text-white';
  };

  return (
    <Layout title="Visualizations - Fantasy Hockey Dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ═══════ Manager Performance Over Time ═══════ */}
        <div className="bg-hockey-surface border border-hockey-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="h-6 w-6 text-hockey-secondary" />
            <h2 className="text-xl font-semibold text-slate-100">Manager Performance Over Time</h2>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {performanceData.map(pd => (
                <div key={pd.manager} className="flex items-center gap-2 py-1.5">
                  <div className="w-20 text-sm font-medium text-slate-100 flex-shrink-0">{pd.manager}</div>
                  <div className="flex gap-1.5">
                    {pd.positions.map((pos, i) => (
                      <div
                        key={allYears[i]}
                        className={`w-7 h-7 rounded flex items-center justify-center text-[10px] font-semibold ${positionColor(pos)}`}
                      >
                        {pos === null ? '--' : pos === 1 ? <Crown className="h-3.5 w-3.5" /> : pos}
                      </div>
                    ))}
                  </div>
                  <div className="text-slate-400 text-xs w-16 text-right flex-shrink-0">
                    {pd.championships} title{pd.championships !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}

              {/* Year labels */}
              <div className="flex items-center gap-2 mt-2">
                <div className="w-20 flex-shrink-0" />
                <div className="flex gap-1.5">
                  {allYears.map(y => (
                    <div key={y} className="w-7 text-center text-slate-600 text-[9px]">
                      &apos;{String(y).slice(2)}-{String(y + 1).slice(2)}
                    </div>
                  ))}
                </div>
                <div className="w-16 flex-shrink-0" />
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-amber-500" />
              <span>Champion</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span>2nd-3rd</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-slate-600" />
              <span>4th-6th</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-red-500" />
              <span>7th+</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-slate-800" />
              <span>Did not play</span>
            </div>
          </div>
        </div>

        {/* ═══════ Era Dominance Analysis ═══════ */}
        <div className="bg-hockey-surface border border-hockey-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-6 w-6 text-hockey-secondary" />
            <h2 className="text-xl font-semibold text-slate-100">Era Dominance Analysis</h2>
          </div>

          <div className="space-y-6">
            {eraDominance.map(era => (
              <div key={era.name} className="bg-hockey-primary/50 rounded-lg p-6 border border-hockey-border">
                <h3 className="text-slate-100 text-lg font-semibold mb-4">
                  {era.name} <span className="text-slate-400">({era.totalSeasons} seasons)</span>
                </h3>

                <div className="space-y-3">
                  {era.champions.map(([manager, count]) => {
                    const pct = (count / era.totalSeasons) * 100;
                    return (
                      <div key={manager} className="flex items-center gap-3">
                        <div className="w-20 text-sm font-medium text-slate-100">{manager}</div>
                        <div className="bg-slate-700 rounded h-6 flex-1 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-green-600 to-green-400 h-6 rounded flex items-center px-2"
                            style={{ width: `${pct}%` }}
                          >
                            {pct >= 20 && (
                              <span className="text-white text-sm font-medium">{count}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-slate-400 text-sm w-16 text-right">
                          {Math.round(pct)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}
