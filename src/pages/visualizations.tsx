import React, { useState, useMemo } from 'react';
import Layout, { formatSeason } from '@/components/Layout';
import { SeasonData, ManagerStats } from '@/data/parser';
import hockeyData from '@/data/hockey-data.json';
import { Trophy, TrendingUp, Calendar, Target, Clock, BarChart3, Crown, AlertTriangle, Users } from 'lucide-react';

export default function Visualizations() {
  const seasons = hockeyData.seasons as SeasonData[];
  const managerStats = hockeyData.managerStats as ManagerStats[];

  // ── Section 1: Championship Timeline state ──
  const [selectedEra, setSelectedEra] = useState<number>(2);
  const eras = [
    { name: 'Early Era', years: [2011, 2012, 2013, 2014, 2015, 2017], label: '2011-2018' },
    { name: 'Middle Era', years: [2018, 2020, 2021, 2022], label: '2018-2023' },
    { name: 'Modern Era', years: [2023, 2024, 2025], label: '2023-2026' },
  ];

  // ── Section 4: Playoff Bracket state ──
  const [selectedBracketYear, setSelectedBracketYear] = useState<number>(2025);

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
      ninthPlace: season.playoffResults.ninthPlace || '',
    };
  }, [selectedBracketYear, seasons]);

  const formatMatchupWithBoldWinner = (matchup: string) => {
    // Bold the winner (text after "def." or "over")
    let formatted = matchup
      .replace(/^(.+?)\s+(def\.|over)\s+/i, '<strong>$1</strong> $2 ')
      .replace(/^(.+?)\s+(\d+-\d+)\s+/i, '<strong>$1</strong> $2 ');
    return formatted;
  };

  // ── Section 1 data ──
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

  // ── Section 2: Manager Archetypes ──
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

      // Check freefall: champion in an earlier season, last place in a later season
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

  // ── Section 5: Manager Performance Over Time ──
  const allYears = [2011, 2012, 2013, 2014, 2015, 2017, 2018, 2020, 2021, 2022, 2023, 2024, 2025];

  const performanceData = useMemo(() => {
    const qualified = managerStats
      .filter(m => m.totalSeasons >= 5 && m.manager !== 'unknown')
      .sort((a, b) => {
        if (b.championships !== a.championships) return b.championships - a.championships;
        return a.averageFinish - b.averageFinish;
      });

    return qualified.map(ms => {
      const yearPositions = allYears.map(year => {
        const season = seasons.find(s => s.year === year);
        const mgr = season?.managers.find(m => m.manager === ms.manager);
        return mgr ? mgr.finalPosition : null;
      });
      return {
        manager: ms.manager,
        positions: yearPositions,
        championships: ms.championships,
      };
    });
  }, [managerStats, seasons]);

  // ── Section 6: Era Dominance ──
  const eraDominance = useMemo(() => {
    return eras.map(era => {
      const champCounts: Record<string, number> = {};
      era.years.forEach(year => {
        const season = seasons.find(s => s.year === year);
        const champ = season?.managers.find(m => m.isChampion);
        if (champ) {
          champCounts[champ.manager] = (champCounts[champ.manager] || 0) + 1;
        }
      });
      const sorted = Object.entries(champCounts).sort((a, b) => b[1] - a[1]);
      return { ...era, champions: sorted, totalSeasons: era.years.length };
    });
  }, [seasons]);

  // ── Section 7: Tale of the Tape ──
  const taleOfTheTape = useMemo(() => {
    const qualified = managerStats.filter(m => m.totalSeasons >= 5 && m.manager !== 'unknown');
    const withStats = qualified.map(m => {
      const totalGames = m.regularSeasonRecord.wins + m.regularSeasonRecord.losses;
      const winPct = totalGames > 0 ? m.regularSeasonRecord.wins / totalGames : 0;
      return { ...m, winPct };
    });

    // Rank by winPct desc
    const byWinPct = [...withStats].sort((a, b) => b.winPct - a.winPct);
    const byChampionships = [...withStats].sort((a, b) => b.championships - a.championships);

    const withGap = withStats.map(m => {
      const winPctRank = byWinPct.findIndex(x => x.manager === m.manager) + 1;
      const champRank = byChampionships.findIndex(x => x.manager === m.manager) + 1;
      // Positive gap = good RS rank but bad championship rank (overperforms in RS)
      const gap = champRank - winPctRank;
      return { ...m, winPctRank, champRank, gap };
    });

    return withGap.sort((a, b) => b.gap - a.gap).slice(0, 5);
  }, [managerStats]);

  // ── Helper: position square color ──
  const positionColor = (pos: number | null) => {
    if (pos === null) return 'bg-slate-800 text-slate-600';
    if (pos === 1) return 'bg-amber-500 text-white';
    if (pos <= 3) return 'bg-green-500 text-white';
    if (pos <= 6) return 'bg-slate-600 text-slate-300';
    return 'bg-red-500 text-white';
  };

  return (
    <Layout title="Visualizations - Fantasy Hockey Dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ═══════ SECTION 1: Championship Timeline by Era ═══════ */}
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

        {/* ═══════ SECTION 2: Manager Archetypes ═══════ */}
        <div className="bg-hockey-surface border border-hockey-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-1">
            <Users className="h-6 w-6 text-hockey-secondary" />
            <h2 className="text-xl font-semibold text-slate-100">Manager Archetypes</h2>
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

        {/* ═══════ SECTION 3: Historic Collapse Callout ═══════ */}
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
            {/* 2023-2024 */}
            <div className="flex-1 text-center p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="text-amber-400 text-3xl font-extrabold">1st</div>
              <div className="text-amber-400 text-sm font-semibold">CHAMPION</div>
              <div className="text-slate-500 text-xs mt-1">{formatSeason(2023)}</div>
            </div>

            <div className="flex items-center justify-center text-slate-600 text-xl">&rarr;</div>

            {/* 2024-2025 */}
            <div className="flex-1 text-center p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="text-amber-500 text-3xl font-extrabold">7th</div>
              <div className="text-amber-500 text-sm font-semibold">MISSED PLAYOFFS</div>
              <div className="text-slate-500 text-xs">8-10-1</div>
              <div className="text-slate-500 text-xs mt-1">{formatSeason(2024)}</div>
            </div>

            <div className="flex items-center justify-center text-slate-600 text-xl">&rarr;</div>

            {/* 2025-2026 */}
            <div className="flex-1 text-center p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="text-red-500 text-3xl font-extrabold">10th</div>
              <div className="text-red-500 text-sm font-semibold">DEAD LAST</div>
              <div className="text-slate-500 text-xs">8-10-2</div>
              <div className="text-slate-500 text-xs mt-1">{formatSeason(2025)}</div>
            </div>
          </div>
        </div>

        {/* ═══════ SECTION 4: Playoff Bracket Viewer ═══════ */}
        <div className="bg-hockey-surface border border-hockey-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="h-6 w-6 text-hockey-secondary" />
            <h2 className="text-xl font-semibold text-slate-100">Playoff Bracket Viewer</h2>
            <select
              value={selectedBracketYear}
              onChange={e => setSelectedBracketYear(Number(e.target.value))}
              className="ml-auto bg-hockey-surface border border-hockey-border rounded-md px-3 py-2 text-slate-100 focus:ring-hockey-secondary"
            >
              {seasons
                .filter(s => s.playoffResults)
                .map(s => (
                  <option key={s.year} value={s.year}>
                    {formatSeason(s.year)}
                  </option>
                ))}
            </select>
          </div>

          {bracketData && (
            <div>
              <h3 className="text-slate-100 text-lg font-semibold mb-4">
                {formatSeason(bracketData.year)} Playoff Bracket
              </h3>

              <style>{`
                .bracket-matchup strong { color: #4ade80; }
              `}</style>

              <div className="space-y-6">
                {/* Quarterfinals */}
                {bracketData.quarterfinals.length > 0 && (
                  <div>
                    <div className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">
                      Quarterfinals
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {bracketData.quarterfinals.map((matchup, i) => (
                        <div
                          key={i}
                          className="bracket-matchup bg-hockey-primary/50 border border-hockey-border rounded-lg p-3 text-slate-300"
                          dangerouslySetInnerHTML={{ __html: formatMatchupWithBoldWinner(matchup) }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Semifinals */}
                {bracketData.semifinals.length > 0 && (
                  <div>
                    <div className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">
                      Semifinals
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {bracketData.semifinals.map((matchup, i) => (
                        <div
                          key={i}
                          className="bracket-matchup bg-hockey-primary/50 border border-hockey-border rounded-lg p-3 text-slate-300"
                          dangerouslySetInnerHTML={{ __html: formatMatchupWithBoldWinner(matchup) }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Finals */}
                {bracketData.finals && (
                  <div>
                    <div className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">
                      Finals
                    </div>
                    <div
                      className="bracket-matchup bg-hockey-primary/50 border border-hockey-border rounded-lg p-4 text-slate-300"
                      dangerouslySetInnerHTML={{ __html: formatMatchupWithBoldWinner(bracketData.finals) }}
                    />
                  </div>
                )}

                {/* Placement Games */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {bracketData.thirdPlace && (
                    <div>
                      <div className="text-slate-400 text-sm mb-1">3rd Place</div>
                      <div
                        className="bracket-matchup bg-hockey-primary/50 border border-hockey-border rounded-lg p-3 text-slate-300"
                        dangerouslySetInnerHTML={{ __html: formatMatchupWithBoldWinner(bracketData.thirdPlace) }}
                      />
                    </div>
                  )}
                  {bracketData.fifthPlace && (
                    <div>
                      <div className="text-slate-400 text-sm mb-1">5th Place</div>
                      <div
                        className="bracket-matchup bg-hockey-primary/50 border border-hockey-border rounded-lg p-3 text-slate-300"
                        dangerouslySetInnerHTML={{ __html: formatMatchupWithBoldWinner(bracketData.fifthPlace) }}
                      />
                    </div>
                  )}
                  {bracketData.seventhPlace && (
                    <div>
                      <div className="text-slate-400 text-sm mb-1">7th Place</div>
                      <div
                        className="bracket-matchup bg-hockey-primary/50 border border-hockey-border rounded-lg p-3 text-slate-300"
                        dangerouslySetInnerHTML={{ __html: formatMatchupWithBoldWinner(bracketData.seventhPlace) }}
                      />
                    </div>
                  )}
                  {bracketData.ninthPlace && (
                    <div>
                      <div className="text-slate-400 text-sm mb-1">9th Place</div>
                      <div
                        className="bracket-matchup bg-hockey-primary/50 border border-hockey-border rounded-lg p-3 text-slate-300"
                        dangerouslySetInnerHTML={{ __html: formatMatchupWithBoldWinner(bracketData.ninthPlace) }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══════ SECTION 5: Manager Performance Over Time ═══════ */}
        <div className="bg-hockey-surface border border-hockey-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="h-6 w-6 text-hockey-secondary" />
            <h2 className="text-xl font-semibold text-slate-100">Manager Performance Over Time</h2>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {performanceData.map(pd => (
                <div key={pd.manager} className="flex items-center gap-2 py-1.5">
                  <div className="w-20 text-sm font-medium text-slate-100 flex-shrink-0">{pd.manager}</div>
                  <div className="flex gap-1.5">
                    {pd.positions.map((pos, i) => (
                      <div
                        key={allYears[i]}
                        className={`w-7 h-7 rounded flex items-center justify-center text-[10px] font-semibold ${positionColor(pos)}`}
                      >
                        {pos === null ? '--' : pos === 1 ? <Crown className="h-3.5 w-3.5" /> : pos}
                      </div>
                    ))}
                  </div>
                  <div className="text-slate-400 text-xs w-16 text-right flex-shrink-0">
                    {pd.championships} title{pd.championships !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}

              {/* Year labels */}
              <div className="flex items-center gap-2 mt-2">
                <div className="w-20 flex-shrink-0" />
                <div className="flex gap-1.5">
                  {allYears.map(y => (
                    <div key={y} className="w-7 text-center text-slate-600 text-[9px]">
                      &apos;{String(y).slice(2)}-{String(y + 1).slice(2)}
                    </div>
                  ))}
                </div>
                <div className="w-16 flex-shrink-0" />
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-amber-500" />
              <span>Champion</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span>2nd-3rd</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-slate-600" />
              <span>4th-6th</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-red-500" />
              <span>7th+</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-slate-800" />
              <span>Did not play</span>
            </div>
          </div>
        </div>

        {/* ═══════ SECTION 6: Era Dominance Analysis ═══════ */}
        <div className="bg-hockey-surface border border-hockey-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-6 w-6 text-hockey-secondary" />
            <h2 className="text-xl font-semibold text-slate-100">Era Dominance Analysis</h2>
          </div>

          <div className="space-y-6">
            {eraDominance.map(era => (
              <div key={era.name} className="bg-hockey-primary/50 rounded-lg p-6 border border-hockey-border">
                <h3 className="text-slate-100 text-lg font-semibold mb-4">
                  {era.name} <span className="text-slate-400">({era.totalSeasons} seasons)</span>
                </h3>

                <div className="space-y-3">
                  {era.champions.map(([manager, count]) => {
                    const pct = (count / era.totalSeasons) * 100;
                    return (
                      <div key={manager} className="flex items-center gap-3">
                        <div className="w-20 text-sm font-medium text-slate-100">{manager}</div>
                        <div className="bg-slate-700 rounded h-6 flex-1 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-green-600 to-green-400 h-6 rounded flex items-center px-2"
                            style={{ width: `${pct}%` }}
                          >
                            {pct >= 20 && (
                              <span className="text-white text-sm font-medium">{count}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-slate-400 text-sm w-16 text-right">
                          {Math.round(pct)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════ SECTION 7: Tale of the Tape ═══════ */}
        <div className="bg-hockey-surface border border-hockey-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-1">
            <BarChart3 className="h-6 w-6 text-hockey-secondary" />
            <h2 className="text-xl font-semibold text-slate-100">Tale of the Tape</h2>
          </div>
          <p className="text-slate-400 text-sm mb-6 ml-9">Regular season stars who can&apos;t close in the playoffs</p>

          <div className="space-y-4">
            {taleOfTheTape.map(m => {
              const isKing = m.winPctRank <= 3 && m.championships <= 1;
              return (
                <div key={m.manager} className="bg-hockey-primary/50 border border-hockey-border rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-slate-100 text-lg font-semibold">{m.manager}</span>
                    {isKing && (
                      <span className="bg-amber-500/15 text-amber-400 px-3 py-1 rounded-full text-xs font-semibold">
                        REGULAR SEASON KING
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                    <div>
                      <div className="text-slate-400 text-xs uppercase">Regular Season</div>
                      <div className="text-hockey-secondary text-3xl font-bold">
                        {(m.winPct * 100).toFixed(1)}%
                      </div>
                      <div className="text-slate-500 text-sm">
                        Ranked #{m.winPctRank} in win percentage
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs uppercase">Playoff Outcome</div>
                      <div className={`text-3xl font-bold ${m.championships === 0 ? 'text-red-400' : 'text-slate-100'}`}>
                        {m.championships} title{m.championships !== 1 ? 's' : ''}
                      </div>
                      <div className="text-slate-500 text-sm">
                        Avg finish: {m.averageFinish.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </Layout>
  );
}
