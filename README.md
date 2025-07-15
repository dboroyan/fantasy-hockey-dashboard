# Fantasy Hockey Dashboard

An interactive web dashboard for analyzing 13+ years of fantasy hockey league data (2011-2024, excluding 2016).

## Features

### 🏆 Season Explorer
- Browse individual seasons with complete standings
- View detailed playoff brackets and results
- Season-by-season champion history

### 👥 Manager Profiles
- Comprehensive career statistics for all managers
- Regular season and playoff records
- Championship history and achievements
- Average finishing position analysis

### ⚔️ Head-to-Head Matchups
- Historical matchup data between any two managers
- Regular season vs playoff meeting breakdown
- Top rivalries and most frequent opponents
- Interactive matchup matrix

### 📊 League Analytics
- Championship distribution and era analysis
- Most dominant regular seasons
- Worst records to win championships (Cinderella stories)
- Best average finishes and consistency rankings

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Data Processing**: Custom TypeScript parser
- **Deployment**: Ready for Vercel/Netlify

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Generate data from source**:
   ```bash
   npm run generate-data
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/           # React components
│   └── Layout.tsx       # Main layout component
├── data/               # Data processing and storage
│   ├── parser.ts       # Markdown to JSON parser
│   └── hockey-data.json # Processed league data
├── pages/              # Next.js pages
│   ├── index.tsx       # Season Explorer
│   ├── managers.tsx    # Manager Profiles
│   ├── head-to-head.tsx # Head-to-Head Analysis
│   └── analytics.tsx   # League Analytics
├── scripts/           # Build and utility scripts
└── styles/            # Global styles
```

## Data Summary

- **Total Seasons**: 13 (2011-2024, excluding 2016)
- **Total Managers**: 24 unique managers
- **Most Championships**: Dave (4 titles)
- **Data Source**: Manually curated from league records

## Key Features

### Advanced Analytics
- **Era Analysis**: Early (2011-2015), Middle (2017-2021), Modern (2022-2024)
- **Dominance Metrics**: Win percentage, consistency, championship distribution
- **Upset Analysis**: Lowest-seeded champions and major upsets

### Interactive Features
- **Responsive Design**: Mobile-friendly interface
- **Dynamic Filtering**: Filter by manager, season, or matchup
- **Sortable Tables**: Multi-column sorting on all data tables
- **Export Ready**: Built for future PDF/CSV export functionality

## Future Enhancements

### Phase 2 (Web Hosting)
- Deploy to Vercel/Netlify for public access
- Custom domain configuration
- Performance optimization
- Analytics tracking

### Phase 3 (Advanced Features)
- Interactive charts and visualizations
- Season comparison tools
- Advanced filtering options
- Shareable manager profile pages
- Admin interface for data updates

## Contributing

This project tracks a private fantasy hockey league. Data updates are managed internally, but suggestions for features and improvements are welcome.

## License

MIT License - See LICENSE file for details

---

**Built with ❤️ for fantasy hockey enthusiasts**