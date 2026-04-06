import React, { useMemo } from 'react';
import Layout, { formatSeason } from '@/components/Layout';
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
        dominantManager: era.name === 'Modern Era' ? 'TBD' : (dominantManager ? dominantManager[0] : 'None'),
        championships: era.name === 'Modern Era' ? 0 : (dominantManager ? dominantManager[1] : 0),
        allChampions: Object.keys(championCounts).length
      };
    });
  }, [seasons]);

  return (
    <Layout title="League Analytics - Fantasy Hockey Dashboard">
      <div className="space-y-8">
        {/* Header */}
        <div className="card">
          <h2 className="text-2xl font-semibold text-slate-100 mb-4">League Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-hockey-secondary" />
              <div className="text-3xl font-semibold text-slate-100">{analytics.totalSeasons}</div>
              <div className="text-sm text-slate-400">Total Seasons</div>
            </div>
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-hockey-secondary" />
              <div className="text-3xl font-semibold text-slate-100">{analytics.totalManagers}</div>
              <div className="text-sm text-slate-400">Total Managers</div>
            </div>
            <div className="text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-hockey-secondary" />
              <div className="text-3xl font-semibold text-slate-100">
                {analytics.championshipDistribution.length}
              </div>
              <div className="text-sm text-slate-400">Different Champions</div>
            </div>
            <div className="text-center">
              <Award className="h-8 w-8 mx-auto mb-2 text-hockey-secondary" />
              <div className="text-3xl font-semibold text-slate-100">
                {Math.max(...analytics.championshipDistribution.map(c => c.championships))}
              </div>
              <div className="text-sm text-slate-400">Most Championships</div>
            </div>
          </div>
        </div>

        {/* Championship Distribution */}
        <div className="card">
          <h3 className="text-xl font-semibold text-slate-100 mb-4">Championship Distribution</h3>
          <div className="space-y-3">
            {analytics.championshipDistribution.map((champion, index) => (
              <div key={champion.manager} className="flex items-center justify-between p-4 bg-hockey-primary/50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-lg font-semibold text-slate-400">#{index + 1}</div>
                  <div>
                    <div className="font-semibold text-slate-100">{champion.manager}</div>
                    <div className="text-sm text-slate-400">
                      Championships: {champion.years.map(y => formatSeason(y)).join(', ')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold text-slate-100">{champion.championships}</div>
                  <div className="text-sm text-slate-400">
                    {champion.championships === 1 ? 'title' : 'titles'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Championship Notes */}
          <div className="mt-6 p-4 bg-hockey-primary/50 rounded-lg border border-hockey-border">
            <h4 className="font-semibold text-slate-100 mb-2">Championship Notes</h4>
            <div className="text-sm text-slate-300 space-y-1">
              <p>• <strong>2013-14:</strong> Championship ended in a tie, decided by regular season head-to-head record (Dave)</p>
              <p>• <strong>2014-15:</strong> Championship ended in a tie, decided by regular season head-to-head record (Dave)</p>
            </div>
          </div>
        </div>

        {/* Era Analysis */}
        <div className="card">
          <h3 className="text-xl font-semibold text-slate-100 mb-4">Era Analysis</h3>
          {eras.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {eras.map(era => (
              <div key={era.name} className="bg-hockey-primary/50 border border-hockey-border p-4 rounded-lg">
                <h4 className="font-semibold text-lg text-slate-100 mb-2">{era.name}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Seasons:</span>
                    <span className="font-medium text-slate-100">{era.seasons}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dominant Manager:</span>
                    <span className="font-medium text-slate-100">{era.dominantManager}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Championships:</span>
                    <span className="font-medium text-slate-100">{era.championships}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Different Champions:</span>
                    <span className="font-medium text-slate-100">{era.allChampions}</span>
                  </div>
                </div>
              </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400">No era data available</p>
            </div>
          )}
        </div>

        {/* Best Average Finishes */}
        <div className="card">
          <h3 className="text-xl font-semibold text-slate-100 mb-4">Best Average Finishes (3+ Seasons)</h3>
          <div className="overflow-x-auto">
            <table className="table-auto">
              <thead className="bg-hockey-primary/50">
                <tr>
                  <th className="table-header">Rank</th>
                  <th className="table-header">Manager</th>
                  <th className="table-header">Average Finish</th>
                  <th className="table-header">Seasons Played</th>
                  <th className="table-header">Consistency</th>
                </tr>
              </thead>
              <tbody className="bg-hockey-surface divide-y divide-hockey-border">
                {analytics.averageFinishRankings.map((manager, index) => (
                  <tr key={manager.manager} className={index % 2 === 0 ? 'bg-hockey-surface' : 'bg-hockey-primary/50'}>
                    <td className="table-cell font-semibold text-slate-100">#{index + 1}</td>
                    <td className="table-cell font-semibold">{manager.manager}</td>
                    <td className="table-cell text-center font-semibold text-slate-100">
                      {manager.averageFinish.toFixed(1)}
                    </td>
                    <td className="table-cell text-center">{manager.seasons}</td>
                    <td className="table-cell text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        manager.averageFinish <= 3
                          ? 'bg-green-900/30 text-green-400 border-green-800'
                          : (manager.averageFinish <= 4 || manager.manager === 'Gwendi' || manager.manager === 'Vin')
                          ? 'bg-blue-900/30 text-blue-400 border-blue-800'
                          : 'bg-amber-900/30 text-amber-400 border-amber-800'
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
          <h3 className="text-xl font-semibold text-slate-100 mb-4">Most Dominant Regular Seasons</h3>
          <div className="overflow-x-auto">
            <table className="table-auto">
              <thead className="bg-hockey-primary/50">
                <tr>
                  <th className="table-header">Rank</th>
                  <th className="table-header">Year</th>
                  <th className="table-header">Manager</th>
                  <th className="table-header">Record</th>
                  <th className="table-header">Regular Season Position</th>
                  <th className="table-header">Won Championship</th>
                </tr>
              </thead>
              <tbody className="bg-hockey-surface divide-y divide-hockey-border">
                {analytics.mostDominantSeasons.map((season, index) => (
                  <tr key={`${season.year}-${season.manager}`} className={index % 2 === 0 ? 'bg-hockey-surface' : 'bg-hockey-primary/50'}>
                    <td className="table-cell font-semibold text-slate-100">#{index + 1}</td>
                    <td className="table-cell font-semibold">{formatSeason(season.year)}</td>
                    <td className="table-cell font-semibold">{season.manager}</td>
                    <td className="table-cell text-center font-semibold text-slate-100">{season.record}</td>
                    <td className="table-cell text-center">{season.position}</td>
                    <td className="table-cell text-center">
                      {season.isChampion ? 'Yes' : 'No'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cinderella Stories */}
        <div className="card">
          <h3 className="text-xl font-semibold text-slate-100 mb-4">Cinderella Stories</h3>
          <div className="overflow-x-auto">
            <table className="table-auto">
              <thead className="bg-hockey-primary/50">
                <tr>
                  <th className="table-header">Rank</th>
                  <th className="table-header">Year</th>
                  <th className="table-header">Manager</th>
                  <th className="table-header">Record</th>
                  <th className="table-header">Cinderella Story</th>
                </tr>
              </thead>
              <tbody className="bg-hockey-surface divide-y divide-hockey-border">
                {analytics.worstChampionRecords.map((champion, index) => {
                  const isWorstRecord = (champion.record === '9-11-1' && champion.manager === 'Sammy') ||
                                       (champion.record === '9-11-0' && champion.manager === 'Colon');

                  // Custom cinderella stories
                  let cinderellaStory = '';
                  if (champion.manager === 'Colon') {
                    cinderellaStory = 'Expected, Colon scored the most points out of any team in every round of the playoffs';
                  } else if (champion.manager === 'Sammy') {
                    cinderellaStory = "Unexpected, but dominant. Sammy's team snuck in to the playoffs and had some luck involved in the semifinals, faced the lowest scoring teams in each of the 3 rounds, but had dominant performances from key players";
                  } else if (champion.manager === 'Dave') {
                    cinderellaStory = 'True cinderella story: Dave finished nearly .500 entering the playoffs, but was the highest scoring team in 2/3 rounds';
                  } else {
                    cinderellaStory = champion.position > 4 ? 'Major Upset' :
                                     champion.position > 2 ? 'Upset' : 'Expected';
                  }

                  return (
                    <tr key={`${champion.year}-${champion.manager}`} className={
                      isWorstRecord ? 'bg-hockey-primary/50 border-l-4 border-hockey-border' :
                      index % 2 === 0 ? 'bg-hockey-surface' : 'bg-hockey-primary/50'
                    }>
                      <td className="table-cell font-semibold text-slate-100">#{index + 1}</td>
                      <td className="table-cell font-semibold">{formatSeason(champion.year)}</td>
                      <td className="table-cell font-semibold">{champion.manager}</td>
                      <td className={`table-cell text-center font-semibold ${isWorstRecord ? 'text-slate-100' : 'text-slate-200'}`}>
                        {champion.record}
                        {isWorstRecord && <span className="ml-2 text-xs bg-hockey-primary text-slate-300 border border-hockey-border px-2 py-1 rounded">WORST EVER</span>}
                      </td>
                      <td className="table-cell text-sm max-w-xs text-slate-300">
                        {cinderellaStory}
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
