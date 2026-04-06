import React, { useState } from 'react';
import Layout, { formatSeason } from '@/components/Layout';
import { ManagerStats } from '@/data/parser';
import hockeyData from '@/data/hockey-data.json';
import { Trophy, Target, TrendingUp, Calendar } from 'lucide-react';

export default function Managers() {
  const [selectedManager, setSelectedManager] = useState<string>('');
  const managerStats = hockeyData.managerStats as ManagerStats[];
  const currentManager = managerStats.find(m => m.manager === selectedManager);

  return (
    <Layout title="Manager Profiles - Fantasy Hockey Dashboard">
      <div className="space-y-8">
        {/* Manager Selector */}
        <div className="card">
          <h2 className="text-2xl font-semibold text-slate-100 mb-4">Manager Profiles</h2>
          <div className="flex items-center gap-4">
            <label htmlFor="manager-select" className="text-sm font-medium text-slate-300">
              Select Manager:
            </label>
            <select
              id="manager-select"
              value={selectedManager}
              onChange={(e) => setSelectedManager(e.target.value)}
              className="border border-hockey-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-hockey-secondary text-slate-100 bg-hockey-surface"
            >
              <option value="">-- Select a Manager --</option>
              {managerStats
                .sort((a, b) => a.manager.localeCompare(b.manager))
                .map(manager => (
                  <option key={manager.manager} value={manager.manager}>
                    {manager.manager}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Winner's Circle */}
        <div className="card">
          <h3 className="text-2xl font-semibold text-slate-100 mb-2">Winner's Circle</h3>
          <p className="text-slate-400 mb-6">Dominance or luck? Championship winners and their overall records</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {managerStats
              .filter((manager) => manager.championships > 0)
              .sort((a, b) => b.championships - a.championships)
              .map((manager) => {
                // Determine dominance vs luck based on average finish and championships
                let classification = 'LUCK';
                let colorClasses = 'border-hockey-border bg-hockey-primary/50';
                let textColor = 'text-slate-100';
                let badgeColor = 'bg-slate-700';

                if (manager.manager === 'Dave') {
                  classification = 'DOMINANCE';
                  colorClasses = 'border-hockey-border bg-hockey-primary/50';
                  textColor = 'text-slate-100';
                  badgeColor = 'bg-slate-700';
                } else if (manager.manager === 'Vin') {
                  classification = 'DOMINANCE';
                  colorClasses = 'border-hockey-border bg-hockey-primary/50';
                  textColor = 'text-slate-100';
                  badgeColor = 'bg-slate-700';
                } else if (manager.manager === 'Sammy') {
                  classification = 'LUCK';
                  colorClasses = 'border-hockey-border bg-hockey-primary/50';
                  textColor = 'text-slate-100';
                  badgeColor = 'bg-slate-700';
                } else if (manager.manager === 'Colon') {
                  classification = 'LUCK';
                  colorClasses = 'border-hockey-border bg-hockey-primary/50';
                  textColor = 'text-slate-100';
                  badgeColor = 'bg-slate-700';
                }

                const winPct = (manager.regularSeasonRecord.wins /
                  (manager.regularSeasonRecord.wins + manager.regularSeasonRecord.losses) * 100);

                return (
                  <div key={manager.manager}
                       className={`border rounded-xl p-4 hover:shadow-sm transition-shadow cursor-pointer ${colorClasses}`}
                       onClick={() => setSelectedManager(manager.manager)}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className={`text-lg font-semibold ${textColor}`}>{manager.manager}</h4>
                        <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-white ${badgeColor}`}>
                          {classification}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Trophy className="h-5 w-5 text-hockey-secondary" />
                        <span className="text-xl font-semibold text-slate-100">{manager.championships}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Overall Record:</span>
                        <span className={`font-medium ${textColor}`}>
                          {manager.regularSeasonRecord.wins}-{manager.regularSeasonRecord.losses}-{manager.regularSeasonRecord.ties}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Win %:</span>
                        <span className={`font-medium ${textColor}`}>{winPct.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Avg Finish:</span>
                        <span className={`font-medium ${textColor}`}>{manager.averageFinish.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Seasons:</span>
                        <span className={`font-medium ${textColor}`}>{manager.totalSeasons}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Detailed Manager Stats */}
        {currentManager && (
          <>
            <div className="card">
              <h3 className="text-2xl font-semibold text-slate-100 mb-6">{currentManager.manager} - Career Statistics</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <Trophy className="h-8 w-8 mx-auto mb-2 text-hockey-secondary" />
                  <div className="text-3xl font-semibold text-slate-100">{currentManager.championships}</div>
                  <div className="text-sm text-slate-400">Championships</div>
                </div>

                <div className="text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                  <div className="text-3xl font-semibold text-slate-100">{currentManager.runnerUps}</div>
                  <div className="text-sm text-slate-400">Runner-ups</div>
                </div>

                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                  <div className="text-3xl font-semibold text-slate-100">{currentManager.averageFinish.toFixed(1)}</div>
                  <div className="text-sm text-slate-400">Avg Finish</div>
                </div>

                <div className="text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                  <div className="text-3xl font-semibold text-slate-100">{currentManager.totalSeasons}</div>
                  <div className="text-sm text-slate-400">Total Seasons</div>
                </div>
              </div>
            </div>

            {/* Regular Season & Playoff Records */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h4 className="text-lg font-semibold text-slate-100 mb-4">Regular Season Record</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Wins:</span>
                    <span className="font-medium text-slate-100">{currentManager.regularSeasonRecord.wins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Losses:</span>
                    <span className="font-medium text-slate-100">{currentManager.regularSeasonRecord.losses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ties:</span>
                    <span className="font-medium text-slate-200">{currentManager.regularSeasonRecord.ties}</span>
                  </div>
                  <div className="border-t border-hockey-border pt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Win Percentage:</span>
                      <span className="text-slate-100">
                        {(currentManager.regularSeasonRecord.wins /
                          (currentManager.regularSeasonRecord.wins + currentManager.regularSeasonRecord.losses) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h4 className="text-lg font-semibold text-slate-100 mb-4">Playoff Record</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Wins:</span>
                    <span className="font-medium text-slate-100">{currentManager.playoffRecord.wins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Losses:</span>
                    <span className="font-medium text-slate-100">{currentManager.playoffRecord.losses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Appearances:</span>
                    <span className="font-medium text-slate-100">{currentManager.playoffAppearances}</span>
                  </div>
                  <div className="border-t border-hockey-border pt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Win Percentage:</span>
                      <span className="text-slate-100">
                        {currentManager.playoffRecord.wins + currentManager.playoffRecord.losses > 0 ?
                          (currentManager.playoffRecord.wins /
                           (currentManager.playoffRecord.wins + currentManager.playoffRecord.losses) * 100).toFixed(1) : '0.0'}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Seasons Played */}
            <div className="card">
              <h4 className="text-lg font-semibold text-slate-100 mb-4">Seasons Played</h4>
              <div className="flex flex-wrap gap-2">
                {currentManager.seasonsPlayed.map(year => (
                  <span key={year} className="badge">
                    {formatSeason(year)}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* All Managers Table */}
        <div className="card">
          <h3 className="text-xl font-semibold text-slate-100 mb-4">All Managers Summary</h3>
          <div className="mobile-table">
            <table className="table-auto">
              <thead className="bg-hockey-primary/50">
                <tr>
                  <th className="table-header">Manager</th>
                  <th className="table-header">Seasons</th>
                  <th className="table-header">Championships</th>
                  <th className="table-header">Runner-ups</th>
                  <th className="table-header">Avg Finish</th>
                  <th className="table-header">Regular Season</th>
                  <th className="table-header">Playoff Record</th>
                </tr>
              </thead>
              <tbody className="bg-hockey-surface divide-y divide-hockey-border">
                {managerStats
                  .sort((a, b) => {
                    if (b.championships !== a.championships) {
                      return b.championships - a.championships;
                    }
                    if (a.averageFinish !== b.averageFinish) {
                      return a.averageFinish - b.averageFinish;
                    }
                    // Tertiary sort by name for stable ordering
                    return a.manager.localeCompare(b.manager);
                  })
                  .map((manager, index) => (
                    <tr key={manager.manager} className={index % 2 === 0 ? 'bg-hockey-surface' : 'bg-hockey-primary/50'}>
                      <td className="table-cell font-semibold text-slate-100">
                        {manager.manager}
                      </td>
                      <td className="table-cell">{manager.totalSeasons}</td>
                      <td className="table-cell text-center">
                        <span className="font-semibold text-slate-100 inline-flex items-center gap-1 justify-center">
                          {manager.championships}
                          {manager.championships > 0 && (
                            <Trophy className="h-3.5 w-3.5 text-hockey-gold" aria-label="Champion" />
                          )}
                        </span>
                      </td>
                      <td className="table-cell text-center">{manager.runnerUps}</td>
                      <td className="table-cell text-center">{manager.averageFinish.toFixed(1)}</td>
                      <td className="table-cell text-center">
                        {manager.regularSeasonRecord.wins}-{manager.regularSeasonRecord.losses}-{manager.regularSeasonRecord.ties}
                      </td>
                      <td className="table-cell text-center">
                        {manager.playoffRecord.wins}-{manager.playoffRecord.losses}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
