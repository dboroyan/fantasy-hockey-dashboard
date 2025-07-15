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
      <div className="space-y-6">
        {/* Manager Selector */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Manager Profiles</h2>
          <div className="flex items-center space-x-4">
            <label htmlFor="manager-select" className="text-sm font-medium text-gray-700">
              Select Manager:
            </label>
            <select
              id="manager-select"
              value={selectedManager}
              onChange={(e) => setSelectedManager(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-hockey-primary text-blue-600"
            >
              <option value="" className="text-blue-600">-- Select a Manager --</option>
              {managerStats
                .sort((a, b) => a.manager.localeCompare(b.manager))
                .map(manager => (
                  <option key={manager.manager} value={manager.manager} className="text-blue-600">
                    {manager.manager}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Manager Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {managerStats
            .sort((a, b) => {
              if (b.championships !== a.championships) {
                return b.championships - a.championships;
              }
              // Secondary sort by name for stable ordering
              return a.manager.localeCompare(b.manager);
            })
            .slice(0, 4)
            .map((manager) => (
              <div key={manager.manager} className="card hover:shadow-lg transition-shadow cursor-pointer"
                   onClick={() => setSelectedManager(manager.manager)}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{manager.manager}</h3>
                    <p className="text-sm text-gray-600">{manager.totalSeasons} seasons</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Trophy className="h-5 w-5 text-hockey-accent" />
                    <span className="text-xl font-bold text-hockey-secondary">{manager.championships}</span>
                  </div>
                </div>
                <div className="mt-4 flex justify-between text-sm">
                  <span className="text-gray-600">Avg Finish:</span>
                  <span className="font-medium">{manager.averageFinish.toFixed(1)}</span>
                </div>
              </div>
            ))}
        </div>

        {/* Detailed Manager Stats */}
        {currentManager && (
          <>
            <div className="card">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{currentManager.manager} - Career Statistics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <Trophy className="h-8 w-8 mx-auto mb-2 text-hockey-accent" />
                  <div className="text-3xl font-bold text-hockey-secondary">{currentManager.championships}</div>
                  <div className="text-sm text-gray-600">Championships</div>
                </div>
                
                <div className="text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                  <div className="text-3xl font-bold text-gray-700">{currentManager.runnerUps}</div>
                  <div className="text-sm text-gray-600">Runner-ups</div>
                </div>
                
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-3xl font-bold text-blue-600">{currentManager.averageFinish.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Avg Finish</div>
                </div>
                
                <div className="text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <div className="text-3xl font-bold text-green-600">{currentManager.totalSeasons}</div>
                  <div className="text-sm text-gray-600">Total Seasons</div>
                </div>
              </div>
            </div>

            {/* Regular Season & Playoff Records */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Regular Season Record</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wins:</span>
                    <span className="font-medium text-green-600">{currentManager.regularSeasonRecord.wins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Losses:</span>
                    <span className="font-medium text-red-600">{currentManager.regularSeasonRecord.losses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ties:</span>
                    <span className="font-medium text-gray-600">{currentManager.regularSeasonRecord.ties}</span>
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
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Playoff Record</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wins:</span>
                    <span className="font-medium text-green-600">{currentManager.playoffRecord.wins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Losses:</span>
                    <span className="font-medium text-red-600">{currentManager.playoffRecord.losses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Appearances:</span>
                    <span className="font-medium text-blue-600">{currentManager.playoffAppearances}</span>
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
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Seasons Played</h4>
              <div className="flex flex-wrap gap-2">
                {currentManager.seasonsPlayed.map(year => (
                  <span key={year} className="bg-hockey-primary text-white px-3 py-1 rounded-full text-sm">
                    {year}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* All Managers Table */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">All Managers Summary</h3>
          <div className="overflow-x-auto">
            <table className="table-auto">
              <thead className="bg-gray-50">
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
              <tbody className="bg-white divide-y divide-gray-200">
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
                    <tr key={manager.manager} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="table-cell font-semibold text-hockey-primary">
                        {manager.manager}
                      </td>
                      <td className="table-cell">{manager.totalSeasons}</td>
                      <td className="table-cell text-center">
                        <span className="font-semibold text-hockey-secondary">{manager.championships}</span>
                        {manager.championships > 0 && ' 🏆'}
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