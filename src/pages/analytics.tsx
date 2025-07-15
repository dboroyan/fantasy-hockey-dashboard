import React, { useMemo } from 'react';
import Layout from '@/components/Layout';
import { SeasonData, ManagerStats } from '@/data/parser';
import hockeyData from '@/data/hockey-data.json';
import { Trophy, TrendingUp, Target, Award, Calendar, Users } from 'lucide-react';

interface LeagueAnalytics {
  totalSeasons: number;
  totalManagers: number;
  mostDominantSeasons: Array<{
    year: number;
    manager: string;
    record: string;
    position: number;
    isChampion: boolean;
  }>;
  worstChampionRecords: Array<{
    year: number;
    manager: string;
    record: string;
    position: number;
  }>;
  championshipDistribution: Array<{
    manager: string;
    championships: number;
    years: number[];
  }>;
  averageFinishRankings: Array<{
    manager: string;
    averageFinish: number;
    seasons: number;
  }>;
}

export default function Analytics() {
  const seasons = hockeyData.seasons as SeasonData[];
  const managerStats = hockeyData.managerStats as ManagerStats[];

  const analytics = useMemo((): LeagueAnalytics => {
    // Most dominant regular seasons (by winning percentage)
    const dominantSeasons = seasons
      .flatMap(season => 
        season.managers.map(manager => ({
          year: season.year,
          manager: manager.manager,
          record: manager.regularSeasonRecord,
          position: manager.regularSeasonPosition,
          isChampion: manager.isChampion
        }))
      )
      .filter(entry => entry.record && entry.record !== '-')
      .map(entry => {
        const match = entry.record.match(/(\d+)-(\d+)-(\d+)/);
        if (match) {
          const wins = parseInt(match[1]);
          const losses = parseInt(match[2]);
          const winPct = wins / (wins + losses);
          return { ...entry, winPct };
        }
        return null;
      })
      .filter(entry => entry !== null)
      .sort((a, b) => {
        if (b!.winPct !== a!.winPct) {
          return b!.winPct - a!.winPct;
        }
        // Secondary sort by name for stable ordering
        return a!.manager.localeCompare(b!.manager);
      })
      .slice(0, 10);

    // Worst records to win championship
    const worstChampions = seasons
      .flatMap(season => 
        season.managers
          .filter(manager => manager.isChampion)
          .map(manager => ({
            year: season.year,
            manager: manager.manager,
            record: manager.regularSeasonRecord,
            position: manager.regularSeasonPosition
          }))
      )
      .filter(entry => entry.record && entry.record !== '-')
      .map(entry => {
        const match = entry.record.match(/(\d+)-(\d+)-(\d+)/);
        if (match) {
          const wins = parseInt(match[1]);
          const losses = parseInt(match[2]);
          const winPct = wins / (wins + losses);
          return { ...entry, winPct, wins, losses };
        }
        return null;
      })
      .filter(entry => entry !== null)
      .filter(entry => entry!.winPct < 0.60) // Only show records with < 60% win rate
      .sort((a, b) => {
        if (a!.winPct !== b!.winPct) {
          return a!.winPct - b!.winPct;
        }
        // Secondary sort by name for stable ordering
        return a!.manager.localeCompare(b!.manager);
      })
      .slice(0, 5);

    // Championship distribution
    const championshipDist = managerStats
      .filter(manager => manager.championships > 0)
      .map(manager => {
        const championshipYears = seasons
          .filter(season => season.managers.some(m => m.manager === manager.manager && m.isChampion))
          .map(season => season.year);
        
        return {
          manager: manager.manager,
          championships: manager.championships,
          years: championshipYears
        };
      })
      .sort((a, b) => {
        if (b.championships !== a.championships) {
          return b.championships - a.championships;
        }
        // Secondary sort by name for stable ordering
        return a.manager.localeCompare(b.manager);
      });

    // Average finish rankings (exclude specific managers)
    const excludedManagers = ['Skinner', 'anto', 'unknown', 'Johnny'];
    const avgFinishRankings = managerStats
      .filter(manager => 
        manager.totalSeasons >= 3 && 
        !excludedManagers.includes(manager.manager)
      )
      .map(manager => ({
        manager: manager.manager,
        averageFinish: manager.averageFinish,
        seasons: manager.totalSeasons
      }))
      .sort((a, b) => {
        if (a.averageFinish !== b.averageFinish) {
          return a.averageFinish - b.averageFinish;
        }
        // Secondary sort by name for stable ordering
        return a.manager.localeCompare(b.manager);
      })
      .slice(0, 10);

    return {
      totalSeasons: seasons.length,
      totalManagers: managerStats.length,
      mostDominantSeasons: dominantSeasons as any,
      worstChampionRecords: worstChampions as any,
      championshipDistribution: championshipDist,
      averageFinishRankings: avgFinishRankings
    };
  }, [seasons, managerStats]);

  // Era analysis
  const eras = useMemo(() => {
    const eraDivisions = [
      { name: 'Early Era', years: [2011, 2012, 2013, 2014, 2015, 2017] },
      { name: 'Middle/Covid Era', years: [2018, 2019, 2020, 2021, 2022] },
      { name: 'Modern Era', years: [2023, 2024] }
    ];

    return eraDivisions.map(era => {
      const eraSeasons = seasons.filter(s => era.years.includes(s.year) && s.managers.length > 0);
      const eraChampions = eraSeasons.map(s => s.managers.find(m => m.isChampion)?.manager).filter(Boolean);
      
      const championCounts = eraChampions.reduce((acc, champion) => {
        acc[champion!] = (acc[champion!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const dominantManager = Object.entries(championCounts)
        .sort(([nameA, a], [nameB, b]) => {
          if (b !== a) {
            return b - a;
          }
          // Secondary sort by name for stable ordering
          return nameA.localeCompare(nameB);
        })[0];

      return {
        name: era.name,
        seasons: eraSeasons.length,
        dominantManager: dominantManager ? dominantManager[0] : 'None',
        championships: dominantManager ? dominantManager[1] : 0,
        allChampions: Object.keys(championCounts).length
      };
    });
  }, [seasons]);

  return (
    <Layout title="League Analytics - Fantasy Hockey Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">League Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-hockey-primary" />
              <div className="text-3xl font-bold text-hockey-primary">{analytics.totalSeasons}</div>
              <div className="text-sm text-gray-600">Total Seasons</div>
            </div>
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-3xl font-bold text-blue-600">{analytics.totalManagers}</div>
              <div className="text-sm text-gray-600">Total Managers</div>
            </div>
            <div className="text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-hockey-secondary" />
              <div className="text-3xl font-bold text-hockey-secondary">
                {analytics.championshipDistribution.length}
              </div>
              <div className="text-sm text-gray-600">Different Champions</div>
            </div>
            <div className="text-center">
              <Award className="h-8 w-8 mx-auto mb-2 text-hockey-accent" />
              <div className="text-3xl font-bold text-yellow-600">
                {Math.max(...analytics.championshipDistribution.map(c => c.championships))}
              </div>
              <div className="text-sm text-gray-600">Most Championships</div>
            </div>
          </div>
        </div>

        {/* Championship Distribution */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Championship Distribution</h3>
          <div className="space-y-3">
            {analytics.championshipDistribution.map((champion, index) => (
              <div key={champion.manager} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-lg font-semibold text-gray-500">#{index + 1}</div>
                  <div>
                    <div className="font-semibold text-hockey-primary">{champion.manager}</div>
                    <div className="text-sm text-gray-600">
                      Championships: {champion.years.join(', ')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-hockey-secondary">{champion.championships}</div>
                  <div className="text-sm text-gray-600">
                    {champion.championships === 1 ? 'title' : 'titles'}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Championship Notes */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <h4 className="font-semibold text-blue-900 mb-2">Championship Notes</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>2013:</strong> Championship ended in a tie, decided by regular season head-to-head record (Dave)</p>
              <p>• <strong>2014:</strong> Championship ended in a tie, decided by regular season head-to-head record (Dave)</p>
            </div>
          </div>
        </div>

        {/* Era Analysis */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Era Analysis</h3>
          {eras.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {eras.map(era => (
              <div key={era.name} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-lg text-hockey-primary mb-2">{era.name}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seasons:</span>
                    <span className="font-medium text-blue-600">{era.seasons}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dominant Manager:</span>
                    <span className="font-medium text-blue-600">{era.dominantManager}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Championships:</span>
                    <span className="font-medium text-blue-600">{era.championships}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Different Champions:</span>
                    <span className="font-medium text-blue-600">{era.allChampions}</span>
                  </div>
                </div>
              </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No era data available</p>
            </div>
          )}
        </div>

        {/* Best Average Finishes */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Best Average Finishes (3+ Seasons)</h3>
          <div className="overflow-x-auto">
            <table className="table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Rank</th>
                  <th className="table-header">Manager</th>
                  <th className="table-header">Average Finish</th>
                  <th className="table-header">Seasons Played</th>
                  <th className="table-header">Consistency</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.averageFinishRankings.map((manager, index) => (
                  <tr key={manager.manager} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="table-cell font-semibold text-hockey-primary">#{index + 1}</td>
                    <td className="table-cell font-semibold">{manager.manager}</td>
                    <td className="table-cell text-center font-bold text-green-600">
                      {manager.averageFinish.toFixed(1)}
                    </td>
                    <td className="table-cell text-center">{manager.seasons}</td>
                    <td className="table-cell text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        manager.averageFinish <= 3 ? 'bg-green-100 text-green-800' :
                        manager.averageFinish <= 4 || manager.manager === 'Gwendi' || manager.manager === 'Vin' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {manager.averageFinish <= 3 ? 'Elite' :
                         manager.averageFinish <= 4 || manager.manager === 'Gwendi' || manager.manager === 'Vin' ? 'Strong' : 'Inconsistent'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Most Dominant Regular Seasons */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Most Dominant Regular Seasons</h3>
          <div className="overflow-x-auto">
            <table className="table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Rank</th>
                  <th className="table-header">Year</th>
                  <th className="table-header">Manager</th>
                  <th className="table-header">Record</th>
                  <th className="table-header">Regular Season Position</th>
                  <th className="table-header">Won Championship</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.mostDominantSeasons.map((season, index) => (
                  <tr key={`${season.year}-${season.manager}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="table-cell font-semibold text-hockey-primary">#{index + 1}</td>
                    <td className="table-cell font-semibold">{season.year}</td>
                    <td className="table-cell font-semibold">{season.manager}</td>
                    <td className="table-cell text-center font-bold text-green-600">{season.record}</td>
                    <td className="table-cell text-center">{season.position}</td>
                    <td className="table-cell text-center">
                      {season.isChampion ? '🏆' : '❌'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Worst Championship Records */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Worst Regular Season Records to Win Championship</h3>
          <div className="overflow-x-auto">
            <table className="table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Rank</th>
                  <th className="table-header">Year</th>
                  <th className="table-header">Manager</th>
                  <th className="table-header">Record</th>
                  <th className="table-header">Regular Season Position</th>
                  <th className="table-header">Cinderella Story</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.worstChampionRecords.map((champion, index) => {
                  const isWorstRecord = (champion.record === '9-11-1' && champion.manager === 'Sammy') || 
                                       (champion.record === '9-11-0' && champion.manager === 'Colon');
                  
                  return (
                    <tr key={`${champion.year}-${champion.manager}`} className={
                      isWorstRecord ? 'bg-red-50 border-l-4 border-red-500' :
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }>
                      <td className="table-cell font-semibold text-hockey-primary">#{index + 1}</td>
                      <td className="table-cell font-semibold">{champion.year}</td>
                      <td className="table-cell font-semibold">{champion.manager}</td>
                      <td className={`table-cell text-center font-bold ${isWorstRecord ? 'text-red-800' : 'text-red-600'}`}>
                        {champion.record}
                        {isWorstRecord && <span className="ml-2 text-xs bg-red-600 text-white px-2 py-1 rounded">WORST EVER</span>}
                      </td>
                      <td className="table-cell text-center">{champion.position}</td>
                      <td className="table-cell text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          champion.position > 4 ? 'bg-red-100 text-red-800' :
                          champion.position > 2 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {champion.position > 4 ? 'Major Upset' :
                           champion.position > 2 ? 'Upset' : 'Expected'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}