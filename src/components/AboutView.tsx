import React, { useState } from 'react';
import {
  ArrowLeft,
  Verified,
  Shield,
  Layers,
  Wrench,
  Droplet,
  Zap,
  Car,
  Instagram,
  ArrowUpRight,
  ArrowRight,
  ExternalLink,
  Scale,
  Users,
  Code2,
  Globe,
  Sparkles,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

import { useLanguageTheme } from '../context/LanguageThemeContext';

interface AboutViewProps {
  onReturnHome: () => void;
  onOpenProfile?: () => void;
  onOpenProcedure?: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({
  onReturnHome,
  onOpenProfile,
  onOpenProcedure,
}) => {
  const { t } = useLanguageTheme();

  return (
    <div className="flex flex-col w-full pb-16 space-y-6 max-w-4xl mx-auto px-4 sm:px-6">
      {/* Interactive Return Header & Civic Pulse */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onReturnHome}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200 dark:bg-[#262a34] text-slate-800 dark:text-[#dfe2ef] hover:bg-slate-300 dark:hover:bg-[#31353f] active:scale-95 transition-all focus:outline-none shadow-md cursor-pointer text-sm font-semibold"
        >
          <span className="material-symbols-outlined text-[18px] text-emerald-500">arrow_back</span>
          <span>{t('btnReturnHome', 'Return Home')}</span>
        </button>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-200/80 dark:bg-[#1c1f29] border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-[#bacbbe] text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bold tracking-wider uppercase text-[11px] text-emerald-500">
            Gov Grid Live
          </span>
        </div>
      </div>

      {/* Hero Visual / Brand Statement */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#181b25] dark:to-[#1c1f29] border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8">
        <div className="absolute -right-10 -bottom-10 w-52 h-52 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#31353f] border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-emerald-500 text-[26px]">account_balance</span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-extrabold">
                Civic Tech Protocol
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                NagrikOne AI
              </h2>
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-600 dark:text-[#bacbbe] leading-relaxed pt-1">
            NagrikOne AI bridges citizens with urban local governance to hold municipal authorities
            accountable with transparency, real-time AI triage, and citizen-led verification.
          </p>
        </div>
      </div>

      {/* Operational Architecture Breakdown */}
      <section className="flex flex-col space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Operational Routing
          </h3>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            Automated Triage
          </span>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#1c1f29] border border-slate-200 dark:border-slate-800/80 p-5 sm:p-6 shadow-md space-y-4">
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            Every verified report is automatically geocoded, deduplicated, and routed to the
            jurisdictional PWD, Municipal Corporation, Jal Board (Water &amp; Sanitation),
            Electricity Departments, or Traffic authorities. Track progress with real-time audit
            checkpoints, AI triage, and RTI drafting.
          </p>

          {/* Department Badges Flow */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-[#262a34] text-slate-900 dark:text-[#dfe2ef] border border-slate-200/60 dark:border-slate-700/60">
              <span className="material-symbols-outlined text-emerald-500 text-[20px] shrink-0">engineering</span>
              <span className="text-xs font-semibold truncate">Public Works (PWD)</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-[#262a34] text-slate-900 dark:text-[#dfe2ef] border border-slate-200/60 dark:border-slate-700/60">
              <span className="material-symbols-outlined text-cyan-500 text-[20px] shrink-0">water_drop</span>
              <span className="text-xs font-semibold truncate">Jal Board (Water)</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-[#262a34] text-slate-900 dark:text-[#dfe2ef] border border-slate-200/60 dark:border-slate-700/60">
              <span className="material-symbols-outlined text-amber-500 text-[20px] shrink-0">bolt</span>
              <span className="text-xs font-semibold truncate">Power &amp; Grid</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-[#262a34] text-slate-900 dark:text-[#dfe2ef] border border-slate-200/60 dark:border-slate-700/60">
              <span className="material-symbols-outlined text-purple-500 text-[20px] shrink-0">traffic</span>
              <span className="text-xs font-semibold truncate">Urban Traffic Desk</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Official Social & Community Channels */}
      <section className="flex flex-col space-y-3">
        <div className="px-1">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Direct Dispatch &amp; Feeds
          </h3>
        </div>

        {/* Instagram Highlight Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#1c1f29] dark:to-[#262a34] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white dark:bg-[#0a0e17] border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-emerald-500 text-[26px]">photo_camera</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    @NagrikOne.ai
                  </span>
                  <span className="material-symbols-outlined text-emerald-500 text-[16px]">verified</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-[#bacbbe]">
                  Daily resolution briefs &amp; field audits
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <a
              href="https://www.instagram.com/naagrikone?utm_source=qr&dlrf=MXF2azExZ3J1dzZvdg=="
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(0,229,153,0.3)] active:scale-98 transition-transform cursor-pointer"
            >
              <span>Open Civic Instagram</span>
              <span className="material-symbols-outlined text-[16px]">north_east</span>
            </a>
          </div>
        </div>
      </section>

      {/* AI Models & Technology Architecture Section */}
      <section className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                AI Models &amp; Technology Architecture
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#bacbbe] mt-1 max-w-2xl leading-relaxed">
              NagrikOne combines state-of-the-art multimodal generative AI models with specialized forensic agents and sovereign cloud infrastructure to empower citizen reporting, automate municipal department dispatch, and verify evidence integrity.
            </p>
          </div>
          <span className="self-start sm:self-center px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            Verified Stack 2026
          </span>
        </div>

        {/* Responsive Grid of Verified Models and Services */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Gemini Chatbot */}
          <div className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-[#1c1f29] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-all group">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-[#262a34] border border-slate-200/80 dark:border-slate-700/80 p-2 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <img
                      src="/assets/aistudio/image_160f8253.png"
                      alt="Google Gemini Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                      Nagrik Sahayak AI (Gemini 3.1 Flash-Lite)
                    </h4>
                    <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      gemini-3.1-flash-lite
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                  AI Model
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-[#bacbbe] leading-relaxed">
                Powered by Gemini 3.1 Flash-Lite. Serves as the interactive civic chatbot advisor, answering municipal questions, navigating municipal jurisdictions (PWD, MCD, Jal Board, DISCOMs), providing emergency helplines (155304, 1913, 112, 311), and guiding Section 6(1) RTI Act 2005 requests.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Route: <code className="text-slate-700 dark:text-slate-300">/api/gemini/chat</code>
              </span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">Conversational AI</span>
            </div>
          </div>

          {/* Card 2: Voice Transcription Model */}
          <div className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-[#1c1f29] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-all group">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-[#262a34] border border-slate-200/80 dark:border-slate-700/80 p-2 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <img
                      src="/assets/aistudio/image_160f8253.png"
                      alt="Gemini Transcribe Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                      Multilingual Voice Input
                    </h4>
                    <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      gemini-3.5-transcribe
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                  AI Model
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-[#bacbbe] leading-relaxed">
                Converts spoken grievances into text across regional Indian languages (Hindi, Punjabi, Bengali, Kannada, Marathi, English) without premature translation. Audio is retained safely in volatile session memory for instant retry recovery, directly populating the citizen's report form.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Route: <code className="text-slate-700 dark:text-slate-300">/api/ai/transcribe</code>
              </span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">Speech-to-Text</span>
            </div>
          </div>

          {/* Card 3: Gemma Translation Integration */}
          <div className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-[#1c1f29] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/50 transition-all group">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 dark:bg-[#12151e] border border-indigo-500/40 p-2 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <img
                      src="/assets/aistudio/image_2bd92760.png"
                      alt="Gemma 4 Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                      <span>Report Field Translation</span>
                    </h4>
                    <span className="text-[11px] font-mono font-semibold text-indigo-500 dark:text-indigo-400">
                      gemma-4-26b-a4b-it
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                    AI Model
                  </span>
                  <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-tight">
                    Powered by Gemma 4
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-[#bacbbe] leading-relaxed">
                Performs section-wise English translation for civic grievances (Issue Title, Grievance Description, Landmark Address). Translates citizen vernacular into concise, professional English for municipal engineers while preserving original text separately and requiring citizen review.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Route: <code className="text-slate-700 dark:text-slate-300">/api/ai/translate</code>
              </span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">Municipal NLP</span>
            </div>
          </div>

          {/* Card 4: Gemini 3.8 Flash Severity & Civic Vision */}
          <div className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-[#1c1f29] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500/50 transition-all group">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-[#262a34] border border-slate-200/80 dark:border-slate-700/80 p-2 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <img
                      src="/assets/aistudio/image_160f8253.png"
                      alt="Gemini 3.8 Flash"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                      Civic Severity &amp; Vision
                    </h4>
                    <span className="text-[11px] font-mono font-semibold text-amber-600 dark:text-amber-400">
                      gemini-3.8-flash
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                  AI Model
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-[#bacbbe] leading-relaxed">
                Multimodal reasoning model evaluating civic hazards, SLA compliance, and calculating the 0–100 Severity Index. Also performs preliminary visual heuristic evaluations for potential synthetic or AI-generated anomalies with honest uncertainty (not definitive proof).
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Route: <code className="text-slate-700 dark:text-slate-300">/api/reports/analyze</code>
              </span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">Multimodal Reasoning</span>
            </div>
          </div>

          {/* Card 5: TinyFish AI Web Agent */}
          <div className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-[#1c1f29] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-orange-500/50 transition-all group">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-[#2b1f1a] border border-orange-200 dark:border-orange-900/60 p-1.5 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <img
                      src="/assets/aistudio/image_135cf538.png"
                      alt="TinyFish AI Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                      TinyFish Web Agent
                    </h4>
                    <span className="text-[11px] font-mono font-semibold text-orange-600 dark:text-orange-400">
                      Visual Web Forensics
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 shrink-0">
                  External AI Service
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-[#bacbbe] leading-relaxed">
                Investigates potential public online appearances or matches of submitted photos across indexed web sources to prevent duplicate reports or stock image reuse. Clarification: finding an online match does not independently prove fraud, and no match does not guarantee original capture.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                Route: <code className="text-slate-700 dark:text-slate-300">/api/verify-image</code>
              </span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">Reverse Web Crawling</span>
            </div>
          </div>

          {/* Card 6: Infrastructure & Platform Stack */}
          <div className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-[#1c1f29] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-cyan-500/50 transition-all group">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-[#262a34] border border-slate-200/80 dark:border-slate-700/80 p-2 flex items-center justify-center shrink-0 shadow-sm text-cyan-500 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[28px]">hub</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                      Platform Infrastructure
                    </h4>
                    <span className="text-[11px] font-mono font-semibold text-cyan-600 dark:text-cyan-400">
                      Firebase &bull; GIS &bull; Mail Dispatch
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 shrink-0">
                  Infrastructure
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-[#bacbbe] leading-relaxed">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">&bull;</span>
                  <span><b>Firestore &amp; Firebase Auth:</b> Real-time NoSQL persistence for civic reports, escalation ladder states, karma points, and citizen profiles.</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-cyan-500 font-bold">&bull;</span>
                  <span><b>GIS Geolocation:</b> Precision GPS mapping, automatic ward boundary resolution, and incident clustering via Leaflet &amp; OpenStreetMap.</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-purple-500 font-bold">&bull;</span>
                  <span><b>Automated Dispatcher:</b> Node.js SMTP service compiling formal grievance emails directly to municipal executive engineers.</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                Cloud Backend: <code className="text-slate-700 dark:text-slate-300">Firebase + Node Express</code>
              </span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">Core Services</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Civic Reporting Guidelines */}
      <section className="flex flex-col space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Reporting Directives
          </h3>
          <span className="text-[11px] font-medium text-slate-500 dark:text-[#bacbbe]">
            4 Rules of Verification
          </span>
        </div>

        <div className="space-y-2.5">
          {/* Directive 1 */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-[#1c1f29] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center text-xs font-extrabold shrink-0">
              1
            </div>
            <div className="flex flex-col">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Accurate Geolocation &amp; Sharp Imagery
              </h4>
              <p className="text-xs text-slate-600 dark:text-[#bacbbe] mt-0.5 leading-relaxed">
                Always upload clear, steady photos captured under sufficient lighting. Avoid
                vehicle dash-blur or oblique angles so Municipal Inspectors can pinpoint the defect spot.
              </p>
            </div>
          </div>

          {/* Directive 2 */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-[#1c1f29] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center text-xs font-extrabold shrink-0">
              2
            </div>
            <div className="flex flex-col">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Targeted Categorization
              </h4>
              <p className="text-xs text-slate-600 dark:text-[#bacbbe] mt-0.5 leading-relaxed">
                Select the exact taxonomy: Pothole &amp; Surface, Drainage Overflow, High-Tension
                Fault, or Waste Spill. Precise categorization prevents jurisdictional reassignment delays.
              </p>
            </div>
          </div>

          {/* Directive 3 */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-[#1c1f29] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-rose-500/15 text-rose-500 border border-rose-500/30 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">gavel</span>
            </div>
            <div className="flex flex-col">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Strictly Infrastructure Focus
              </h4>
              <p className="text-xs text-slate-600 dark:text-[#bacbbe] mt-0.5 leading-relaxed">
                Zero tolerance for hate speech, targeted personal harassment, or civil disputes.
                Reports containing defamatory content are scrubbed and reporters flagged.
              </p>
            </div>
          </div>

          {/* Directive 4 */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-[#1c1f29] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
            <div className="flex flex-col">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Community Verification &amp; Upvoting
              </h4>
              <p className="text-xs text-slate-600 dark:text-[#bacbbe] mt-0.5 leading-relaxed">
                Nearby residents can confirm or contest incidents. Reports with 5+ civic
                verifications gain immediate high-priority escalation in the Municipal Control Desk queue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Credits & Engineering Team */}
      <section className="flex flex-col pt-1">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#262a34] dark:to-[#1c1f29] border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-xl">
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#31353f] border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-2 shadow-md">
              <span className="material-symbols-outlined text-emerald-500 text-[24px]">code_blocks</span>
            </div>
            <span className="text-[11px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-extrabold mb-1">
              Architecture &amp; Development
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              Created &amp; Architected by
            </h3>

            {/* Team Roster */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 my-4 w-full">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#1c1f29] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs sm:text-sm font-bold">Yojit Chawla</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#1c1f29] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs sm:text-sm font-bold">Prakhar Jain</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#1c1f29] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs sm:text-sm font-bold">Saket Goel</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#bacbbe] max-w-sm leading-relaxed italic">
              "Built with passion for civic empowerment, smart governance, and citizen transparency."
            </p>

            {/* Civic Stamp Badge */}
            <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2 text-slate-500 dark:text-[#bacbbe]">
              <span className="material-symbols-outlined text-[16px] text-emerald-500">public</span>
              <span className="text-[11px] font-bold tracking-wider uppercase">
                Open Civic Standard v2.4
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Jump to 6-Stage Procedure & Legal FAQ */}
      {onOpenProcedure && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <span>Explore the Six-Stage Escalation Ladder</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Learn how citizen complaints advance from SLA countdown to RTI filing and legal notice.
            </p>
          </div>
          <button
            onClick={onOpenProcedure}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 cursor-pointer transition-colors shadow-sm"
          >
            View Procedure &rarr;
          </button>
        </div>
      )}

      {/* Return to Dashboard Bottom Button */}
      <div className="pt-2">
        <button
          onClick={onReturnHome}
          className="w-full py-3.5 rounded-full bg-slate-200 dark:bg-[#262a34] hover:bg-slate-300 dark:hover:bg-[#31353f] text-slate-900 dark:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-98 transition-all shadow-md cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] text-emerald-500">arrow_back</span>
          <span>Back to Civic Dashboard</span>
        </button>
      </div>
    </div>
  );
};
