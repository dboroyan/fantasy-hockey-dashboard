import React, { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { formatSeason } from '@/components/Layout';
import { SeasonData, ManagerStats } from '@/data/parser';
import hockeyData from '@/data/hockey-data.json';
import { Trophy, Crown, AlertTriangle, Users, BarChart3, TrendingUp, Target } from 'lucide-react';

export default function Home() {
  const [selectedSeason, setSelectedSeason] = useState<number>(2025);
  const seasons = hockeyData.seasons as SeasonData[];
  const managerStats = hockeyData.managerStats as ManagerStats[];
  const currentSeason = seasons.find(s => s.year === selectedSeason);

  // ── Championship Timeline state ──
  const [selectedEra, setSelectedEra] = useState<number>(2);
  const eras = [
    { name: 'Early Era', years: [2011, 2012, 2013, 2014, 2015, 2017], label: '2011-2018' },
    { name: 'Middle Era', years: [2018, 2020, 2021, 2022], label: '2018-2023' },
    { name: 'Modern Era', years: [2023, 2024, 2025], label: '2023-2026' },
  ];

  // ── Championship Timeline data ──
  const eraChampions = useMemo(() => {
    const era = eras[selectedEra];
    return era.years.map(year => {
      const season = seasons.find(s => s.year === year);
      const champ = season?.managers.find(m => m.isChampion);
      return {
        year,
        manager: champ?.manager || 'Unknown',
        team: champ?.team || '',
        record: champ?.regularSeasonRecord || '',
      };
    });
  }, [selectedEra, seasons]);

  // ── Manager Archetypes data ──
  const archetypeData = useMemo(() => {
    const latestSeason = seasons.find(s => s.year === 2025);
    if (!latestSeason) return [];
    const managers = latestSeason.managers.map(m => m.manager);
    const archetypeYears = [2023, 2024, 2025];

    return managers.map(manager => {
      const positions: (number | null)[] = archetypeYears.map(year => {
        const season = seasons.find(s => s.year === year);
        const ms = season?.managers.find(m => m.manager === manager);
        return ms ? ms.finalPosition : null;
      });

      const played = positions.filter(p => p !== null) as number[];
      const championships = played.filter(p => p === 1).length;
      const playoffAppearances = played.filter(p => p <= 6).length;
      const maxPosition = Math.max(...played);
      const bestFinish = Math.min(...played);

      let isFreefall = false;
      for (let i = 0; i < positions.length; i++) {
        if (positions[i] === 1) {
          for (let j = i + 1; j < positions.length; j++) {
            const season = seasons.find(s => s.year === archetypeYears[j]);
            const maxPos = season ? Math.max(...season.managers.map(m => m.finalPosition)) : 0;
            if (positions[j] === maxPos) {
              isFreefall = true;
            }
          }
        }
      }

      let archetype: string;
      let color: string;

      if (championships >= 2) {
        archetype = 'DYNASTY';
        color = '#D4AF37';
      } else if (isFreefall) {
        archetype = 'FREEFALL';
        color = '#ef4444';
      } else if (playoffAppearances === played.length && played.length > 0 && championships === 0) {
        archetype = 'CONTENDER';
        color = '#4ade80';
      } else if (playoffAppearances >= 2 && bestFinish <= 3 && championships === 0) {
        archetype = 'CLOSE CALL';
        color = '#f59e0b';
      } else if (played.filter(p => p > 6).length >= 2) {
        archetype = 'REBUILDING';
        color = '#ef4444';
      } else {
        archetype = 'MIDDLE OF THE PACK';
        color = '#94a3b8';
      }

      const positionLabels = archetypeYears.map((year, i) => {
        const shortYear = `'${String(year).slice(2)}-${String(year + 1).slice(2)}`;
        const pos = positions[i];
        if (pos === null) return `${shortYear}: --`;
        const suffix = pos === 1 ? 'st' : pos === 2 ? 'nd' : pos === 3 ? 'rd' : 'th';
        return `${shortYear}: ${pos}${suffix}`;
      }).join(' \u2022 ');

      return { manager, archetype, color, positionLabels };
    });
  }, [seasons]);

  // ── Visual Bracket data ──
  const bracketData = useMemo(() => {
    if (!currentSeason || !currentSeason.playoffResults) return null;
    return {
      year: selectedSeason,
      quarterfinals: currentSeason.playoffResults.quarterfinals || [],
      semifinals: currentSeason.playoffResults.semifinals || [],
      finals: currentSeason.playoffResults.finals || '',
      thirdPlace: currentSeason.playoffResults.thirdPlace || '',
      fifthPlace: currentSeason.playoffResults.fifthPlace || '',
      seventhPlace: currentSeason.playoffResults.seventhPlace || '',
      ninthPlace: currentSeason.playoffResults.ninthPlace || '',
    };
  }, [selectedSeason, currentSeason]);

  // ── Parse matchup into teams/scores/winner ──
  const parseMatchup = (matchup: string): { team1: string; team2: string; score: string; winner: 1 | 2; isBye: boolean } => {
    // Check for bye
    if (matchup.includes('(bye)')) {
      const byeMatch = matchup.match(/^(?:\*\*)?(.+?)\s*\(bye\)(?:\*\*)?$/);
      if (byeMatch) {
        return { team1: byeMatch[1].replace(/\*\*/g, '').trim(), team2: '', score: '', winner: 1, isBye: true };
      }
    }

    // Try pattern: "**Winner (Team)** def. Loser (Team) Score"
    const boldPattern = /^\*\*(.+?)\*\*\s+def\.\s+(.+?)(?:\s+(\d+-\d+.*))?$/;
    const boldMatch = matchup.match(boldPattern);
    if (boldMatch) {
      return { team1: boldMatch[1].trim(), team2: boldMatch[2].trim(), score: boldMatch[3] || '', winner: 1, isBye: false };
    }

    // Try pattern: "Winner (Team) def. Loser (Team) Score"
    const defPattern = /^(.+?)\s+def\.\s+(.+?)(?:\s+(\d+-\d+.*))?$/;
    const defMatch = matchup.match(defPattern);
    if (defMatch) {
      return { team1: defMatch[1].trim(), team2: defMatch[2].trim(), score: defMatch[3] || '', winner: 1, isBye: false };
    }

    return { team1: matchup, team2: '', score: '', winner: 1, isBye: false };
  };

  // Extract just manager name from "Manager (Team)" format
  const extractManagerName = (full: string): string => {
    const match = full.match(/^(.+?)\s*\(/);
    return match ? match[1].trim() : full.trim();
  };

  // ── Tale of the Tape data ──
  const taleEntries = [
    {
      manager: 'Ben',
      tag: 'REGULAR SEASON KING',
      tagColor: '#f59e0b',
      description: 'Dominates the regular season but can\'t close in the playoffs',
    },
    {
      manager: 'Mish',
      tag: 'REGULAR SEASON KING',
      tagColor: '#f59e0b',
      description: 'Consistent regular season performer, struggles to convert in playoffs',
    },
    {
      manager: 'coach keo',
      tag: 'REGULAR SEASON KING',
      tagColor: '#f59e0b',
      description: 'Strong regular season showings but playoff success eludes him',
    },
    {
      manager: 'MST',
      tag: 'PLAYOFF PERFORMER',
      tagColor: '#4ade80',
      description: 'Gets hot when it matters most -- playoff record speaks for itself',
    },
    {
      manager: 'Vin',
      tag: 'TRUE CONTENDER',
      tagColor: '#3b82f6',
      description: 'Consistent across regular season and playoffs -- always in the mix',
    },
  ];

  const taleData = useMemo(() => {
    return taleEntries.map(entry => {
      const stats = managerStats.find(m => m.manager === entry.manager);
      if (!stats) return null;
      const rs = stats.regularSeasonRecord;
      const rsTotalGames = rs.wins + rs.losses + rs.ties;
      const rsWinPct = rsTotalGames > 0 ? (rs.wins / rsTotalGames * 100).toFixed(1) : '0.0';
      const po = stats.playoffRecord;
      const poTotal = po.wins + po.losses;
      const poWinPct = poTotal > 0 ? (po.wins / poTotal * 100).toFixed(1) : '0.0';
      return {
        ...entry,
        rsRecord: `${rs.wins}-${rs.losses}-${rs.ties}`,
        rsWinPct,
        poRecord: `${po.wins}-${po.losses}`,
        poWinPct,
      };
    }).filter(Boolean) as (typeof taleEntries[0] & { rsRecord: string; rsWinPct: string; poRecord: string; poWinPct: string })[];
  }, [managerStats]);

  // ── formatMatchupWithBoldWinner helper (kept for any fallback) ──
  const formatMatchupWithBoldWinner = (matchup: string) => {
    let formatted = matchup
      .replace(/^(.+?)\s+(def\.|over)\s+/i, '<strong>$1</strong> $2 ')
      .replace(/^(.+?)\s+(\d+-\d+)\s+/i, '<strong>$1</strong> $2 ');
    return formatted;
  };

  // ── Bracket matchup component ──
  const BracketMatchup = ({ matchup, compact }: { matchup: string; compact?: boolean }) => {
    const parsed = parseMatchup(matchup);
    const mgr1 = extractManagerName(parsed.team1);
    const mgr2 = parsed.team2 ? extractManagerName(parsed.team2) : '';

    if (parsed.isBye) {
      return (
        <div className={`bg-hockey-primary border border-hockey-border rounded-lg overflow-hidden ${compact ? '' : ''}`}>
          <div className="flex items-center justify-between px-3 py-2 bg-green-900/20 border-l-2 border-l-hockey-secondary">
            <span className="text-hockey-secondary font-semibold text-sm">{mgr1}</span>
            <span className="text-slate-500 text-xs italic">(bye)</span>
          </div>
        </div>
      );
    }

    return (
      <div className={`bg-hockey-primary border border-hockey-border rounded-lg overflow-hidden ${compact ? '' : ''}`}>
        <div className="flex items-center justify-between px-3 py-2 bg-green-900/20 border-l-2 border-l-hockey-secondary">
          <span className="text-hockey-secondary font-semibold text-sm truncate">{mgr1}</span>
          {parsed.score && (
            <span className="text-slate-400 text-xs ml-2 flex-shrink-0">{parsed.score.split('-')[0]}</span>
          )}
        </div>
        <div className="flex items-center justify-between px-3 py-2 border-l-2 border-l-transparent">
          <span className="text-slate-400 text-sm truncate">{mgr2}</span>
          {parsed.score && (
            <span className="text-slate-500 text-xs ml-2 flex-shrink-0">{parsed.score.split('-')[1]?.split(' ')[0]}</span>
          )}
        </div>
      </div>
    );
  };

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
                      This was Dave and MST&apos;s second time meeting in the finals.
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

            {/* ═══════ Visual Playoff Bracket ═══════ */}
            {bracketData && (
              <div className="card">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="h-6 w-6 text-hockey-secondary" />
                  <h3 className="text-xl font-semibold text-slate-100">Playoff Bracket</h3>
                </div>

                {/* Desktop bracket layout */}
                <div className="hidden md:block">
                  <div className="grid grid-cols-3 gap-8 items-start">
                    {/* Quarterfinals */}
                    <div>
                      <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3 text-center">
                        Quarterfinals
                      </div>
                      <div className="space-y-3">
                        {bracketData.quarterfinals.map((matchup, i) => (
                          <BracketMatchup key={i} matchup={matchup} />
                        ))}
                      </div>
                    </div>

                    {/* Semifinals */}
                    <div>
                      <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3 text-center">
                        Semifinals
                      </div>
                      <div className="space-y-3 mt-8">
                        {bracketData.semifinals.map((matchup, i) => (
                          <BracketMatchup key={i} matchup={matchup} />
                        ))}
                      </div>
                    </div>

                    {/* Finals */}
                    <div>
                      <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3 text-center">
                        Finals
                      </div>
                      <div className="mt-16">
                        <BracketMatchup matchup={bracketData.finals} />
                        {/* Champion callout */}
                        {(() => {
                          const parsed = parseMatchup(bracketData.finals);
                          const champName = extractManagerName(parsed.team1);
                          return (
                            <div className="mt-3 text-center">
                              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2">
                                <Crown className="h-4 w-4 text-hockey-gold" />
                                <span className="text-hockey-gold font-semibold text-sm">{champName}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Connecting lines overlay */}
                  <style>{`
                    .bracket-connector { position: relative; }
                  `}</style>
                </div>

                {/* Mobile bracket layout - stacked */}
                <div className="md:hidden space-y-6">
                  {bracketData.quarterfinals.length > 0 && (
                    <div>
                      <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">
                        Quarterfinals
                      </div>
                      <div className="space-y-2">
                        {bracketData.quarterfinals.map((matchup, i) => (
                          <BracketMatchup key={i} matchup={matchup} />
                        ))}
                      </div>
                    </div>
                  )}
                  {bracketData.semifinals.length > 0 && (
                    <div>
                      <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">
                        Semifinals
                      </div>
                      <div className="space-y-2">
                        {bracketData.semifinals.map((matchup, i) => (
                          <BracketMatchup key={i} matchup={matchup} />
                        ))}
                      </div>
                    </div>
                  )}
                  {bracketData.finals && (
                    <div>
                      <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">
                        Finals
                      </div>
                      <BracketMatchup matchup={bracketData.finals} />
                    </div>
                  )}
                </div>

                {/* Placement Games */}
                {(bracketData.thirdPlace || bracketData.fifthPlace || bracketData.seventhPlace || bracketData.ninthPlace) && (
                  <div className="mt-6 pt-6 border-t border-hockey-border">
                    <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">
                      Placement Games
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {bracketData.thirdPlace && (
                        <div>
                          <div className="text-slate-500 text-xs mb-1">3rd Place</div>
                          <BracketMatchup matchup={bracketData.thirdPlace} compact />
                        </div>
                      )}
                      {bracketData.fifthPlace && (
                        <div>
                          <div className="text-slate-500 text-xs mb-1">5th Place</div>
                          <BracketMatchup matchup={bracketData.fifthPlace} compact />
                        </div>
                      )}
                      {bracketData.seventhPlace && (
                        <div>
                          <div className="text-slate-500 text-xs mb-1">7th Place</div>
                          <BracketMatchup matchup={bracketData.seventhPlace} compact />
                        </div>
                      )}
                      {bracketData.ninthPlace && (
                        <div>
                          <div className="text-slate-500 text-xs mb-1">9th Place</div>
                          <BracketMatchup matchup={bracketData.ninthPlace} compact />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ═══════ Championship Timeline by Era ═══════ */}
        <div className="bg-hockey-surface border border-hockey-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="h-6 w-6 text-hockey-secondary" />
            <h2 className="text-xl font-semibold text-slate-100">Championship Timeline</h2>
          </div>

          <div className="flex gap-2 mb-6">
            {eras.map((era, idx) => (
              <button
                key={era.name}
                onClick={() => setSelectedEra(idx)}
                className={
                  selectedEra === idx
                    ? 'bg-green-900/30 border border-green-800/50 text-hockey-secondary font-medium px-4 py-2 rounded-lg text-sm'
                    : 'bg-hockey-surface border border-hockey-border text-slate-400 hover:text-slate-200 px-4 py-2 rounded-lg text-sm'
                }
              >
                {era.name} ({era.label})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {eraChampions.map(champ => (
              <div key={champ.year} className="bg-hockey-primary/50 rounded-lg p-4">
                <Crown className="h-5 w-5 text-hockey-gold mb-2" />
                <div className="text-slate-100 font-semibold">{champ.manager}</div>
                <div className="text-slate-500 text-sm">{champ.team}</div>
                <div className="text-slate-400 text-sm">{champ.record}</div>
                <div className="text-hockey-secondary text-sm font-medium mt-1">{formatSeason(champ.year)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════ Historic Collapse Callout ═══════ */}
        <div className="bg-gradient-to-br from-hockey-surface to-red-950/30 border-2 border-red-500 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <span className="text-red-500 text-xl font-bold tracking-wide">HISTORIC COLLAPSE</span>
          </div>
          <h3 className="text-slate-100 text-lg font-semibold mb-1">Sammy&apos;s Unprecedented Fall</h3>
          <p className="text-slate-400 mb-6">
            No manager in league history has ever gone from champion to dead last. Sammy did it in just two seasons.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <div className="flex-1 text-center p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="text-amber-400 text-3xl font-extrabold">1st</div>
              <div className="text-amber-400 text-sm font-semibold">CHAMPION</div>
              <div className="text-slate-500 text-xs mt-1">{formatSeason(2023)}</div>
            </div>

            <div className="flex items-center justify-center text-slate-600 text-xl">&rarr;</div>

            <div className="flex-1 text-center p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="text-amber-500 text-3xl font-extrabold">7th</div>
              <div className="text-amber-500 text-sm font-semibold">MISSED PLAYOFFS</div>
              <div className="text-slate-500 text-xs">8-10-1</div>
              <div className="text-slate-500 text-xs mt-1">{formatSeason(2024)}</div>
            </div>

            <div className="flex items-center justify-center text-slate-600 text-xl">&rarr;</div>

            <div className="flex-1 text-center p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="text-red-500 text-3xl font-extrabold">10th</div>
              <div className="text-red-500 text-sm font-semibold">DEAD LAST</div>
              <div className="text-slate-500 text-xs">8-10-2</div>
              <div className="text-slate-500 text-xs mt-1">{formatSeason(2025)}</div>
            </div>
          </div>
        </div>

        {/* ═══════ Current Manager Trends ═══════ */}
        <div className="bg-hockey-surface border border-hockey-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-1">
            <Users className="h-6 w-6 text-hockey-secondary" />
            <h2 className="text-xl font-semibold text-slate-100">Current Manager Trends</h2>
          </div>
          <p className="text-slate-400 text-sm mb-6 ml-9">Based on last 3 seasons (2023-2026)</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {archetypeData.map(a => (
              <div
                key={a.manager}
                className="bg-hockey-primary border border-hockey-border rounded-lg p-4"
                style={{ borderLeftWidth: '4px', borderLeftColor: a.color }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-100 font-semibold">{a.manager}</span>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: `${a.color}26`,
                      color: a.color,
                    }}
                  >
                    {a.archetype}
                  </span>
                </div>
                <div className="text-slate-500 text-xs">{a.positionLabels}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════ Tale of the Tape ═══════ */}
        <div className="bg-hockey-surface border border-hockey-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-1">
            <BarChart3 className="h-6 w-6 text-hockey-secondary" />
            <h2 className="text-xl font-semibold text-slate-100">Tale of the Tape</h2>
          </div>
          <p className="text-slate-400 text-sm mb-6 ml-9">How regular season performance translates to playoff success</p>

          <div className="space-y-4">
            {taleData.map(m => (
              <div key={m.manager} className="bg-hockey-primary/50 border border-hockey-border rounded-lg p-5">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-slate-100 text-lg font-semibold">{m.manager}</span>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: `${m.tagColor}26`,
                      color: m.tagColor,
                    }}
                  >
                    {m.tag}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mb-3">{m.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-slate-400 text-xs uppercase mb-1">Regular Season</div>
                    <div className="text-slate-100 text-2xl font-bold">{m.rsRecord}</div>
                    <div className="text-slate-500 text-sm">{m.rsWinPct}% win rate</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs uppercase mb-1">Playoff Record</div>
                    <div className="text-slate-100 text-2xl font-bold">{m.poRecord}</div>
                    <div className="text-slate-500 text-sm">{m.poWinPct}% win rate</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
