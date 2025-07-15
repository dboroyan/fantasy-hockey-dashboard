import { HockeyDataParser } from '../data/parser';
import * as fs from 'fs';
import * as path from 'path';

const inputPath = '/Users/davidboroyan/Downloads/fantasy_hockey_corrected_2020.md';
const outputPath = path.join(__dirname, '../data/hockey-data.json');

try {
  console.log('Parsing markdown file...');
  const parser = new HockeyDataParser(inputPath);
  
  console.log('Generating JSON data...');
  const jsonData = parser.generateJSON();
  
  // Ensure directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log('Writing JSON file...');
  fs.writeFileSync(outputPath, jsonData);
  
  console.log(`✅ Successfully generated ${outputPath}`);
  
  // Display some basic stats
  const data = JSON.parse(jsonData);
  console.log('\n📊 Data Summary:');
  console.log(`- Total seasons: ${data.seasons.length}`);
  console.log(`- Total managers: ${data.managerStats.length}`);
  console.log(`- Year range: ${data.metadata.yearRange}`);
  
  // Show top 3 managers by championships
  const topManagers = data.managerStats
    .sort((a: any, b: any) => b.championships - a.championships)
    .slice(0, 3);
  
  console.log('\n🏆 Top Champions:');
  topManagers.forEach((manager: any, index: number) => {
    console.log(`${index + 1}. ${manager.manager}: ${manager.championships} championship(s)`);
  });
  
} catch (error) {
  console.error('❌ Error generating data:', error);
  process.exit(1);
}