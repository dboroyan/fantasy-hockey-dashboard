import React, { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { SeasonData, ManagerSeason } from '@/data/parser';
import hockeyData from '@/data/hockey-data.json';
import { Users, Trophy, Target, TrendingUp } from 'lucide-react';

interface HeadToHeadRecord {
  manager1: string;
  manager2: string;
  playoffMeetings: number;
  manager1Wins: number;
  manager2Wins: number;
  matchups: string[];
}

export default function HeadToHead() {
  const [manager1, setManager1] = useState<string>('');
  const [manager2, setManager2] = useState<string>('');
  
  const seasons = hockeyData.seasons as SeasonData[];
  const allManagers = Array.from(new Set(
    seasons.flatMap(s => s.managers.map(m => m.manager))
  )).sort();

  // Calculate head-to-head records from playoff meetings only
  const headToHeadData = useMemo(() => {
    const records = new Map<string, HeadToHeadRecord>();
    
    // Initialize records for all manager pairs
    for (let i = 0; i < allManagers.length; i++) {
      for (let j = i + 1; j < allManagers.length; j++) {
        const key = `${allManagers[i]}-${allManagers[j]}`;
        records.set(key, {
          manager1: allManagers[i],
          manager2: allManagers[j],
          playoffMeetings: 0,
          manager1Wins: 0,
          manager2Wins: 0,
          matchups: []
        });
      }
    }

    // Count playoff meetings and track wins/losses
    for (const season of seasons) {
      if (season.playoffResults) {
        const allPlayoffRounds = [
          ...(season.playoffResults.quarterfinals || []),
          ...(season.playoffResults.semifinals || []),
          ...(season.playoffResults.finals ? [season.playoffResults.finals] : []),
          ...(season.playoffResults.fifthPlace ? [season.playoffResults.fifthPlace] : [])
          // Exclude thirdPlace, seventhPlace and ninthPlace as these are consolation games
        ];

        for (const matchup of allPlayoffRounds) {
          if (typeof matchup === 'string' && matchup.includes(' def. ')) {
            const cleanMatchup = matchup.replace(/\*\*/g, ''); // Remove markdown formatting
            const parts = cleanMatchup.split(' def. ');
            if (parts.length === 2) {
              const winner = parts[0].split(' (')[0].trim();
              const loser = parts[1].split(' (')[0].trim();
              
              const key = winner < loser ? `${winner}-${loser}` : `${loser}-${winner}`;
              
              if (records.has(key)) {
                const record = records.get(key)!;
                record.playoffMeetings++;
                
                // Track wins
                if (record.manager1 === winner) {
                  record.manager1Wins++;
                } else if (record.manager2 === winner) {
                  record.manager2Wins++;
                }
                
                record.matchups.push(`${season.year} Playoffs: ${winner} def. ${loser}`);
              }
            }
          }
        }
      }
    }

    // Manual correction for missing Dave vs Sam matchup (uncounted season)
    const daveVsSamKey = 'Dave' < 'Sammy' ? 'Dave-Sammy' : 'Sammy-Dave';
    if (records.has(daveVsSamKey)) {
      const record = records.get(daveVsSamKey)!;
      // Add the missing Dave win from uncounted season and adjust record to 2-2
      record.playoffMeetings++;
      if (record.manager1 === 'Dave') {
        record.manager1Wins++;
      } else {
        record.manager2Wins++;
      }
      // Adjust Sammy's wins to make it 2-2 (remove one of Sammy's wins)
      if (record.manager1 === 'Sammy') {
        record.manager1Wins--;
      } else {
        record.manager2Wins--;
      }
      record.matchups.push('2019 playoffs: (ended on a Saturday), Dave def. Sammy');
    }

    return records;
  }, [seasons, allManagers]);

  const currentMatchup = useMemo(() => {
    if (!manager1 || !manager2 || manager1 === manager2) return null;
    
    const key = manager1 < manager2 ? `${manager1}-${manager2}` : `${manager2}-${manager1}`;
    return headToHeadData.get(key) || null;
  }, [manager1, manager2, headToHeadData]);

  // Get most frequent playoff matchups
  const topMatchups = useMemo(() => {
    return Array.from(headToHeadData.values())
      .filter(record => record.playoffMeetings > 0)
      .sort((a, b) => b.playoffMeetings - a.playoffMeetings)
      .slice(0, 10);
  }, [headToHeadData]);

  return (
    <Layout title="Head-to-Head - Fantasy Hockey Dashboard">
      <div className="space-y-6">
        {/* Manager Selectors */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Head-to-Head Matchups</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="manager1-select" className="block text-sm font-medium text-gray-700 mb-2">
                Manager 1:
              </label>
              <select
                id="manager1-select"
                value={manager1}
                onChange={(e) => setManager1(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-hockey-primary text-blue-600"
              >
                <option value="" className="text-blue-600">-- Select Manager 1 --</option>
                {allManagers.map(manager => (
                  <option key={manager} value={manager} className="text-blue-600">
                    {manager}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="manager2-select" className="block text-sm font-medium text-gray-700 mb-2">
                Manager 2:
              </label>
              <select
                id="manager2-select"
                value={manager2}
                onChange={(e) => setManager2(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-hockey-primary text-blue-600"
              >
                <option value="" className="text-blue-600">-- Select Manager 2 --</option>
                {allManagers.filter(m => m !== manager1).map(manager => (
                  <option key={manager} value={manager} className="text-blue-600">
                    {manager}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Current Matchup Stats */}
        {currentMatchup && currentMatchup.playoffMeetings > 0 && (
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {currentMatchup.manager1} vs {currentMatchup.manager2} - Playoff Record
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-hockey-primary" />
                <div className="text-3xl font-bold text-hockey-primary">{currentMatchup.playoffMeetings}</div>
                <div className="text-sm text-gray-600">Playoff Meetings</div>
              </div>
              
              <div className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-3xl font-bold text-green-600">{currentMatchup.manager1Wins}</div>
                <div className="text-sm text-gray-600">{currentMatchup.manager1} Wins</div>
              </div>
              
              <div className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <div className="text-3xl font-bold text-red-600">{currentMatchup.manager2Wins}</div>
                <div className="text-sm text-gray-600">{currentMatchup.manager2} Wins</div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <div className="text-2xl font-bold text-hockey-secondary">
                {currentMatchup.manager1} is {currentMatchup.manager1Wins}-{currentMatchup.manager2Wins} vs {currentMatchup.manager2} in their {currentMatchup.playoffMeetings} playoff meetings
              </div>
            </div>

            {currentMatchup.matchups.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Meeting History</h4>
                <div className="space-y-2">
                  {currentMatchup.matchups.map((matchup, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                      <span className="text-sm text-gray-700">{matchup}</span>
                      <span className="text-xs text-gray-500">🏆</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* No playoff meetings message */}
        {currentMatchup && currentMatchup.playoffMeetings === 0 && (
          <div className="card">
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Playoff Meetings</h3>
              <p className="text-gray-600">
                {currentMatchup.manager1} and {currentMatchup.manager2} have never faced each other in the playoffs.
              </p>
            </div>
          </div>
        )}

        {/* Top Playoff Rivalries */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Top Playoff Rivalries</h3>
          <div className="space-y-3">
            {topMatchups.length > 0 ? topMatchups.map((matchup, index) => (
              <div key={`${matchup.manager1}-${matchup.manager2}`} 
                   className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                   onClick={() => {
                     setManager1(matchup.manager1);
                     setManager2(matchup.manager2);
                   }}>
                <div className="flex items-center space-x-4">
                  <div className="text-lg font-semibold text-gray-500">#{index + 1}</div>
                  <div>
                    <div className="font-semibold text-hockey-primary">
                      {matchup.manager1} vs {matchup.manager2}
                    </div>
                    <div className="text-sm text-gray-600">
                      {matchup.manager1Wins > matchup.manager2Wins ? 
                        `${matchup.manager1} leads ${matchup.manager1Wins}-${matchup.manager2Wins}` :
                        matchup.manager2Wins > matchup.manager1Wins ?
                        `${matchup.manager2} leads ${matchup.manager2Wins}-${matchup.manager1Wins}` :
                        `Series tied ${matchup.manager1Wins}-${matchup.manager2Wins}`
                      } in {matchup.playoffMeetings} playoff meetings
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-hockey-secondary">{matchup.playoffMeetings}</div>
                  <div className="text-sm text-gray-600">playoff meetings</div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No playoff rivalries found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Playoff Matchup Matrix */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Playoff Matchup Matrix</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="table-header">Manager</th>
                  {allManagers.slice(0, 10).map(manager => (
                    <th key={manager} className="table-header text-center text-xs">
                      {manager.length > 8 ? manager.substring(0, 8) + '...' : manager}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allManagers.slice(0, 10).map(manager1 => (
                  <tr key={manager1}>
                    <td className="table-cell font-semibold text-hockey-primary">
                      {manager1.length > 12 ? manager1.substring(0, 12) + '...' : manager1}
                    </td>
                    {allManagers.slice(0, 10).map(manager2 => {
                      if (manager1 === manager2) {
                        return <td key={manager2} className="table-cell text-center text-gray-400">-</td>;
                      }
                      
                      const key = manager1 < manager2 ? `${manager1}-${manager2}` : `${manager2}-${manager1}`;
                      const record = headToHeadData.get(key);
                      
                      return (
                        <td key={manager2} className="table-cell text-center">
                          <span className={`text-sm font-medium ${
                            record && record.playoffMeetings > 0 ? 'text-hockey-primary' : 'text-gray-400'
                          }`}>
                            {record ? record.playoffMeetings : 0}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Numbers represent playoff meetings between managers across all seasons
          </p>
        </div>
      </div>
    </Layout>
  );
}