import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { SeasonData } from '@/data/parser';
import hockeyData from '@/data/hockey-data.json';

export default function Home() {
  const [selectedSeason, setSelectedSeason] = useState<number>(2024);
  const seasons = hockeyData.seasons as SeasonData[];
  const currentSeason = seasons.find(s => s.year === selectedSeason);

  return (
    <Layout title="Season Explorer - Fantasy Hockey Dashboard">
      <div className="space-y-6">
        {/* Season Selector */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Season Explorer</h2>
          <div className="flex items-center space-x-4">
            <label htmlFor="season-select" className="text-sm font-medium text-gray-700">
              Select Season:
            </label>
            <select
              id="season-select"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-hockey-primary text-blue-600"
            >
              {seasons.map(season => (
                <option key={season.year} value={season.year} className="text-blue-600">
                  {season.year} Season
                </option>
              ))}
            </select>
          </div>
        </div>

        {currentSeason && (
          <>
            {/* Season Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900">Champion</h3>
                <p className="text-2xl font-bold text-hockey-secondary mt-2">
                  {currentSeason.managers.find(m => m.isChampion)?.manager || 'N/A'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {currentSeason.managers.find(m => m.isChampion)?.team || ''}
                </p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900">Runner-up</h3>
                <p className="text-2xl font-bold text-gray-700 mt-2">
                  {currentSeason.managers.find(m => m.finalPosition === 2)?.manager || 'N/A'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {currentSeason.managers.find(m => m.finalPosition === 2)?.team || ''}
                </p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900">Teams</h3>
                <p className="text-2xl font-bold text-gray-700 mt-2">
                  {currentSeason.managers.length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Managers</p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900">Season Status</h3>
                <p className="text-2xl font-bold text-gray-700 mt-2">
                  {currentSeason.notes ? 'Special' : 'Complete'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {currentSeason.notes || 'Regular season'}
                </p>
              </div>
            </div>

            {/* Standings Table */}
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Final Standings</h3>
              <div className="overflow-x-auto">
                <table className="table-auto">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-header">Position</th>
                      <th className="table-header">Manager</th>
                      <th className="table-header">Team Name</th>
                      <th className="table-header">Regular Season</th>
                      <th className="table-header">Playoff Record</th>
                      <th className="table-header">Final Position</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentSeason.managers
                      .sort((a, b) => a.finalPosition - b.finalPosition)
                      .map((manager, index) => (
                        <tr key={manager.manager} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="table-cell font-medium">
                            {manager.finalPosition}
                            {manager.isChampion && ' 🏆'}
                          </td>
                          <td className="table-cell font-semibold text-hockey-primary">
                            {manager.manager}
                          </td>
                          <td className="table-cell">{manager.team}</td>
                          <td className="table-cell">{manager.regularSeasonRecord}</td>
                          <td className="table-cell">{manager.playoffRecord || '-'}</td>
                          <td className="table-cell">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              manager.finalPosition === 1 ? 'bg-yellow-100 text-yellow-800' :
                              manager.finalPosition === 2 ? 'bg-gray-100 text-gray-800' :
                              manager.finalPosition === 3 ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-50 text-gray-600'
                            }`}>
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
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Playoff Results</h3>
                <div className="space-y-3">
                  {currentSeason.playoffResults.quarterfinals && (
                    <div>
                      <h4 className="font-semibold text-gray-800">Quarterfinals</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        {currentSeason.playoffResults.quarterfinals.map((match, index) => (
                          <div key={index} className="pl-4">• {match}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentSeason.playoffResults.semifinals && (
                    <div>
                      <h4 className="font-semibold text-gray-800">Semifinals</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        {currentSeason.playoffResults.semifinals.map((match, index) => (
                          <div key={index} className="pl-4">• {match}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentSeason.playoffResults.finals && (
                    <div>
                      <h4 className="font-semibold text-gray-800">Finals</h4>
                      <div className="text-sm text-gray-600 pl-4">
                        • {currentSeason.playoffResults.finals}
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