import React, { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { SeasonData } from '@/data/parser';
import hockeyData from '@/data/hockey-data.json';
import { Trophy, TrendingUp, Users, Calendar, Zap, Target, Clock, BarChart3 } from 'lucide-react';

interface ChampionshipTimelineItem {
  year: number;
  champion: string;
  team: string;
  regularSeasonRecord: string;
  playoffRecord: string;
  isDynasty: boolean;
  note?: string;
}

interface DroughtInfo {
  manager: string;
  currentDrought: number;
  longestDrought: number;
  totalChampionships: number;
  lastChampionship?: number;
  isActive: boolean;
}

export default function Visualizations() {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedManager1, setSelectedManager1] = useState<string>('');
  const [selectedManager2, setSelectedManager2] = useState<string>('');
  const [selectedBracketYear, setSelectedBracketYear] = useState<number>(2024);
  
  const seasons = hockeyData.seasons as SeasonData[];
  const managerStats = hockeyData.managerStats;
  
  const allManagers = Array.from(new Set(
    seasons.flatMap(s => s.managers.map(m => m.manager))
  )).sort();
  
  // Get only 2024 managers for drought tracker
  const current2024Managers = seasons
    .find(s => s.year === 2024)?.managers
    .map(m => m.manager) || [];

  // Championship Timeline Data
  const championshipTimeline = useMemo((): ChampionshipTimelineItem[] => {
    const timeline = seasons
      .filter(s => s.managers.length > 0)
      .map(season => {
        const champion = season.managers.find(m => m.isChampion);
        if (!champion) return null;
        
        return {
          year: season.year,
          champion: champion.manager,
          team: champion.team,
          regularSeasonRecord: champion.regularSeasonRecord,
          playoffRecord: champion.playoffRecord,
          isDynasty: false,
          note: season.year === 2013 || season.year === 2014 ? 'Decided by regular season head-to-head' : undefined
        };
      })
      .filter(Boolean) as ChampionshipTimelineItem[];

    // Mark dynasty periods (3+ consecutive championships)
    for (let i = 0; i < timeline.length - 2; i++) {
      if (timeline[i].champion === timeline[i+1].champion && 
          timeline[i+1].champion === timeline[i+2].champion) {
        timeline[i].isDynasty = true;
        timeline[i+1].isDynasty = true;
        timeline[i+2].isDynasty = true;
      }
    }

    return timeline;
  }, [seasons]);

  // Championship Drought Tracker
  const droughtTracker = useMemo((): DroughtInfo[] => {
    const currentYear = 2024;
    const championshipYears = championshipTimeline.reduce((acc, item) => {
      if (!acc[item.champion]) acc[item.champion] = [];
      acc[item.champion].push(item.year);
      return acc;
    }, {} as Record<string, number[]>);

    return current2024Managers.map(manager => {
      const championships = championshipYears[manager] || [];
      const totalChampionships = championships.length;
      const lastChampionship = championships.length > 0 ? Math.max(...championships) : undefined;
      const currentDrought = lastChampionship ? currentYear - lastChampionship : currentYear - 2011;
      
      // Calculate longest drought between championships
      let longestDrought = 0;
      if (championships.length > 1) {
        const sortedChampionships = championships.sort((a, b) => a - b);
        for (let i = 1; i < sortedChampionships.length; i++) {
          const drought = sortedChampionships[i] - sortedChampionships[i-1] - 1;
          longestDrought = Math.max(longestDrought, drought);
        }
      }

      return {
        manager,
        currentDrought,
        longestDrought: Math.max(longestDrought, currentDrought),
        totalChampionships,
        lastChampionship,
        isActive: totalChampionships > 0
      };
    }).sort((a, b) => {
      if (a.totalChampionships !== b.totalChampionships) {
        return b.totalChampionships - a.totalChampionships;
      }
      return b.currentDrought - a.currentDrought;
    });
  }, [championshipTimeline, current2024Managers]);

  // Playoff Rivalry Network Data
  const playoffRivalries = useMemo(() => {
    const rivalries = new Map<string, {
      manager1: string;
      manager2: string;
      meetings: number;
      manager1Wins: number;
      manager2Wins: number;
      matchups: string[];
    }>();

    seasons.forEach(season => {
      if (season.playoffResults) {
        const allPlayoffRounds = [
          ...(season.playoffResults.quarterfinals || []),
          ...(season.playoffResults.semifinals || []),
          ...(season.playoffResults.finals ? [season.playoffResults.finals] : []),
          ...(season.playoffResults.thirdPlace ? [season.playoffResults.thirdPlace] : []),
          ...(season.playoffResults.fifthPlace ? [season.playoffResults.fifthPlace] : [])
        ];

        allPlayoffRounds.forEach(matchup => {
          if (typeof matchup === 'string' && matchup.includes(' def. ')) {
            const cleanMatchup = matchup.replace(/\*\*/g, '');
            const parts = cleanMatchup.split(' def. ');
            if (parts.length === 2) {
              const winner = parts[0].split(' (')[0].trim();
              const loser = parts[1].split(' (')[0].trim();
              const key = winner < loser ? `${winner}-${loser}` : `${loser}-${winner}`;
              
              if (!rivalries.has(key)) {
                rivalries.set(key, {
                  manager1: winner < loser ? winner : loser,
                  manager2: winner < loser ? loser : winner,
                  meetings: 0,
                  manager1Wins: 0,
                  manager2Wins: 0,
                  matchups: []
                });
              }
              
              const rivalry = rivalries.get(key)!;
              rivalry.meetings++;
              
              if (rivalry.manager1 === winner) {
                rivalry.manager1Wins++;
              } else {
                rivalry.manager2Wins++;
              }
              
              rivalry.matchups.push(`${season.year}: ${winner} def. ${loser}`);
            }
          }
        });
      }
    });

    return Array.from(rivalries.values())
      .filter(r => r.meetings > 0)
      .sort((a, b) => b.meetings - a.meetings);
  }, [seasons]);

  // Manager Performance Radar Data
  const radarData = useMemo(() => {
    return managerStats.map(manager => {
      const championships = manager.championships;
      const playoffSuccessRate = manager.playoffAppearances / manager.totalSeasons;
      const regularSeasonWinPct = manager.regularSeasonRecord.wins / 
        (manager.regularSeasonRecord.wins + manager.regularSeasonRecord.losses);
      const consistency = 5 - Math.min(4, manager.averageFinish); // Invert so higher is better
      const longevity = Math.min(5, manager.totalSeasons / 2); // Scale to 5

      return {
        manager: manager.manager,
        championships,
        playoffSuccess: playoffSuccessRate * 5, // Scale to 5
        regularSeasonWinPct: regularSeasonWinPct * 5, // Scale to 5
        consistency,
        longevity
      };
    });
  }, [managerStats]);

  const selectedRadarData = radarData.filter(d => 
    d.manager === selectedManager1 || d.manager === selectedManager2
  );

  // Interactive Playoff Bracket Data
  const bracketData = useMemo(() => {
    const season = seasons.find(s => s.year === selectedBracketYear);
    if (!season || !season.playoffResults) return null;
    
    return {
      year: selectedBracketYear,
      quarterfinals: season.playoffResults.quarterfinals || [],
      semifinals: season.playoffResults.semifinals || [],
      finals: season.playoffResults.finals || '',
      thirdPlace: season.playoffResults.thirdPlace || '',
      fifthPlace: season.playoffResults.fifthPlace || '',
      seventhPlace: season.playoffResults.seventhPlace || '',
      ninthPlace: season.playoffResults.ninthPlace || ''
    };
  }, [selectedBracketYear, seasons]);

  // Manager Consistency Heatmap Data
  const consistencyHeatmap = useMemo(() => {
    const managers = managerStats.filter(m => m.totalSeasons >= 5 && m.manager !== 'unknown');
    const years = Array.from({length: 14}, (_, i) => 2011 + i).filter(y => y !== 2016 && y !== 2019);
    
    return managers.map(manager => {
      const managerData = years.map(year => {
        const seasonData = seasons.find(s => s.year === year);
        const managerSeason = seasonData?.managers.find(m => m.manager === manager.manager);
        return {
          year,
          position: managerSeason?.finalPosition || null,
          participated: !!managerSeason
        };
      });
      
      return {
        manager: manager.manager,
        data: managerData
      };
    });
  }, [managerStats, seasons]);

  // Era Dominance Stacked Bar Data
  const eraDominanceData = useMemo(() => {
    const eras = [
      { name: 'Early Era', years: [2011, 2012, 2013, 2014, 2015, 2017], color: 'bg-blue-500' },
      { name: 'Middle/Covid Era', years: [2018, 2020, 2021, 2022], color: 'bg-yellow-500' },
      { name: 'Modern Era', years: [2023, 2024], color: 'bg-green-500' }
    ];

    return eras.map(era => {
      const eraSeasons = seasons.filter(s => era.years.includes(s.year) && s.managers.length > 0);
      const champions = eraSeasons.map(s => s.managers.find(m => m.isChampion)?.manager).filter(Boolean);
      
      const championCounts = champions.reduce((acc, champion) => {
        acc[champion!] = (acc[champion!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        ...era,
        totalSeasons: eraSeasons.length,
        champions: championCounts
      };
    });
  }, [seasons]);

  // Regular Season vs Playoff Performance Scatter Plot
  const scatterPlotData = useMemo(() => {
    return managerStats
      .filter(m => m.totalSeasons >= 5)
      .map(manager => {
        const regularSeasonWinPct = manager.regularSeasonRecord.wins / 
          (manager.regularSeasonRecord.wins + manager.regularSeasonRecord.losses);
        const playoffSuccessRate = manager.playoffAppearances / manager.totalSeasons;
        
        return {
          manager: manager.manager,
          regularSeasonWinPct: regularSeasonWinPct * 100,
          playoffSuccessRate: playoffSuccessRate * 100,
          championships: manager.championships,
          totalSeasons: manager.totalSeasons
        };
      });
  }, [managerStats]);

  // Helper function to format matchups with bold winners
  const formatMatchupWithBoldWinner = (matchup: string) => {
    // Handle already formatted finals (with ** around winner)
    if (matchup.includes('**')) {
      return matchup.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }
    
    // Handle regular matchups with "def." pattern
    if (matchup.includes(' def. ')) {
      const parts = matchup.split(' def. ');
      if (parts.length === 2) {
        const winner = parts[0].trim();
        const loser = parts[1].trim();
        return `<strong>${winner}</strong> def. ${loser}`;
      }
    }
    
    return matchup;
  };

  return (
    <Layout title="League Visualizations - Fantasy Hockey Dashboard">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="card">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">League Visualizations</h2>
          <p className="text-gray-600">Interactive charts and insights into league history and performance</p>
        </div>

        {/* Championship Timeline */}
        <div className="card">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <Trophy className="h-8 w-8 mr-3 text-hockey-accent" />
            Championship Timeline
          </h3>
          
          <div className="relative">
            {/* Timeline */}
            <div className="flex items-center justify-between mb-8 relative">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-300"></div>
              {championshipTimeline.map((item, index) => (
                <div key={item.year} className="relative flex flex-col items-center">
                  <div 
                    className={`w-8 h-8 rounded-full border-4 cursor-pointer transition-all ${
                      item.isDynasty 
                        ? 'bg-hockey-accent border-hockey-accent shadow-lg' 
                        : 'bg-hockey-primary border-hockey-primary'
                    } ${selectedYear === item.year ? 'ring-4 ring-blue-300' : ''}`}
                    onClick={() => setSelectedYear(selectedYear === item.year ? null : item.year)}
                  />
                  <div className="mt-2 text-xs font-medium text-gray-700">{item.year}</div>
                  <div className="text-xs text-gray-500 text-center max-w-16 truncate">{item.champion}</div>
                  {item.isDynasty && (
                    <div className="absolute -top-8 bg-hockey-accent text-white px-2 py-1 rounded text-xs">
                      Dynasty
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Selected Year Details */}
            {selectedYear && (
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-400">
                {(() => {
                  const yearData = championshipTimeline.find(item => item.year === selectedYear);
                  if (!yearData) return null;
                  
                  return (
                    <div>
                      <h4 className="text-xl font-semibold text-blue-900 mb-4">
                        {yearData.year} Champion: {yearData.champion}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <span className="text-sm text-blue-700">Team Name:</span>
                          <div className="font-medium text-blue-900">{yearData.team}</div>
                        </div>
                        <div>
                          <span className="text-sm text-blue-700">Regular Season:</span>
                          <div className="font-medium text-blue-900">{yearData.regularSeasonRecord}</div>
                        </div>
                        <div>
                          <span className="text-sm text-blue-700">Playoff Record:</span>
                          <div className="font-medium text-blue-900">{yearData.playoffRecord}</div>
                        </div>
                      </div>
                      {yearData.note && (
                        <div className="mt-4 p-3 bg-blue-100 rounded-md">
                          <span className="text-sm font-medium text-blue-800">Note: {yearData.note}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Championship Drought Tracker */}
        <div className="card">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <Clock className="h-8 w-8 mr-3 text-red-500" />
            Championship Drought Tracker
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {droughtTracker.map((drought, index) => (
              <div key={drought.manager} className={`p-4 rounded-lg border-2 ${
                drought.currentDrought >= 8 ? 'border-red-400 bg-red-50' :
                drought.currentDrought >= 5 ? 'border-yellow-400 bg-yellow-50' :
                'border-green-400 bg-green-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{drought.manager}</h4>
                  <div className="text-2xl">
                    {drought.currentDrought >= 8 ? '🔥' : 
                     drought.currentDrought >= 5 ? '⚠️' : 
                     drought.totalChampionships > 0 ? '✅' : '❄️'}
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Drought:</span>
                    <span className={`font-medium ${
                      drought.currentDrought >= 8 ? 'text-red-600' :
                      drought.currentDrought >= 5 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>{drought.currentDrought} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Championships:</span>
                    <span className="font-medium text-blue-600">{drought.totalChampionships}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Title:</span>
                    <span className="font-medium text-gray-700">
                      {drought.lastChampionship || 'Never'}
                    </span>
                  </div>
                  {drought.manager === 'Al' && drought.totalChampionships === 0 && (
                    <div className="mt-2 p-2 bg-red-100 rounded text-red-700 text-xs">
                      🔥 HOT SEAT! Due for championship
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Playoff Rivalry Network */}
        <div className="card">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <Users className="h-8 w-8 mr-3 text-purple-500" />
            Playoff Rivalry Network
          </h3>
          
          <div className="space-y-4">
            {playoffRivalries.slice(0, 8).map((rivalry, index) => (
              <div key={`${rivalry.manager1}-${rivalry.manager2}`} 
                   className="bg-gray-50 p-4 rounded-lg border-l-4 border-purple-400">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {rivalry.manager1} vs {rivalry.manager2}
                  </h4>
                  <div className="text-2xl font-bold text-purple-600">
                    {rivalry.meetings}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex space-x-6">
                    <div>
                      <span className="text-gray-600">{rivalry.manager1}: </span>
                      <span className="font-medium text-green-600">{rivalry.manager1Wins} wins</span>
                    </div>
                    <div>
                      <span className="text-gray-600">{rivalry.manager2}: </span>
                      <span className="font-medium text-red-600">{rivalry.manager2Wins} wins</span>
                    </div>
                  </div>
                  <div className="text-gray-500">
                    {rivalry.meetings} meeting{rivalry.meetings !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="bg-green-500" 
                      style={{ width: `${(rivalry.manager1Wins / rivalry.meetings) * 100}%` }}
                    />
                    <div 
                      className="bg-red-500" 
                      style={{ width: `${(rivalry.manager2Wins / rivalry.meetings) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manager Performance Radar */}
        <div className="card">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <BarChart3 className="h-8 w-8 mr-3 text-green-500" />
            Manager Performance Comparison
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager 1:
              </label>
              <select
                value={selectedManager1}
                onChange={(e) => setSelectedManager1(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-blue-600"
              >
                <option value="" className="text-blue-600">-- Select Manager 1 --</option>
                {allManagers.map(manager => (
                  <option key={manager} value={manager} className="text-blue-600">{manager}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager 2:
              </label>
              <select
                value={selectedManager2}
                onChange={(e) => setSelectedManager2(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-blue-600"
              >
                <option value="" className="text-blue-600">-- Select Manager 2 --</option>
                {allManagers.filter(m => m !== selectedManager1).map(manager => (
                  <option key={manager} value={manager} className="text-blue-600">{manager}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedRadarData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {selectedRadarData.map((manager, index) => (
                <div key={manager.manager} className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">{manager.manager}</h4>
                  
                  {/* Key Stats Summary */}
                  <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-white rounded-lg border">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {managerStats.find(m => m.manager === manager.manager)?.totalSeasons || 0}
                      </div>
                      <div className="text-xs text-gray-600">Total Seasons</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {managerStats.find(m => m.manager === manager.manager)?.runnerUps || 0}
                      </div>
                      <div className="text-xs text-gray-600">Runner-ups</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {managerStats.find(m => m.manager === manager.manager)?.playoffAppearances || 0}
                      </div>
                      <div className="text-xs text-gray-600">Playoff Apps</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {(managerStats.find(m => m.manager === manager.manager)?.averageFinish || 0).toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-600">Avg Finish</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Championships:</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (manager.championships / 5) * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{manager.championships}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Playoff Success:</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${(manager.playoffSuccess / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{(manager.playoffSuccess / 5 * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Regular Season Win%:</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{ width: `${(manager.regularSeasonWinPct / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{(manager.regularSeasonWinPct / 5 * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Consistency:</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-yellow-500 h-2 rounded-full" 
                            style={{ width: `${(manager.consistency / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{manager.consistency.toFixed(1)}/5</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Longevity:</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ width: `${(manager.longevity / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{manager.longevity.toFixed(1)}/5</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interactive Playoff Bracket Viewer */}
        <div className="card">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <Target className="h-8 w-8 mr-3 text-orange-500" />
            Interactive Playoff Bracket Viewer
          </h3>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Year:
            </label>
            <select
              value={selectedBracketYear}
              onChange={(e) => setSelectedBracketYear(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-blue-600"
            >
              {seasons.filter(s => s.playoffResults && s.managers.length > 0).map(season => (
                <option key={season.year} value={season.year} className="text-blue-600">{season.year}</option>
              ))}
            </select>
          </div>

          {bracketData && (
            <div className="space-y-6">
              <div className="text-center">
                <h4 className="text-xl font-semibold text-gray-900 mb-4">{bracketData.year} Playoff Bracket</h4>
              </div>
              
              {/* Finals */}
              {bracketData.finals && (
                <div className="text-center">
                  <h5 className="text-lg font-semibold text-orange-600 mb-2">Championship</h5>
                  <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200 max-w-md mx-auto">
                    <div className="font-medium text-orange-900" dangerouslySetInnerHTML={{ __html: formatMatchupWithBoldWinner(bracketData.finals) }}></div>
                  </div>
                </div>
              )}

              {/* Semifinals */}
              {bracketData.semifinals.length > 0 && (
                <div className="text-center">
                  <h5 className="text-lg font-semibold text-blue-600 mb-2">Semifinals</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                    {bracketData.semifinals.map((matchup, index) => (
                      <div key={index} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="text-sm font-medium text-blue-900" dangerouslySetInnerHTML={{ __html: formatMatchupWithBoldWinner(matchup) }}></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quarterfinals */}
              {bracketData.quarterfinals.length > 0 && (
                <div className="text-center">
                  <h5 className="text-lg font-semibold text-green-600 mb-2">Quarterfinals</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 max-w-6xl mx-auto">
                    {bracketData.quarterfinals.map((matchup, index) => (
                      <div key={index} className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="text-sm font-medium text-green-900" dangerouslySetInnerHTML={{ __html: formatMatchupWithBoldWinner(matchup) }}></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Placement Games */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                {bracketData.thirdPlace && (
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <div className="text-sm font-medium text-yellow-700 mb-1">3rd Place</div>
                    <div className="text-sm text-yellow-900" dangerouslySetInnerHTML={{ __html: formatMatchupWithBoldWinner(bracketData.thirdPlace) }}></div>
                  </div>
                )}
                {bracketData.fifthPlace && (
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-1">5th Place</div>
                    <div className="text-sm text-gray-900" dangerouslySetInnerHTML={{ __html: formatMatchupWithBoldWinner(bracketData.fifthPlace) }}></div>
                  </div>
                )}
                {bracketData.seventhPlace && (
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-1">7th Place</div>
                    <div className="text-sm text-gray-900" dangerouslySetInnerHTML={{ __html: formatMatchupWithBoldWinner(bracketData.seventhPlace) }}></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Manager Consistency Map */}
        <div className="card">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <Calendar className="h-8 w-8 mr-3 text-red-500" />
            Manager Performance Over Time
          </h3>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-lg font-semibold text-blue-900 mb-2">What this shows:</h4>
            <p className="text-sm text-blue-800">
              This chart displays each manager's finishing position across all seasons they participated in. 
              Green indicates championship wins, blue shows runner-up finishes, and warmer colors represent lower finishes.
              Missing years (2016, 2019) were cancelled seasons.
            </p>
          </div>
          
          <div className="space-y-4">
            {consistencyHeatmap.map(manager => (
              <div key={manager.manager} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">{manager.manager}</h4>
                  <div className="text-sm text-gray-600">
                    {manager.data.filter(d => d.participated).length} seasons played
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {manager.data.map((yearData, index) => (
                    <div key={index} className="text-center">
                      <div className="text-xs font-medium text-gray-600 mb-1">{yearData.year}</div>
                      {yearData.participated ? (
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold border-2 ${
                          yearData.position === 1 ? 'bg-green-500 text-white border-green-600 shadow-lg' :
                          yearData.position === 2 ? 'bg-blue-500 text-white border-blue-600' :
                          yearData.position === 3 ? 'bg-yellow-500 text-white border-yellow-600' :
                          yearData.position === 4 ? 'bg-orange-500 text-white border-orange-600' :
                          yearData.position && yearData.position <= 6 ? 'bg-red-400 text-white border-red-500' :
                          'bg-red-600 text-white border-red-700'
                        }`}>
                          {yearData.position === 1 ? '🏆' : yearData.position}
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-500 border-2 border-gray-400">
                          --
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Manager Summary */}
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                    <span>
                      <strong>Championships:</strong> {manager.data.filter(d => d.position === 1).length}
                    </span>
                    <span>
                      <strong>Runner-ups:</strong> {manager.data.filter(d => d.position === 2).length}
                    </span>
                    <span>
                      <strong>Avg Finish:</strong> {manager.data.filter(d => d.participated).length > 0 ? 
                        (manager.data.filter(d => d.participated).reduce((sum, d) => sum + (d.position || 0), 0) / 
                         manager.data.filter(d => d.participated).length).toFixed(1) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Legend:</h4>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold border-2 border-green-600">🏆</div>
                <span>Champion</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold border-2 border-blue-600">2</div>
                <span>Runner-up</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-white font-bold border-2 border-yellow-600">3</div>
                <span>3rd Place</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold border-2 border-orange-600">4</div>
                <span>4th Place</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-400 rounded-lg flex items-center justify-center text-white font-bold border-2 border-red-500">5</div>
                <span>5th-6th</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold border-2 border-red-700">7</div>
                <span>7th+</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-500 border-2 border-gray-400">--</div>
                <span>Did not play</span>
              </div>
            </div>
          </div>
        </div>

        {/* Era Dominance Stacked Bar Chart */}
        <div className="card">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="h-8 w-8 mr-3 text-indigo-500" />
            Era Dominance Analysis
          </h3>
          
          <div className="space-y-6">
            {eraDominanceData.map((era, index) => (
              <div key={era.name} className="bg-gray-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">{era.name} ({era.totalSeasons} seasons)</h4>
                
                <div className="space-y-3">
                  {Object.entries(era.champions)
                    .sort(([,a], [,b]) => b - a)
                    .map(([manager, championships]) => (
                      <div key={manager} className="flex items-center">
                        <div className="w-32 text-sm font-medium text-gray-900">{manager}</div>
                        <div className="flex-1 mx-4">
                          <div className="w-full bg-gray-200 rounded-full h-6">
                            <div 
                              className={`h-6 rounded-full flex items-center justify-center text-white text-sm font-medium ${era.color}`}
                              style={{ width: `${(championships / era.totalSeasons) * 100}%` }}
                            >
                              {championships}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {((championships / era.totalSeasons) * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regular Season vs Playoff Performance Scatter Plot */}
        <div className="card">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <Zap className="h-8 w-8 mr-3 text-pink-500" />
            Regular Season vs Playoff Performance
          </h3>
          
          <div className="relative">
            <div className="bg-gray-50 p-8 rounded-lg">
              <div className="relative h-80 w-full">
                {/* Axes */}
                <div className="absolute bottom-0 left-0 w-full h-px bg-gray-400"></div>
                <div className="absolute bottom-0 left-0 w-px h-full bg-gray-400"></div>
                
                {/* Labels */}
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-sm text-gray-600">
                  Regular Season Win % →
                </div>
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -rotate-90 text-sm text-gray-600">
                  ← Playoff Success Rate %
                </div>
                
                {/* Quadrant Labels */}
                <div className="absolute top-4 left-4 text-xs text-gray-500 bg-white p-2 rounded border">
                  Poor Regular Season<br/>High Playoff Success
                </div>
                <div className="absolute top-4 right-4 text-xs text-gray-500 bg-white p-2 rounded border">
                  Good Regular Season<br/>High Playoff Success
                </div>
                <div className="absolute bottom-4 left-4 text-xs text-gray-500 bg-white p-2 rounded border">
                  Poor Regular Season<br/>Low Playoff Success
                </div>
                <div className="absolute bottom-4 right-4 text-xs text-gray-500 bg-white p-2 rounded border">
                  Good Regular Season<br/>Low Playoff Success
                </div>
                
                {/* Data Points with Labels */}
                {scatterPlotData.map((manager, index) => (
                  <div
                    key={manager.manager}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${Math.min(95, Math.max(5, (manager.regularSeasonWinPct - 30) * 2))}%`,
                      bottom: `${Math.min(95, Math.max(5, manager.playoffSuccessRate * 1.2))}%`
                    }}
                  >
                    {/* Data Point */}
                    <div
                      className={`rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform ${
                        manager.championships > 2 ? 'w-6 h-6 bg-green-500' :
                        manager.championships > 0 ? 'w-5 h-5 bg-blue-500' :
                        'w-4 h-4 bg-gray-400'
                      }`}
                      title={`${manager.manager}: ${manager.regularSeasonWinPct.toFixed(1)}% RS Win, ${manager.playoffSuccessRate.toFixed(1)}% Playoff Success, ${manager.championships} Championships`}
                    />
                    {/* Manager Name Label */}
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded shadow-sm border whitespace-nowrap">
                      {manager.manager}
                    </div>
                  </div>
                ))}
                
                {/* Reference Lines */}
                <div className="absolute left-1/2 top-0 w-px h-full bg-gray-300 opacity-50"></div>
                <div className="absolute bottom-1/2 left-0 w-full h-px bg-gray-300 opacity-50"></div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                <span>3+ Championships</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-blue-500 rounded-full border-2 border-white"></div>
                <span>1-2 Championships</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-400 rounded-full border-2 border-white"></div>
                <span>0 Championships</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}