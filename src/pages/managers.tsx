import React, { useState } from 'react';
import Layout from '@/components/Layout';
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
          <h2 className="text-2xl font-semibold text-hockey-primary mb-4">Manager Profiles</h2>
          <div className="flex items-center gap-4">
            <label htmlFor="manager-select" className="text-sm font-medium text-slate-700">
              Select Manager:
            </label>
            <select
              id="manager-select"
              value={selectedManager}
              onChange={(e) => setSelectedManager(e.target.value)}
              className="border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
            >
              <option value="" className="text-slate-900">-- Select a Manager --</option>
              {managerStats
                .sort((a, b) => a.manager.localeCompare(b.manager))
                .map(manager => (
                  <option key={manager.manager} value={manager.manager} className="text-slate-900">
                    {manager.manager}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Winner's Circle */}
        <div className="card">
          <h3 className="text-2xl font-semibold text-hockey-primary mb-2">Winner's Circle</h3>
          <p className="text-slate-600 mb-6">Dominance or luck? Championship winners and their overall records</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {managerStats
              .filter((manager) => manager.championships > 0)
              .sort((a, b) => b.championships - a.championships)
              .map((manager) => {
                // Determine dominance vs luck based on average finish and championships
                let classification = 'LUCK';
                let colorClasses = 'border-slate-200 bg-slate-50';
                let textColor = 'text-slate-900';
                let badgeColor = 'bg-slate-700';
                
                if (manager.manager === 'Dave') {
                  classification = 'DOMINANCE';
                  colorClasses = 'border-slate-200 bg-slate-50';
                  textColor = 'text-slate-900';
                  badgeColor = 'bg-slate-700';
                } else if (manager.manager === 'Vin') {
                  classification = 'DOMINANCE';
                  colorClasses = 'border-slate-200 bg-slate-50';
                  textColor = 'text-slate-900';
                  badgeColor = 'bg-slate-700';
                } else if (manager.manager === 'Sammy') {
                  classification = 'LUCK';
                  colorClasses = 'border-slate-200 bg-slate-50';
                  textColor = 'text-slate-900';
                  badgeColor = 'bg-slate-700';
                } else if (manager.manager === 'Colon') {
                  classification = 'LUCK';
                  colorClasses = 'border-slate-200 bg-slate-50';
                  textColor = 'text-slate-900';
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
                        <span className="text-xl font-semibold text-slate-900">{manager.championships}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Overall Record:</span>
                        <span className={`font-medium ${textColor}`}>
                          {manager.regularSeasonRecord.wins}-{manager.regularSeasonRecord.losses}-{manager.regularSeasonRecord.ties}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Win %:</span>
                        <span className={`font-medium ${textColor}`}>{winPct.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Finish:</span>
                        <span className={`font-medium ${textColor}`}>{manager.averageFinish.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Seasons:</span>
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
              <h3 className="text-2xl font-semibold text-hockey-primary mb-6">{currentManager.manager} - Career Statistics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <Trophy className="h-8 w-8 mx-auto mb-2 text-hockey-secondary" />
                  <div className="text-3xl font-semibold text-hockey-primary">{currentManager.championships}</div>
                  <div className="text-sm text-slate-600">Championships</div>
                </div>
                
                <div className="text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-slate-500" />
                  <div className="text-3xl font-semibold text-slate-900">{currentManager.runnerUps}</div>
                  <div className="text-sm text-slate-600">Runner-ups</div>
                </div>
                
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-slate-500" />
                  <div className="text-3xl font-semibold text-slate-900">{currentManager.averageFinish.toFixed(1)}</div>
                  <div className="text-sm text-slate-600">Avg Finish</div>
                </div>
                
                <div className="text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-slate-500" />
                  <div className="text-3xl font-semibold text-slate-900">{currentManager.totalSeasons}</div>
                  <div className="text-sm text-slate-600">Total Seasons</div>
                </div>
              </div>
            </div>

            {/* Regular Season & Playoff Records */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h4 className="text-lg font-semibold text-hockey-primary mb-4">Regular Season Record</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Wins:</span>
                    <span className="font-medium text-slate-900">{currentManager.regularSeasonRecord.wins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Losses:</span>
                    <span className="font-medium text-slate-900">{currentManager.regularSeasonRecord.losses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ties:</span>
                    <span className="font-medium text-slate-800">{currentManager.regularSeasonRecord.ties}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Win Percentage:</span>
                      <span className="text-hockey-primary">
                        {(currentManager.regularSeasonRecord.wins / 
                          (currentManager.regularSeasonRecord.wins + currentManager.regularSeasonRecord.losses) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h4 className="text-lg font-semibold text-hockey-primary mb-4">Playoff Record</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Wins:</span>
                    <span className="font-medium text-slate-900">{currentManager.playoffRecord.wins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Losses:</span>
                    <span className="font-medium text-slate-900">{currentManager.playoffRecord.losses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Appearances:</span>
                    <span className="font-medium text-slate-900">{currentManager.playoffAppearances}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Win Percentage:</span>
                      <span className="text-hockey-primary">
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
              <h4 className="text-lg font-semibold text-hockey-primary mb-4">Seasons Played</h4>
              <div className="flex flex-wrap gap-2">
                {currentManager.seasonsPlayed.map(year => (
                  <span key={year} className="badge">
                    {year}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* All Managers Table */}
        <div className="card">
          <h3 className="text-xl font-semibold text-hockey-primary mb-4">All Managers Summary</h3>
          <div className="mobile-table">
            <table className="table-auto">
              <thead className="bg-slate-50">
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
              <tbody className="bg-white divide-y divide-slate-200">
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
                    <tr key={manager.manager} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="table-cell font-semibold text-slate-900">
                        {manager.manager}
                      </td>
                      <td className="table-cell">{manager.totalSeasons}</td>
                      <td className="table-cell text-center">
                        <span className="font-semibold text-slate-900 inline-flex items-center gap-1 justify-center">
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
