import React from 'react';
import Head from 'next/head';
import { Trophy, Users, Target, BarChart3 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const formatSeason = (year: number) => `${year}-${year + 1}`;

export default function Layout({ children, title = 'Fantasy Hockey Dashboard' }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Fantasy Hockey League Dashboard - Statistics and Analytics 2011-2026" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-hockey-primary">
        {/* Header */}
        <header className="bg-hockey-surface border-b border-hockey-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center min-w-0">
                <Trophy className="h-6 w-6 sm:h-7 sm:w-7 mr-3 text-hockey-secondary flex-shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-semibold text-slate-100 truncate">Fantasy Hockey Dashboard</h1>
                  <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">League Statistics 2011-2026</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center space-x-4 text-slate-500">
                <div className="text-sm">
                  14 Seasons • 25 Managers
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="bg-hockey-surface border-b border-hockey-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-2 sm:space-x-8 overflow-x-auto scrollbar-hide">
              <NavItem href="/" icon={<Target className="h-4 w-4 sm:h-5 sm:w-5 text-hockey-secondary" />} label="Season Explorer" />
              <NavItem href="/managers" icon={<Users className="h-4 w-4 sm:h-5 sm:w-5 text-hockey-secondary" />} label="Manager Profiles" />
              <NavItem href="/visualizations" icon={<BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-hockey-secondary" />} label="Visualizations" />
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-hockey-surface border-t border-hockey-border mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-slate-500">
              <p>Fantasy Hockey Dashboard &copy; 2025</p>
              <p className="text-sm mt-2">
                Data spans 2011-2026 (excluding 2016, 2019) • Built with React & Next.js
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

function NavItem({ href, icon, label }: NavItemProps) {
  return (
    <a
      href={href}
      className="flex items-center space-x-1 sm:space-x-2 py-4 px-1 sm:px-2 border-b-2 border-transparent text-slate-400 hover:text-slate-100 hover:border-hockey-secondary transition-colors whitespace-nowrap"
    >
      {icon}
      <span className="font-medium text-sm sm:text-base">{label}</span>
    </a>
  );
}
