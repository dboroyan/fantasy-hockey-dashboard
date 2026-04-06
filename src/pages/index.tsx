import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { formatSeason } from '@/components/Layout';
import { SeasonData } from '@/data/parser';
import hockeyData from '@/data/hockey-data.json';
import { Trophy } from 'lucide-react';

export default function Home() {
  const [selectedSeason, setSelectedSeason] = useState<number>(2025);
  const seasons = hockeyData.seasons as SeasonData[];
  const currentSeason = seasons.find(s => s.year === selectedSeason);

  return (
    <Layout title="Season Explorer - Fantasy Hockey Dashboard">
      <div className="space-y-8">
        {/* Season Selector */}
        <div className="card">
          <h2 className="text-2xl font-semibold text-slate-100 mb-4">Season Explorer</h2>
          <div className="flex items-center gap-4">
            <label htmlFor="season-select" className="text-sm font-medium text-slate-300">
              Select Season:
            </label>
            <select
              id="season-select"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
              className="border border-hockey-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-hockey-secondary text-slate-100 bg-hockey-surface"
            >
              {seasons.map(season => (
                <option key={season.year} value={season.year}>
                  {formatSeason(season.year)} Season
                </option>
              ))}
            </select>
          </div>
        </div>

        {currentSeason && (
          <>
            {/* Season Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-slate-100">Champion</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Trophy className="h-5 w-5 text-hockey-gold" aria-hidden="true" />
                  <p className="text-xl font-semibold text-slate-100">
                    {currentSeason.managers.find(m => m.isChampion)?.manager || 'N/A'}
                  </p>
                </div>
                <p className="text-sm text-slate-400 mt-1">{currentSeason.managers.find(m => m.isChampion)?.team || ''}</p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold text-slate-100">Runner-up</h3>
                <p className="text-xl font-semibold text-slate-200 mt-2">
                  {currentSeason.managers.find(m => m.finalPosition === 2)?.manager || 'N/A'}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  {currentSeason.managers.find(m => m.finalPosition === 2)?.team || ''}
                </p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold text-slate-100">Teams</h3>
                <p className="text-xl font-semibold text-slate-200 mt-2">
                  {currentSeason.managers.length}
                </p>
                <p className="text-sm text-slate-400 mt-1">Managers</p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold text-slate-100">Season Status</h3>
                <p className="text-xl font-semibold text-slate-200 mt-2">
                  {currentSeason.notes ? 'Special' : 'Complete'}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  {currentSeason.notes || 'Regular season'}
                </p>
              </div>
            </div>

            {/* 2024 Season Notable Points */}
            {selectedSeason === 2024 && (
              <div className="card">
                <h3 className="text-xl font-semibold text-slate-100 mb-4">{formatSeason(2024)} Season Notable Points</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-hockey-secondary text-hockey-primary rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <p className="text-slate-300">
                      This was the first year where a defending champion has missed the playoffs in their title defense season (Sammy).
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-hockey-secondary text-hockey-primary rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <p className="text-slate-300">
                      MST finished the season 1st in Goals, Assists, PPP, SOG, and 2nd in SV% in total overall statistics over the course of the full season and playoffs.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-hockey-secondary text-hockey-primary rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <p className="text-slate-300">
                      This was Dave and MST's second time meeting in the finals.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Standings Table */}
            <div className="card">
              <h3 className="text-xl font-semibold text-slate-100 mb-4">Final Standings</h3>
              <div className="overflow-x-auto">
                <table className="table-auto">
                  <thead className="bg-hockey-primary/50">
                    <tr>
                      <th className="table-header">Position</th>
                      <th className="table-header">Manager</th>
                      <th className="table-header">Team Name</th>
                      <th className="table-header">Regular Season</th>
                      <th className="table-header">Playoff Record</th>
                      <th className="table-header">Final Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hockey-border">
                    {currentSeason.managers
                      .sort((a, b) => a.finalPosition - b.finalPosition)
                      .map((manager, index) => (
                        <tr key={manager.manager} className={index % 2 === 0 ? 'bg-hockey-surface' : 'bg-hockey-primary/50'}>
                          <td className="table-cell font-medium text-slate-100">
                            <div className="flex items-center gap-2">
                              <span>{manager.finalPosition}</span>
                              {manager.isChampion && (
                                <Trophy className="h-4 w-4 text-hockey-secondary" aria-label="Champion" />
                              )}
                            </div>
                          </td>
                          <td className="table-cell font-semibold text-slate-100">
                            {manager.manager}
                          </td>
                          <td className="table-cell">{manager.team}</td>
                          <td className="table-cell">{manager.regularSeasonRecord}</td>
                          <td className="table-cell">{manager.playoffRecord || '-'}</td>
                          <td className="table-cell">
                            <span className={`badge ${manager.finalPosition === 1 ? 'badge-gold' : ''}`}>
                              {manager.finalPosition === 1 && <Trophy className="h-3.5 w-3.5 text-hockey-gold" aria-hidden="true" />}
                              {manager.finalPosition === 1 ? 'Champion' :
                               manager.finalPosition === 2 ? 'Runner-up' :
                               manager.finalPosition === 3 ? '3rd Place' :
                               `${manager.finalPosition}th Place`}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Playoff Results */}
            {currentSeason.playoffResults && (
              <div className="card">
                <h3 className="text-xl font-semibold text-slate-100 mb-4">Playoff Results</h3>
                <div className="space-y-3">
                  {currentSeason.playoffResults.quarterfinals && (
                    <div>
                      <h4 className="font-semibold text-slate-200">Quarterfinals</h4>
                      <div className="text-sm text-slate-400 space-y-1">
                        {currentSeason.playoffResults.quarterfinals.map((match, index) => (
                          <div key={index} className="pl-4">- {match}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentSeason.playoffResults.semifinals && (
                    <div>
                      <h4 className="font-semibold text-slate-200">Semifinals</h4>
                      <div className="text-sm text-slate-400 space-y-1">
                        {currentSeason.playoffResults.semifinals.map((match, index) => (
                          <div key={index} className="pl-4">- {match}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentSeason.playoffResults.finals && (
                    <div>
                      <h4 className="font-semibold text-slate-200">Finals</h4>
                      <div className="text-sm text-slate-400 pl-4">
                        - {currentSeason.playoffResults.finals}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
