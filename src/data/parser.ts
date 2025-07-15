import * as fs from 'fs';
import * as path from 'path';

export interface SeasonData {
  year: number;
  managers: ManagerSeason[];
  playoffResults?: PlayoffResults;
  notes?: string;
}

export interface ManagerSeason {
  manager: string;
  team: string;
  regularSeasonPosition: number;
  regularSeasonRecord: string;
  playoffRecord?: string;
  finalPosition: number;
  isChampion: boolean;
}

export interface PlayoffResults {
  quarterfinals?: string[];
  semifinals?: string[];
  finals?: string;
  thirdPlace?: string;
  fifthPlace?: string;
  seventhPlace?: string;
  ninthPlace?: string;
}

export interface ManagerStats {
  manager: string;
  totalSeasons: number;
  championships: number;
  runnerUps: number;
  playoffAppearances: number;
  averageFinish: number;
  regularSeasonRecord: { wins: number; losses: number; ties: number };
  playoffRecord: { wins: number; losses: number };
  seasonsPlayed: number[];
}

export interface HeadToHeadRecord {
  manager1: string;
  manager2: string;
  regularSeasonWins: number;
  regularSeasonLosses: number;
  playoffWins: number;
  playoffLosses: number;
  totalMeetings: number;
}

export class HockeyDataParser {
  private markdownContent: string;
  private seasons: SeasonData[] = [];

  constructor(filePath: string) {
    this.markdownContent = fs.readFileSync(filePath, 'utf-8');
    this.parseMarkdown();
  }

  private parseMarkdown(): void {
    const seasonSections = this.markdownContent.split('## ').filter(section => 
      section.match(/^\d{4} Season/)
    );

    for (const section of seasonSections) {
      const season = this.parseSeasonSection(section);
      if (season) {
        this.seasons.push(season);
      }
    }
  }

  private parseSeasonSection(section: string): SeasonData | null {
    const lines = section.split('\n');
    const yearMatch = lines[0].match(/(\d{4}) Season/);
    
    if (!yearMatch) return null;

    const year = parseInt(yearMatch[1]);
    const managers: ManagerSeason[] = [];
    let playoffResults: PlayoffResults | undefined;
    let notes: string | undefined;

    // Parse table data
    const tableStart = lines.findIndex(line => line.includes('| Manager | Team |'));
    if (tableStart > -1) {
      for (let i = tableStart + 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line.startsWith('|') || line === '|') break;
        
        const manager = this.parseManagerRow(line);
        if (manager) {
          managers.push(manager);
        }
      }
    }

    // Parse playoff results
    const playoffStart = lines.findIndex(line => line.includes('**Playoff Results:**'));
    if (playoffStart > -1) {
      playoffResults = this.parsePlayoffResults(lines.slice(playoffStart));
    }

    // Parse notes
    const noteMatch = section.match(/\*\*Note:\*\* (.+)/);
    if (noteMatch) {
      notes = noteMatch[1];
    }

    return {
      year,
      managers,
      playoffResults,
      notes
    };
  }

  private parseManagerRow(line: string): ManagerSeason | null {
    const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
    
    if (cells.length < 6) return null;

    const manager = cells[0];
    const team = cells[1];
    const regularSeasonPosition = this.parsePosition(cells[2]);
    const regularSeasonRecord = cells[3];
    const playoffRecord = cells[4] === '-' ? undefined : cells[4];
    const finalPosition = this.parseFinalPosition(cells[5]);
    const isChampion = cells[5].includes('**Champion**');

    return {
      manager,
      team,
      regularSeasonPosition,
      regularSeasonRecord,
      playoffRecord,
      finalPosition,
      isChampion
    };
  }

  private parsePosition(position: string): number {
    const match = position.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private parseFinalPosition(position: string): number {
    if (position.includes('Champion')) return 1;
    if (position.includes('Runner-up')) return 2;
    if (position.includes('3rd Place')) return 3;
    if (position.includes('4th Place')) return 4;
    
    const match = position.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private parsePlayoffResults(lines: string[]): PlayoffResults {
    const results: PlayoffResults = {};
    
    for (const line of lines) {
      if (line.includes('*Quarterfinals:*')) {
        results.quarterfinals = this.extractMatchups(line);
      } else if (line.includes('*Semifinals:*')) {
        results.semifinals = this.extractMatchups(line);
      } else if (line.includes('*Finals:*')) {
        results.finals = line.replace('- *Finals:*', '').trim();
      } else if (line.includes('*3rd Place:*')) {
        results.thirdPlace = line.replace('- *3rd Place:*', '').trim();
      } else if (line.includes('*5th Place:*')) {
        results.fifthPlace = line.replace('- *5th Place:*', '').trim();
      } else if (line.includes('*7th Place:*')) {
        results.seventhPlace = line.replace('- *7th Place:*', '').trim();
      } else if (line.includes('*9th Place:*')) {
        results.ninthPlace = line.replace('- *9th Place:*', '').trim();
      }
    }

    return results;
  }

  private extractMatchups(line: string): string[] {
    const content = line.replace(/- \*[^*]+\*/, '').trim();
    return content.split('•').map(match => match.trim()).filter(match => match);
  }

  public getSeasons(): SeasonData[] {
    return this.seasons;
  }

  public calculateManagerStats(): ManagerStats[] {
    const managerMap = new Map<string, ManagerStats>();

    // Initialize all managers
    for (const season of this.seasons) {
      for (const manager of season.managers) {
        if (!managerMap.has(manager.manager)) {
          managerMap.set(manager.manager, {
            manager: manager.manager,
            totalSeasons: 0,
            championships: 0,
            runnerUps: 0,
            playoffAppearances: 0,
            averageFinish: 0,
            regularSeasonRecord: { wins: 0, losses: 0, ties: 0 },
            playoffRecord: { wins: 0, losses: 0 },
            seasonsPlayed: []
          });
        }
      }
    }

    // Calculate stats for each manager
    for (const season of this.seasons) {
      for (const manager of season.managers) {
        const stats = managerMap.get(manager.manager)!;
        stats.totalSeasons++;
        stats.seasonsPlayed.push(season.year);

        // Championships and runner-ups
        if (manager.isChampion) {
          stats.championships++;
        } else if (manager.finalPosition === 2) {
          stats.runnerUps++;
        }

        // Playoff appearances (assuming top 8 make playoffs in most seasons)
        if (manager.playoffRecord && manager.playoffRecord !== '-') {
          stats.playoffAppearances++;
        }

        // Parse regular season record
        const regularRecord = this.parseRecord(manager.regularSeasonRecord);
        if (regularRecord) {
          stats.regularSeasonRecord.wins += regularRecord.wins;
          stats.regularSeasonRecord.losses += regularRecord.losses;
          stats.regularSeasonRecord.ties += regularRecord.ties;
        }

        // Parse playoff record
        if (manager.playoffRecord && manager.playoffRecord !== '-') {
          const playoffRecord = this.parseRecord(manager.playoffRecord);
          if (playoffRecord) {
            stats.playoffRecord.wins += playoffRecord.wins;
            stats.playoffRecord.losses += playoffRecord.losses;
          }
        }
      }
    }

    // Calculate average finish
    for (const season of this.seasons) {
      for (const manager of season.managers) {
        const stats = managerMap.get(manager.manager)!;
        stats.averageFinish += manager.finalPosition;
      }
    }

    // Finalize averages
    for (const stats of managerMap.values()) {
      stats.averageFinish = stats.averageFinish / stats.totalSeasons;
    }

    return Array.from(managerMap.values()).sort((a, b) => a.manager.localeCompare(b.manager));
  }

  private parseRecord(record: string): { wins: number; losses: number; ties: number } | null {
    // First try to match the full format with ties (X-Y-Z)
    let match = record.match(/(\d+)-(\d+)-(\d+)/);
    if (match) {
      return {
        wins: parseInt(match[1]),
        losses: parseInt(match[2]),
        ties: parseInt(match[3])
      };
    }

    // If no match, try playoff format without ties (X-Y)
    match = record.match(/(\d+)-(\d+)/);
    if (match) {
      return {
        wins: parseInt(match[1]),
        losses: parseInt(match[2]),
        ties: 0
      };
    }

    return null;
  }

  public generateJSON(): string {
    const data = {
      seasons: this.getSeasons(),
      managerStats: this.calculateManagerStats(),
      metadata: {
        totalSeasons: this.seasons.length,
        yearRange: `${Math.min(...this.seasons.map(s => s.year))}-${Math.max(...this.seasons.map(s => s.year))}`,
        generatedAt: new Date().toISOString()
      }
    };

    return JSON.stringify(data, null, 2);
  }
}