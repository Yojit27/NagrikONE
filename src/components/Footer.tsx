import React from 'react';
import { Instagram, Shield, Heart } from 'lucide-react';

interface FooterProps {
  onSelectTab?: (tab: 'home' | 'map' | 'sahayak' | 'badges' | 'analytics' | 'procedure') => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand & Mission Statement */}
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-0.5 flex items-center justify-center shadow-sm shadow-blue-500/10 shrink-0">
            <img
              src="/logo-icon.svg"
              alt="Nagrik One Official Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 justify-center sm:justify-start">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                Nagrik<span className="text-blue-600 dark:text-blue-400">One</span> AI
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
                Civic Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Your City &bull; Your Voice &bull; Our Action &bull; Citizen grievance redressal & municipal accountability.
            </p>
          </div>
        </div>

        {/* Social Media & Official Links */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onSelectTab && (
            <button
              onClick={() => onSelectTab('procedure')}
              className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Our Procedure</span>
            </button>
          )}

          {/* Official Instagram Link */}
          <a
            href="https://www.instagram.com/naagrikone?utm_source=qr&dlrf=MXF2azExZ3J1dzZvdg=="
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow Nagrik One on Instagram @naagrikone (opens in a new tab)"
            className="group flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 hover:bg-gradient-to-r hover:from-purple-500/10 hover:via-pink-500/10 hover:to-amber-500/10 hover:border-pink-500/30 text-slate-700 dark:text-slate-300 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Instagram className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold leading-none block">@naagrikone</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight">
                Follow us on Instagram
              </span>
            </div>
          </a>

          {/* Copyright / Citizen Charter badge */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 pl-3 border-l border-slate-200 dark:border-slate-800">
            <span>Built for Citizens</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span>Open Governance</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
