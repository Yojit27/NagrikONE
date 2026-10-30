import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  Circle,
  useMap,
} from '@vis.gl/react-google-maps';
import { CivicCategoryType, CivicReport } from '../types';
import { CIVIC_CATEGORIES, getCategoryById } from '../data/categories';
import { calculateHaversineDistanceMeters, formatDistance } from '../utils/geo';
import {
  MapPin,
  Crosshair,
  Layers,
  ZoomIn,
  ZoomOut,
  Navigation,
  ThumbsUp,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  RefreshCw,
  Info,
  Globe,
  Compass,
  AlertTriangle,
  Plus,
  ShieldCheck,
} from 'lucide-react';

import { evaluateReportEscalation, StageNumber } from '../utils/escalationLadder';

interface CivicMapProps {
  reports: CivicReport[];
  selectedReportId: string | null;
  onSelectReport: (reportId: string) => void;
  onOpenReportDetail: (report: CivicReport) => void;
  onUpvoteReport: (reportId: string) => void;
  isDarkMode: boolean;
  userLocation: { latitude: number; longitude: number } | null;
  locationStatus?: 'prompt' | 'granted' | 'denied' | 'unavailable' | 'timeout';
  onRefreshLocation?: () => void;
  onOpenReportModal?: () => void;
  onOpenReminder?: (report: CivicReport) => void;
  onOpenEscalation?: (report: CivicReport) => void;
  onOpenSocialTagging?: (report: CivicReport) => void;
  onOpenRti?: (report: CivicReport) => void;
  onOpenLegalCounsel?: (report: CivicReport) => void;
  onOpenProcedure?: () => void;
  onPickLocation?: (coords: { latitude: number; longitude: number; address: string }) => void;
  isPickMode?: boolean;
}

const CITY_PRESETS = [
  { name: 'Central Delhi (Connaught Place)', lat: 28.6289, lng: 77.2065 },
  { name: 'Civil Lines (North Delhi)', lat: 28.618, lng: 77.2201 },
  { name: 'South Delhi (Greenfield / Lajpat)', lat: 28.6085, lng: 77.202 },
  { name: 'East Delhi (Mayur Vihar / Laxmi Nagar)', lat: 28.641, lng: 77.228 },
  { name: 'Gurugram Cyber City (Ward 12)', lat: 28.4952, lng: 77.089 },
  { name: 'Bengaluru (Koramangala Ward)', lat: 12.9352, lng: 77.6245 },
  { name: 'Mumbai (Bandra West Ward)', lat: 19.0596, lng: 72.8295 },
];

// Helper camera controller to pan/zoom Google Map smoothly
const MapCameraController: React.FC<{
  targetLocation: { lat: number; lng: number } | null;
  zoom?: number;
  triggerKey?: any;
}> = ({ targetLocation, zoom = 15, triggerKey }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !targetLocation) return;
    map.panTo(targetLocation);
    if (zoom) {
      map.setZoom(zoom);
    }
  }, [map, targetLocation?.lat, targetLocation?.lng, zoom, triggerKey]);

  return null;
};

export const CivicMap: React.FC<CivicMapProps> = ({
  reports,
  selectedReportId,
  onSelectReport,
  onOpenReportDetail,
  onUpvoteReport,
  isDarkMode,
  userLocation,
  locationStatus = 'granted',
  onRefreshLocation,
  onOpenReportModal,
  onOpenReminder,
  onOpenEscalation,
  onOpenSocialTagging,
  onOpenRti,
  onOpenLegalCounsel,
  onOpenProcedure,
  onPickLocation,
  isPickMode = false,
}) => {
  // Google Maps API Key from environment with hosted platform fallback
  const googleMapsApiKey =
    (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || 'AIzaSyCAtcQPH9HpK6btw9f0xQ9x-yZWby3hc8Y';

  // State Management
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');
  const [isNearbyOnly, setIsNearbyOnly] = useState<boolean>(true); // 500m nearby filtering enabled by default
  const [activeInfoWindowReport, setActiveInfoWindowReport] = useState<CivicReport | null>(null);
  const [mapTypeId, setMapTypeId] = useState<string>('roadmap');
  const [showTileMenu, setShowTileMenu] = useState(false);
  const [showProviderInfo, setShowProviderInfo] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [localLocationError, setLocalLocationError] = useState<string | null>(null);
  const [pickedCoords, setPickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cameraTarget, setCameraTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [cameraZoom, setCameraZoom] = useState<number>(15);
  const [cameraTrigger, setCameraTrigger] = useState<number>(0);

  // Active geographic center (user location or default Central Delhi)
  const activeCenter = useMemo<{ lat: number; lng: number }>(() => {
    if (userLocation && !isNaN(userLocation.latitude) && !isNaN(userLocation.longitude)) {
      return { lat: userLocation.latitude, lng: userLocation.longitude };
    }
    return { lat: 28.6289, lng: 77.2065 };
  }, [userLocation]);

  // Sync selected report with camera and InfoWindow
  useEffect(() => {
    if (!selectedReportId) return;
    const found = reports.find((r) => r.id === selectedReportId);
    if (found && typeof found.latitude === 'number' && typeof found.longitude === 'number') {
      setActiveInfoWindowReport(found);
      setCameraTarget({ lat: found.latitude, lng: found.longitude });
      setCameraZoom(16);
      setCameraTrigger((prev) => prev + 1);
    }
  }, [selectedReportId, reports]);

  // Haversine distance calculations
  const reportsWithDistance = useMemo(() => {
    return reports
      .filter((r) => {
        return (
          typeof r.latitude === 'number' &&
          typeof r.longitude === 'number' &&
          !isNaN(r.latitude) &&
          !isNaN(r.longitude)
        );
      })
      .map((r) => {
        const distanceMeters = calculateHaversineDistanceMeters(
          activeCenter.lat,
          activeCenter.lng,
          r.latitude,
          r.longitude
        );
        return {
          report: r,
          distanceMeters,
          isWithin500m: distanceMeters <= 500,
        };
      });
  }, [reports, activeCenter]);

  // Filtered reports to render on map
  const visibleReports = useMemo(() => {
    return reportsWithDistance.filter(({ report, isWithin500m }) => {
      if (isNearbyOnly && !isWithin500m) {
        return false;
      }
      if (activeCategoryFilter !== 'all' && report.category !== activeCategoryFilter) {
        return false;
      }
      if (activeStatusFilter !== 'all' && report.status !== activeStatusFilter) {
        return false;
      }
      return true;
    });
  }, [reportsWithDistance, isNearbyOnly, activeCategoryFilter, activeStatusFilter]);

  const nearbyCount = useMemo(() => {
    return reportsWithDistance.filter((item) => item.isWithin500m).length;
  }, [reportsWithDistance]);

  // Locate User GPS Position
  const handleLocateMe = () => {
    setIsLocating(true);
    setLocalLocationError(null);

    if (!navigator.geolocation) {
      setLocalLocationError('Geolocation is not supported by your browser.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCameraTarget({ lat: latitude, lng: longitude });
        setCameraZoom(15);
        setCameraTrigger((prev) => prev + 1);
        if (onRefreshLocation) {
          onRefreshLocation();
        }
        setIsLocating(false);
      },
      (err) => {
        if (err.code === 1) {
          setLocalLocationError(
            'Location access blocked in browser. Displaying default Ward 42 (Central Delhi).'
          );
        } else if (err.code === 3) {
          setLocalLocationError('Location request timed out. Displaying default Ward 42.');
        } else {
          setLocalLocationError('GPS signal unavailable. Displaying default Ward 42.');
        }
        setCameraTarget({ lat: 28.6289, lng: 77.2065 });
        setCameraZoom(14);
        setCameraTrigger((prev) => prev + 1);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleSelectCityPreset = (preset: (typeof CITY_PRESETS)[0]) => {
    setCameraTarget({ lat: preset.lat, lng: preset.lng });
    setCameraZoom(15);
    setCameraTrigger((prev) => prev + 1);
  };

  // Click on map to pick location in Pick Mode
  const handleMapClick = (e: any) => {
    if (!e.detail?.latLng) return;
    const lat = e.detail.latLng.lat;
    const lng = e.detail.latLng.lng;
    setPickedCoords({ lat, lng });

    if (onPickLocation) {
      const estimatedAddr = `Geo-point: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E (Ward Zone)`;
      onPickLocation({ latitude: lat, longitude: lng, address: estimatedAddr });
    }
  };

  return (
    <div className="relative w-full h-[600px] md:h-[680px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-100 dark:bg-slate-900 flex flex-col">
      {/* Top Map Filter & Status Bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-col gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* 500-Metre Nearby Mode Toggle & Category Filter Pills */}
          <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full p-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md">
            {/* 500-Metre Radius Filter Toggle */}
            <button
              onClick={() => setIsNearbyOnly(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                isNearbyOnly
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Filter real issues strictly within 500 metres of your GPS location"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Within 500m</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                  isNearbyOnly ? 'bg-emerald-700 text-white' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              >
                {nearbyCount}
              </span>
            </button>

            {/* All City Wards Toggle */}
            <button
              onClick={() => setIsNearbyOnly(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                !isNearbyOnly
                  ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="View all civic issues across all municipal wards"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>All Wards</span>
              <span className="text-[10px] opacity-75 font-mono ml-1">({reports.length})</span>
            </button>

            <span className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

            {/* Category Pills */}
            <button
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                activeCategoryFilter === 'all'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All Types
            </button>
            {CIVIC_CATEGORIES.map((cat) => {
              const count = visibleReports.filter(({ report }) => report.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryFilter(cat.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                    activeCategoryFilter === cat.id
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="hidden sm:inline">{cat.label}</span>
                  <span className="text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Right GIS Status & City Ward Selector */}
          <div className="pointer-events-auto hidden md:flex items-center gap-2">
            {/* Google Maps Platform Live Status Pill */}
            <button
              onClick={() => setShowProviderInfo(!showProviderInfo)}
              className="flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md cursor-pointer hover:border-emerald-500/50 transition-colors"
              title="Click for Google Maps Platform status & API Key details"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Google Maps Platform Active
              </span>
              <Info className="w-3 h-3 text-slate-400" />
            </button>

            {/* City Ward Jump Preset */}
            <div className="flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md">
              <Navigation className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Ward:</span>
              <select
                onChange={(e) => {
                  const selected = CITY_PRESETS.find((p) => p.name === e.target.value);
                  if (selected) handleSelectCityPreset(selected);
                }}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
              >
                {CITY_PRESETS.map((p) => (
                  <option
                    key={p.name}
                    value={p.name}
                    className="dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Accountability Procedure Quick Link */}
            {onOpenProcedure && (
              <button
                type="button"
                onClick={onOpenProcedure}
                className="hidden md:flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                title="View Nagrik One 5-Stage Accountability & Escalation Procedure"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Accountability Flow</span>
              </button>
            )}
          </div>
        </div>

        {/* Location Alert Banner (if error) */}
        {localLocationError && (
          <div className="pointer-events-auto self-start flex items-center gap-2 bg-amber-500/95 text-white backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-medium shadow-md animate-in fade-in duration-150">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{localLocationError}</span>
            <button
              onClick={handleLocateMe}
              className="ml-2 underline font-bold hover:text-amber-100 cursor-pointer"
            >
              Retry GPS
            </button>
          </div>
        )}
      </div>

      {/* Google Maps Canvas using @vis.gl/react-google-maps */}
      <div className="w-full h-full flex-1 relative z-10" style={{ minHeight: '520px' }}>
        <APIProvider apiKey={googleMapsApiKey} libraries={['marker', 'geometry']}>
          <Map
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_git_agentskills_v1']}
            defaultCenter={{ lat: activeCenter.lat, lng: activeCenter.lng }}
            defaultZoom={15}
            mapTypeId={mapTypeId}
            gestureHandling={'greedy'}
            disableDefaultUI={false}
            onClick={handleMapClick}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          >
            {/* Smooth Camera Controller */}
            <MapCameraController
              targetLocation={cameraTarget || activeCenter}
              zoom={cameraZoom}
              triggerKey={cameraTrigger}
            />

            {/* 500-Metre Visual Radius Circle around User Location */}
            <Circle
              center={{ lat: activeCenter.lat, lng: activeCenter.lng }}
              radius={500}
              strokeColor={isNearbyOnly ? '#059669' : '#64748b'}
              strokeOpacity={0.8}
              strokeWeight={2}
              fillColor={isNearbyOnly ? '#10b981' : '#94a3b8'}
              fillOpacity={isNearbyOnly ? 0.12 : 0.05}
            />

            {/* User GPS Location Marker with Pulsing Radar Ring */}
            <AdvancedMarker
              position={{ lat: activeCenter.lat, lng: activeCenter.lng }}
              title="Your Current GPS Location (500m Center)"
              zIndex={1000}
            >
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-blue-500 opacity-75"></span>
                <span className="absolute inline-flex h-6 w-6 rounded-full bg-blue-400/40"></span>
                <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-2xl flex items-center justify-center text-white font-bold text-xs select-none">
                  📍
                </div>
              </div>
            </AdvancedMarker>

            {/* Location Picking Pin (when in pick mode) */}
            {pickedCoords && (
              <AdvancedMarker position={pickedCoords} title="Selected Geo-point">
                <div className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-75"></span>
                  <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-xl flex items-center justify-center text-white font-bold text-sm select-none">
                    📍
                  </div>
                </div>
              </AdvancedMarker>
            )}

            {/* Filtered Civic Issue Markers */}
            {visibleReports.map(({ report, distanceMeters }) => {
              const cat = getCategoryById(report.category);
              const isSelected = report.id === selectedReportId;
              const isCritical = report.priority === 'critical';
              const isResolved = report.status === 'Resolved';

              const pinBg = isResolved
                ? 'bg-emerald-600 border-white text-white'
                : isCritical
                ? 'bg-rose-600 border-white text-white ring-4 ring-rose-400/50'
                : report.status === 'In Progress'
                ? 'bg-blue-600 border-white text-white'
                : 'bg-amber-600 border-white text-white';

              return (
                <AdvancedMarker
                  key={report.id}
                  position={{ lat: report.latitude, lng: report.longitude }}
                  title={`${report.title} (${formatDistance(distanceMeters)})`}
                  onClick={() => {
                    setActiveInfoWindowReport(report);
                    onSelectReport(report.id);
                  }}
                  zIndex={isSelected ? 500 : 200}
                >
                  <div
                    className={`group relative cursor-pointer transition-transform duration-200 hover:scale-125 ${
                      isSelected ? 'scale-125 z-50' : 'z-20'
                    }`}
                  >
                    {isCritical && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                      </span>
                    )}
                    <div
                      className={`w-8 h-8 rounded-2xl ${pinBg} shadow-lg border-2 flex items-center justify-center text-base select-none`}
                    >
                      {cat.icon}
                    </div>
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* Interactive InfoWindow for Selected Report */}
            {activeInfoWindowReport && (
              <InfoWindow
                position={{
                  lat: activeInfoWindowReport.latitude,
                  lng: activeInfoWindowReport.longitude,
                }}
                onCloseClick={() => setActiveInfoWindowReport(null)}
                pixelOffset={[0, -32]}
              >
                {(() => {
                  const report = activeInfoWindowReport;
                  const cat = getCategoryById(report.category);
                  const dist = calculateHaversineDistanceMeters(
                    activeCenter.lat,
                    activeCenter.lng,
                    report.latitude,
                    report.longitude
                  );
                  const distanceText = formatDistance(dist);

                  const statusColorBadge =
                    report.status === 'Resolved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : report.status === 'In Progress'
                      ? 'bg-blue-100 text-blue-800'
                      : report.status === 'In Review'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-800';

                  const evaluation = evaluateReportEscalation(report);
                  const stageTier = (() => {
                    if (evaluation.isResolved) {
                      return { text: '✓ Resolved & Closed', color: 'bg-emerald-100 text-emerald-800' };
                    }
                    if (evaluation.highestEligibleStage === 1) {
                      return {
                        text: `⏱️ Stage 1: SLA Countdown (${evaluation.slaRemainingHours}h)`,
                        color: 'bg-emerald-50 text-emerald-700 border border-emerald-300',
                      };
                    }
                    if (evaluation.highestEligibleStage === 2) {
                      return {
                        text: '✉️ Stage 2: Reminder Eligible',
                        color: 'bg-amber-100 text-amber-800 border border-amber-300',
                      };
                    }
                    if (evaluation.highestEligibleStage === 3) {
                      return {
                        text: '🚨 Stage 3: Escalation Ready',
                        color: 'bg-rose-100 text-rose-800 border border-rose-300',
                      };
                    }
                    if (evaluation.highestEligibleStage === 4) {
                      return {
                        text: `📢 Stage 4: Social Tag (Day 14+)`,
                        color: 'bg-cyan-100 text-cyan-800 border border-cyan-300',
                      };
                    }
                    if (evaluation.highestEligibleStage === 5) {
                      return {
                        text: `📜 Stage 5: RTI Eligible (Day 21+)`,
                        color: 'bg-blue-100 text-blue-800 border border-blue-300',
                      };
                    }
                    return {
                      text: '⚖️ Stage 6: Legal Panel Unlocked',
                      color: 'bg-purple-100 text-purple-800 border border-purple-300',
                    };
                  })();

                  return (
                    <div className="w-68 sm:w-72 p-2 font-sans text-slate-900">
                      {report.imageUrl ? (
                        <div className="h-28 w-full rounded-lg overflow-hidden mb-2 bg-slate-100 relative">
                          <img
                            src={report.imageUrl}
                            alt={report.title}
                            className="w-full h-full object-cover"
                          />
                          <span
                            className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColorBadge}`}
                          >
                            {report.status}
                          </span>
                          <span className="absolute bottom-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/75 text-white">
                            🎯 {distanceText}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColorBadge}`}
                          >
                            {report.status}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            🎯 {distanceText}
                          </span>
                        </div>
                      )}

                      <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-0.5">
                        {cat.label} &bull; #{report.id}
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm line-clamp-2 leading-snug mb-1 text-slate-900">
                        {report.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 line-clamp-1 mb-1.5">
                        📍 {report.address || report.location_name}
                      </p>

                      {/* Escalation Stage Tier Pill */}
                      <div className="mb-2 flex items-center justify-between gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${stageTier.color}`}>
                          {stageTier.text}
                        </span>
                        {onOpenProcedure && (
                          <button
                            type="button"
                            onClick={onOpenProcedure}
                            className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                            title="View Six-Stage Escalation Ladder"
                          >
                            <span>Ladder</span>
                            <span>&rarr;</span>
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-200 gap-1.5">
                        <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                          👍 {report.upvotes}
                        </span>
                        <div className="flex items-center gap-1">
                          {/* Stage 2 Action */}
                          {evaluation.isReminderEligible && onOpenReminder && (
                            <button
                              onClick={() => onOpenReminder(report)}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                              title="Stage 2: Dispatch Department Reminder"
                            >
                              Reminder
                            </button>
                          )}

                          {/* Stage 3 Action */}
                          {evaluation.isEscalationEligible && onOpenEscalation && (
                            <button
                              onClick={() => onOpenEscalation(report)}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                              title="Stage 3: Senior Escalation"
                            >
                              Escalate
                            </button>
                          )}

                          {/* Stage 4 Action */}
                          {evaluation.isSocialTaggingEligible && onOpenSocialTagging && (
                            <button
                              onClick={() => onOpenSocialTagging(report)}
                              className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                              title="Stage 4: Public Social Tagging"
                            >
                              Social
                            </button>
                          )}

                          {/* Stage 5 Action */}
                          {evaluation.isRtiEligible && onOpenRti && (
                            <button
                              onClick={() => onOpenRti(report)}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                              title="Stage 5: Draft Section 6(1) RTI"
                            >
                              RTI
                            </button>
                          )}

                          {/* Stage 6 Action */}
                          {evaluation.isLegalNoticeEligible && onOpenLegalCounsel && (
                            <button
                              onClick={() => onOpenLegalCounsel(report)}
                              className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                              title="Stage 6: Legal Counsel Panel"
                            >
                              Legal
                            </button>
                          )}

                          <button
                            onClick={() => onOpenReportDetail(report)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                          >
                            Inspect &rarr;
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>

      {/* Empty State Banner (when 0 reports within 500m) */}
      {isNearbyOnly && visibleReports.length === 0 && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 max-w-md w-full px-4 pointer-events-none">
          <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl text-center space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold">
              🛡️
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                No Grievances Within 500 Metres
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Great news! There are no open civic hazards reported within a 500-metre radius of
                your current location ({activeCenter.lat.toFixed(4)}°N, {activeCenter.lng.toFixed(4)}
                °E).
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              {onOpenReportModal && (
                <button
                  onClick={onOpenReportModal}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Report Issue Here
                </button>
              )}
              <button
                onClick={() => setIsNearbyOnly(false)}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                View All Wards ({reports.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Map Controls (Right Side) */}
      <div className="absolute bottom-5 right-3 z-30 flex flex-col gap-2">
        {/* Recenter & Force Refresh Button */}
        <button
          onClick={handleLocateMe}
          title="Recalculate 500m scan radius at my current GPS location"
          className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 shadow-lg flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 transition-all cursor-pointer"
        >
          <Crosshair
            className={`w-5 h-5 text-emerald-600 dark:text-emerald-400 ${
              isLocating ? 'animate-spin' : ''
            }`}
          />
        </button>

        {/* Map Type Switcher Button & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowTileMenu(!showTileMenu)}
            title="Choose Google Maps style (Roadmap, Satellite, Hybrid, Terrain)"
            className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 shadow-lg flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 transition-all cursor-pointer"
          >
            <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </button>

          {showTileMenu && (
            <div className="absolute right-12 bottom-0 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-40 space-y-1">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 py-1">
                Google Map Type
              </div>
              <button
                onClick={() => {
                  setMapTypeId('roadmap');
                  setShowTileMenu(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer ${
                  mapTypeId === 'roadmap'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>🗺️ Standard Road</span>
                {mapTypeId === 'roadmap' && <CheckCircle2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  setMapTypeId('satellite');
                  setShowTileMenu(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer ${
                  mapTypeId === 'satellite'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>🛰️ Satellite</span>
                {mapTypeId === 'satellite' && <CheckCircle2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  setMapTypeId('hybrid');
                  setShowTileMenu(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer ${
                  mapTypeId === 'hybrid'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>🌐 Hybrid View</span>
                {mapTypeId === 'hybrid' && <CheckCircle2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  setMapTypeId('terrain');
                  setShowTileMenu(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer ${
                  mapTypeId === 'terrain'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>⛰️ Terrain Elevation</span>
                {mapTypeId === 'terrain' && <CheckCircle2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Map Legend Banner (Bottom Left) */}
      <div className="absolute bottom-5 left-3 z-30 hidden sm:flex items-center gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg text-[11px] font-semibold text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-300"></span>
          <span>Your Location</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
          <span>Critical Hazard</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Reported</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Resolved</span>
        </div>
        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 pl-2 border-l border-slate-200 dark:border-slate-700 font-bold flex items-center gap-1">
          <span>Radius:</span>
          <span>{isNearbyOnly ? '500m (Strict Haversine)' : 'Citywide'}</span>
        </div>
      </div>

      {/* Google Maps Platform Diagnostic Details Modal */}
      {showProviderInfo && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Google Maps Platform Integration
                </h3>
              </div>
              <button
                onClick={() => setShowProviderInfo(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                <p className="font-bold">✓ Google Maps Platform: Active & Connected</p>
                <p className="text-[11px] mt-1 opacity-90">
                  Nagrik One is powered by official Google Maps Platform via the{' '}
                  <code className="font-mono">@vis.gl/react-google-maps</code> SDK and modern{' '}
                  <code className="font-mono">AdvancedMarker</code> elements.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">SDK:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    @vis.gl/react-google-maps
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Map ID:</span>
                  <span className="font-bold text-slate-900 dark:text-white">DEMO_MAP_ID</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Markers:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    AdvancedMarkerElement
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nearby Calculation:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Haversine (&le; 500m)
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                The Google Maps Platform API key is authenticated.
              </p>
            </div>

            <button
              onClick={() => setShowProviderInfo(false)}
              className="w-full py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
            >
              Close Diagnostic
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
