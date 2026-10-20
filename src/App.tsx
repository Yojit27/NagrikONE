import React, { useState, useEffect } from 'react';
import {
  CivicReport,
  CivicBadge,
  CitizenProfile,
  CivicNotification,
  ReportStatus,
} from './types';
import { INITIAL_REPORTS } from './data/mockReports';
import { loadSavedBadges, evaluateBadges, saveBadges } from './data/badges';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { FeedView } from './components/FeedView';
import { CivicMap } from './components/CivicMap';
import { SahayakChat } from './components/SahayakChat';
import { BadgesView } from './components/BadgesView';
import { AnalyticsView } from './components/AnalyticsView';
import { ReportModal } from './components/ReportModal';
import { ReportDetailModal } from './components/ReportDetailModal';
import { ReminderModal } from './components/ReminderModal';
import { EscalationModal } from './components/EscalationModal';
import { SocialTaggingModal } from './components/SocialTaggingModal';
import { RtiGeneratorModal } from './components/RtiGeneratorModal';
import { LegalCounselModal } from './components/LegalCounselModal';
import { ProfileModal } from './components/ProfileModal';
import { Footer } from './components/Footer';
import { ProcedureView } from './components/ProcedureView';
import { AuthScreen } from './components/AuthScreen';
import { X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playThemeToggleSound, playSuccessChime, playBadgeUnlockSound } from './utils/audio';
import { useAuth } from './context/AuthContext.tsx';
import {
  submitReportWithFirebase,
  subscribeToFirestoreReports,
  upvoteReportInFirestore,
  deleteReportFromFirestore,
  saveReportToFirestore,
} from './services/reportFirebaseService';
import { ConvertedJpgImage } from './utils/imageConverter';

const STORAGE_REPORTS_KEY = 'nagrikone_reports_v2';
const STORAGE_PROFILE_KEY = 'nagrikone_profile_v2';

const INITIAL_PROFILE: CitizenProfile = {
  id: 'CITIZEN-001',
  name: 'Citizen Sentinel',
  email: '',
  phone: '+91 98110 54219',
  karmaPoints: 120,
  levelTitle: 'Ward Sentinel (Level 2)',
  levelNumber: 2,
  verifiedId: false,
  ward: '42 (Central)',
  city: 'New Delhi NCR',
  reportsFiledCount: 0,
  upvotesGivenCount: 1,
  resolvedCount: 1,
};

const INITIAL_NOTIFICATIONS: CivicNotification[] = [
  {
    id: 'n1',
    title: 'Dispatched to PWD Division II',
    desc: 'Complaint #NGK-1021 marked In Progress. Road repair crew dispatched.',
    time: '25m ago',
    read: false,
    type: 'status_update',
  },
  {
    id: 'n2',
    title: 'Culvert Remediated & Resolved',
    desc: 'Drainage culvert on Market Road (#NGK-1025) verified clear by Zonal Engineer.',
    time: '3h ago',
    read: false,
    type: 'status_update',
  },
  {
    id: 'n3',
    title: 'Civic Milestone: Sentinel Active',
    desc: 'Ward 42 citizen reports are driving 22% faster municipal turnaround.',
    time: '1d ago',
    read: true,
    type: 'milestone',
  },
];

export default function App() {
  const { user, idToken, dbUser, loading: authLoading, isEmailVerified } = useAuth();
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | null>(null);
  const [isGuestBrowsing, setIsGuestBrowsing] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nagrikone_guest_browsing') === 'true';
    } catch {
      return false;
    }
  });
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [reports, setReports] = useState<CivicReport[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_REPORTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading reports:', e);
    }
    return INITIAL_REPORTS;
  });

  const [isReportsLoading, setIsReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState<string | null>(null);

  // Real-time synchronization of civic reports with Cloud Firestore
  useEffect(() => {
    setIsReportsLoading(true);
    const unsubscribe = subscribeToFirestoreReports(
      (firestoreReports) => {
        setIsReportsLoading(false);
        setReportsError(null);
        if (firestoreReports) {
          setReports((prev) => {
            const map = new Map<string, CivicReport>();
            // Baseline seed reports as fallback
            INITIAL_REPORTS.forEach((r) => map.set(r.id, r));
            // Real-time Firestore records override with authentic persisted data
            firestoreReports.forEach((r) => map.set(r.id, r));
            const merged = Array.from(map.values());
            merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return merged;
          });
        }
      },
      (err) => {
        setIsReportsLoading(false);
        setReportsError(err.message || 'Firestore reports synchronization error');
        console.warn('Real-time Firestore reports subscription note:', err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Sync profile when authenticated user or dbUser is loaded
  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        id: user.uid,
        name: user.displayName || dbUser?.displayName || (user.email ? user.email.split('@')[0] : prev.name),
        email: user.email || prev.email,
        verifiedId: isEmailVerified,
        karmaPoints: dbUser?.karmaPoints ?? prev.karmaPoints,
      }));
    } else {
      setProfile((prev) => ({
        ...prev,
        name: 'Citizen Sentinel',
        email: '',
        verifiedId: false,
      }));
    }
  }, [user, dbUser, isEmailVerified]);

  const [badges, setBadges] = useState<CivicBadge[]>(() => loadSavedBadges());
  const [profile, setProfile] = useState<CitizenProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROFILE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading profile:', e);
    }
    return INITIAL_PROFILE;
  });

  const [notifications, setNotifications] = useState<CivicNotification[]>(INITIAL_NOTIFICATIONS);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [activeDetailReport, setActiveDetailReport] = useState<CivicReport | null>(null);

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [reminderReport, setReminderReport] = useState<CivicReport | null>(null);
  const [escalationReport, setEscalationReport] = useState<CivicReport | null>(null);
  const [socialTaggingReport, setSocialTaggingReport] = useState<CivicReport | null>(null);
  const [rtiReport, setRtiReport] = useState<CivicReport | null>(null);
  const [legalCounselReport, setLegalCounselReport] = useState<CivicReport | null>(null);

  // Automatically dismiss open modals if their associated report is deleted concurrently
  useEffect(() => {
    if (activeDetailReport && !reports.some((r) => r.id === activeDetailReport.id)) {
      setActiveDetailReport(null);
    }
    if (reminderReport && !reports.some((r) => r.id === reminderReport.id)) {
      setReminderReport(null);
    }
    if (escalationReport && !reports.some((r) => r.id === escalationReport.id)) {
      setEscalationReport(null);
    }
    if (socialTaggingReport && !reports.some((r) => r.id === socialTaggingReport.id)) {
      setSocialTaggingReport(null);
    }
    if (rtiReport && !reports.some((r) => r.id === rtiReport.id)) {
      setRtiReport(null);
    }
    if (legalCounselReport && !reports.some((r) => r.id === legalCounselReport.id)) {
      setLegalCounselReport(null);
    }
  }, [reports, activeDetailReport, reminderReport, escalationReport, socialTaggingReport, rtiReport, legalCounselReport]);

  // Protected route guard: Require authenticated, verified citizen before filing grievance
  const handleOpenReportModal = () => {
    if (!user) {
      setAuthModalMode('signup');
      return;
    }
    if (!isEmailVerified) {
      setAuthModalMode('login'); // Will render verification pending screen
      return;
    }
    setIsReportModalOpen(true);
  };

  // Sync tab navigation if 'report' tab is selected
  useEffect(() => {
    if (currentTab === 'report') {
      handleOpenReportModal();
      setCurrentTab('home');
    }
  }, [currentTab]);

  // Dark/Light Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('nagrikone_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Sync theme with DOM
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
      document.body.classList.add('dark');
      localStorage.setItem('nagrikone_theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
      document.body.classList.remove('dark');
      localStorage.setItem('nagrikone_theme', 'light');
    }
  }, [isDarkMode]);

  // User GPS location & status
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [locationStatus, setLocationStatus] = useState<
    'prompt' | 'granted' | 'denied' | 'unavailable' | 'timeout'
  >('prompt');

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      setUserLocation({ latitude: 28.6289, longitude: 77.2065 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLocationStatus('granted');
      },
      (err) => {
        if (err.code === 1) {
          setLocationStatus('denied');
        } else if (err.code === 3) {
          setLocationStatus('timeout');
        } else {
          setLocationStatus('unavailable');
        }
        // Fallback default Delhi NCR
        setUserLocation({ latitude: 28.6289, longitude: 77.2065 });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Request browser geolocation once on mount
  useEffect(() => {
    requestGeolocation();
  }, []);

  // Save reports on update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(reports));
    } catch (e) {
      console.warn('Failed to save reports:', e);
    }
  }, [reports]);

  // Save profile on update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save profile:', e);
    }
  }, [profile]);

  // Handle New Report Submission via Firebase Storage & Cloud Firestore
  const handleReportSubmit = async (
    data: Omit<CivicReport, 'id' | 'createdAt' | 'upvotes' | 'timeline'>,
    photos: ConvertedJpgImage[] = [],
    onProgress?: (message: string) => void
  ): Promise<CivicReport> => {
    // 1. Submit images to Firebase Storage & grievance record to Cloud Firestore
    const savedReport = await submitReportWithFirebase(data, photos, onProgress);

    // 2. Optimistically update local reports list so it reflects instantly
    setReports((prev) => {
      const filtered = prev.filter((r) => r.id !== savedReport.id);
      return [savedReport, ...filtered];
    });

    // 3. Update Profile Karma
    const newKarma = profile.karmaPoints + 50;
    const newReportsCount = profile.reportsFiledCount + 1;
    const updatedProfile = {
      ...profile,
      karmaPoints: newKarma,
      reportsFiledCount: newReportsCount,
      levelTitle:
        newKarma > 300
          ? 'Civic Leader (Level 3)'
          : newKarma > 100
          ? 'Ward Sentinel (Level 2)'
          : 'Vigilant Citizen (Level 1)',
      levelNumber: newKarma > 300 ? 3 : newKarma > 100 ? 2 : 1,
    };
    setProfile(updatedProfile);

    // 4. Evaluate Badges
    const userSubmitted = [savedReport, ...reports.filter((r) => r.isUserSubmitted && r.id !== savedReport.id)];
    const hasPhoto = userSubmitted.some((r) => !!r.imageUrl);
    const categoriesUsed = new Set(userSubmitted.map((r) => r.category));

    const { updatedBadges, newlyUnlocked } = evaluateBadges(badges, {
      totalReports: userSubmitted.length,
      hasPhotoReport: hasPhoto,
      totalUpvotesGiven: profile.upvotesGivenCount,
      categoriesUsed,
      resolvedCount: profile.resolvedCount,
    });
    setBadges(updatedBadges);

    // 5. New notification
    const newNotif: CivicNotification = {
      id: `n-${Date.now()}`,
      title: `Issue #${savedReport.id} Dispatched`,
      desc: `Your grievance has been stored in Cloud Firestore & assigned to ${savedReport.department}.`,
      time: 'Just now',
      read: false,
      type: 'status_update',
      reportId: savedReport.id,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    playSuccessChime();

    if (newlyUnlocked.length > 0) {
      playBadgeUnlockSound();
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    }

    return savedReport;
  };

  // Handle Upvoting in Cloud Firestore
  const handleUpvoteReport = (reportId: string) => {
    let wasUpvoted = false;
    let delta = 1;
    const updatedReports = reports.map((r) => {
      if (r.id === reportId) {
        wasUpvoted = !r.hasUpvoted;
        delta = wasUpvoted ? 1 : -1;
        return {
          ...r,
          upvotes: wasUpvoted ? r.upvotes + 1 : Math.max(0, r.upvotes - 1),
          hasUpvoted: wasUpvoted,
        };
      }
      return r;
    });

    setReports(updatedReports);

    // Persist upvote to Cloud Firestore
    upvoteReportInFirestore(reportId, delta).catch((e) =>
      console.warn('Could not persist upvote to Cloud Firestore:', e)
    );

    if (activeDetailReport && activeDetailReport.id === reportId) {
      setActiveDetailReport((prev) =>
        prev
          ? {
              ...prev,
              upvotes: wasUpvoted ? prev.upvotes + 1 : Math.max(0, prev.upvotes - 1),
              hasUpvoted: wasUpvoted,
            }
          : null
      );
    }

    if (wasUpvoted) {
      const newUpvotes = profile.upvotesGivenCount + 1;
      const newKarma = profile.karmaPoints + 10;
      setProfile((prev) => ({
        ...prev,
        karmaPoints: newKarma,
        upvotesGivenCount: newUpvotes,
      }));

      // Evaluate badges
      const userSubmitted = updatedReports.filter((r) => r.isUserSubmitted);
      const { updatedBadges, newlyUnlocked } = evaluateBadges(badges, {
        totalReports: userSubmitted.length,
        hasPhotoReport: userSubmitted.some((r) => !!r.imageUrl),
        totalUpvotesGiven: newUpvotes,
        categoriesUsed: new Set(userSubmitted.map((r) => r.category)),
      });
      setBadges(updatedBadges);

      if (newlyUnlocked.length > 0) {
        confetti({ particleCount: 70, spread: 60 });
      }
    }
  };

  // Handle Retracting/Deleting Report from Cloud Firestore & Firebase Storage
  const handleDeleteReport = async (reportId: string) => {
    const reportToDelete = reports.find((r) => r.id === reportId);
    if (!reportToDelete) return;

    // Delete from Cloud Firestore and Firebase Storage
    await deleteReportFromFirestore(reportToDelete);

    // Update local state after confirmed backend deletion
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    if (activeDetailReport?.id === reportId) {
      setActiveDetailReport(null);
    }
  };

  // Handle Advancing Resolution Status (Simulated Municipal Action) in Cloud Firestore
  const handleAdvanceStatus = async (reportId: string, nextStatus: ReportStatus) => {
    let targetReport: CivicReport | null = null;
    const updatedReports = reports.map((r) => {
      if (r.id === reportId) {
        const newEvent = {
          status: nextStatus,
          timestamp: new Date().toISOString(),
          note:
            nextStatus === 'Resolved'
              ? 'Remediation completed and verified with site photos. Cleared under Citizen Charter.'
              : nextStatus === 'In Progress'
              ? 'Repair equipment and maintenance van mobilized on site.'
              : 'Junior Engineer conducted on-site physical appraisal and verified coordinates.',
          officer:
            nextStatus === 'Resolved'
              ? 'Er. V. K. Tyagi (Executive Engineer)'
              : nextStatus === 'In Progress'
              ? 'Maintenance Crew #04'
              : 'Er. R. K. Sharma (JE)',
        };

        const resolvedProof =
          nextStatus === 'Resolved'
            ? 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=1200&q=80'
            : r.resolved_proof_url;

        targetReport = {
          ...r,
          status: nextStatus,
          resolved_proof_url: resolvedProof,
          timeline: [...(r.timeline || []), newEvent],
        };
        return targetReport;
      }
      return r;
    });

    setReports(updatedReports);

    if (targetReport) {
      setActiveDetailReport(targetReport);
      // Persist status change to Cloud Firestore
      await saveReportToFirestore(targetReport).catch((err) =>
        console.warn('Could not persist status update to Firestore:', err)
      );
    }

    if (nextStatus === 'Resolved') {
      const newResolved = profile.resolvedCount + 1;
      const newKarma = profile.karmaPoints + 100;
      setProfile((prev) => ({
        ...prev,
        karmaPoints: newKarma,
        resolvedCount: newResolved,
      }));

      // Evaluate badges
      const userSubmitted = updatedReports.filter((r) => r.isUserSubmitted);
      const { updatedBadges, newlyUnlocked } = evaluateBadges(badges, {
        totalReports: userSubmitted.length,
        hasPhotoReport: userSubmitted.some((r) => !!r.imageUrl),
        totalUpvotesGiven: profile.upvotesGivenCount,
        categoriesUsed: new Set(userSubmitted.map((r) => r.category)),
        resolvedCount: newResolved,
      });
      setBadges(updatedBadges);

      playSuccessChime();
      if (newlyUnlocked.length > 0) {
        playBadgeUnlockSound();
      }

      confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
    }
  };

  // Handle Stage 2 Reminder Callback
  const handleReminderRecorded = (
    reportId: string,
    details: { deliveryStatus: 'sent' | 'draft_copied'; date: string }
  ) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === reportId) {
          const updatedTimeline = [
            ...(r.timeline || []),
            {
              status: r.status,
              timestamp: details.date,
              note: `Stage 2 Automated Reminder issued to ${r.department} (${
                details.deliveryStatus === 'sent' ? 'Electronic Gateway Dispatch' : 'Citizen Copy Dispatch'
              }).`,
              officer: 'Citizen Sentinel',
            },
          ];
          return {
            ...r,
            escalationLadder: {
              ...(r.escalationLadder || {}),
              reminderSent: true,
              reminderSentAt: details.date,
              reminderDeliveryStatus: details.deliveryStatus,
            },
            timeline: updatedTimeline,
          };
        }
        return r;
      })
    );
  };

  // Handle Stage 3 Escalation Callback
  const handleEscalationRecorded = (
    reportId: string,
    details: { officerType: string; date: string }
  ) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === reportId) {
          const updatedTimeline = [
            ...(r.timeline || []),
            {
              status: r.status,
              timestamp: details.date,
              note: `Stage 3 Senior Officer Escalation memorandum dispatched to ${details.officerType.replace('_', ' ').toUpperCase()}.`,
              officer: 'Executive Redressal',
            },
          ];
          return {
            ...r,
            escalationLadder: {
              ...(r.escalationLadder || {}),
              escalationFiled: true,
              escalationFiledAt: details.date,
              escalationOfficerType: details.officerType as any,
            },
            timeline: updatedTimeline,
          };
        }
        return r;
      })
    );
  };

  // Handle Stage 4 Social Tagging Callback
  const handleSocialPostRecorded = (
    reportId: string,
    details: { content: string; date: string }
  ) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === reportId) {
          const updatedTimeline = [
            ...(r.timeline || []),
            {
              status: r.status,
              timestamp: details.date,
              note: 'Stage 4 Public Social Tagging notice prepared & shared on civic channels tagging official handles.',
              officer: 'Public Accountability Feed',
            },
          ];
          return {
            ...r,
            escalationLadder: {
              ...(r.escalationLadder || {}),
              socialPostDrafted: true,
              socialPostDraftedAt: details.date,
              socialPostContent: details.content,
            },
            timeline: updatedTimeline,
          };
        }
        return r;
      })
    );
  };

  // Handle Stage 5 RTI Generation Callback
  const handleRtiDrafted = () => {
    const newKarma = profile.karmaPoints + 150;
    setProfile((prev) => ({ ...prev, karmaPoints: newKarma }));

    const userSubmitted = reports.filter((r) => r.isUserSubmitted);
    const { updatedBadges, newlyUnlocked } = evaluateBadges(badges, {
      totalReports: userSubmitted.length,
      hasPhotoReport: userSubmitted.some((r) => !!r.imageUrl),
      totalUpvotesGiven: profile.upvotesGivenCount,
      categoriesUsed: new Set(userSubmitted.map((r) => r.category)),
      rtiGeneratedCount: 1,
    });
    setBadges(updatedBadges);

    if (newlyUnlocked.length > 0) {
      playBadgeUnlockSound();
      confetti({ particleCount: 90, spread: 75 });
    }
  };

  // Handle Stage 5 RTI Submission Recorded Callback
  const handleRtiSubmissionRecorded = (
    reportId: string,
    submissionData: {
      submittedAt: string;
      referenceNumber: string;
      submissionType: 'citizen_confirmed' | 'independently_verified';
      evidenceNotes: string;
    }
  ) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === reportId) {
          const updatedTimeline = [
            ...(r.timeline || []),
            {
              status: r.status,
              timestamp: submissionData.submittedAt,
              note: `Stage 5 Right to Information (RTI) application recorded as submitted (ACK #${submissionData.referenceNumber}). 30-day statutory response clock initiated.`,
              officer: 'Public Information Officer (PIO)',
            },
          ];
          return {
            ...r,
            escalationLadder: {
              ...(r.escalationLadder || {}),
              rtiSubmitted: true,
              rtiSubmittedAt: submissionData.submittedAt,
              rtiReferenceNumber: submissionData.referenceNumber,
              rtiSubmissionType: submissionData.submissionType,
              rtiSubmissionEvidence: submissionData.evidenceNotes,
              rtiResponsePeriodDays: 30,
            },
            timeline: updatedTimeline,
          };
        }
        return r;
      })
    );
  };

  // Handle Stage 5 RTI Response Recorded Callback
  const handleRtiResponseRecorded = (
    reportId: string,
    responseData: {
      responseReceived: boolean;
      responseReceivedAt?: string;
      responseStatus: 'no_response' | 'adequate' | 'inadequate';
      notes?: string;
    }
  ) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === reportId) {
          const updatedTimeline = [
            ...(r.timeline || []),
            {
              status: r.status,
              timestamp: responseData.responseReceivedAt || new Date().toISOString(),
              note: `Stage 5 RTI Response status logged: ${responseData.responseStatus.toUpperCase()}. ${responseData.notes || ''}`,
              officer: 'First Appellate Review',
            },
          ];
          return {
            ...r,
            escalationLadder: {
              ...(r.escalationLadder || {}),
              rtiResponseReceived: responseData.responseReceived,
              rtiResponseReceivedAt: responseData.responseReceivedAt,
              rtiResponseStatus: responseData.responseStatus,
              rtiResponseNotes: responseData.notes,
            },
            timeline: updatedTimeline,
          };
        }
        return r;
      })
    );
  };

  // Handle Pro Bono Legal Action Callback (Unlocks Pro Bono Legal Vanguard badge)
  const handleLegalActionCompleted = (
    reportId: string,
    legalDetails: { firmName: string; actionType: string }
  ) => {
    const newKarma = profile.karmaPoints + 100;
    setProfile((prev) => ({ ...prev, karmaPoints: newKarma }));

    // Update report audit timeline
    setReports((prev) =>
      prev.map((rep) => {
        if (rep.id === reportId) {
          const updatedTimeline = [
            ...(rep.timeline || []),
            {
              status: rep.status,
              timestamp: new Date().toISOString(),
              note: `Escalated to Pro Bono Legal Panel (${legalDetails.firmName}). Formal judicial demand prepared.`,
              officer: 'Empaneled Legal Counsel',
              actionTaken: `Legal action: ${legalDetails.actionType}`,
            },
          ];
          return { ...rep, timeline: updatedTimeline };
        }
        return rep;
      })
    );

    // Add high-priority civic notification
    const newNotif: CivicNotification = {
      id: `notif-${Date.now()}`,
      title: 'Pro Bono Legal Panel Connected',
      desc: `Case #${reportId} registered with ${legalDetails.firmName}. Statutory notice dispatched.`,
      time: 'Just now',
      read: false,
      type: 'badge',
      reportId,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Evaluate badges with legalActionTakenCount: 1
    const userSubmitted = reports.filter((r) => r.isUserSubmitted);
    const { updatedBadges, newlyUnlocked } = evaluateBadges(badges, {
      totalReports: userSubmitted.length,
      hasPhotoReport: userSubmitted.some((r) => !!r.imageUrl),
      totalUpvotesGiven: profile.upvotesGivenCount,
      categoriesUsed: new Set(userSubmitted.map((r) => r.category)),
      legalActionTakenCount: 1,
    });
    setBadges(updatedBadges);

    if (newlyUnlocked.length > 0) {
      playBadgeUnlockSound();
      confetti({ particleCount: 110, spread: 85, origin: { y: 0.6 } });
    }
  };

  // Handle Reset Data
  const handleResetData = () => {
    localStorage.removeItem(STORAGE_REPORTS_KEY);
    localStorage.removeItem(STORAGE_PROFILE_KEY);
    localStorage.removeItem('nagrikone_badges_v2');
    setReports(INITIAL_REPORTS);
    setProfile(INITIAL_PROFILE);
    setBadges(loadSavedBadges());
  };

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      playThemeToggleSound(next);
      return next;
    });
  };

  // Splash loading screen while checking Firebase Auth session
  if (authLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 ${
          isDarkMode ? 'dark' : ''
        }`}
      >
        <div className="text-center p-6 space-y-4 animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 shadow-xl mx-auto flex items-center justify-center animate-pulse">
            <img src="/logo-icon.svg" alt="Nagrik One" className="w-full h-full object-contain" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Nagrik One AI</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Securing citizen session...</p>
          </div>
        </div>
      </div>
    );
  }

  // Primary Entry Experience: If user is not authenticated and has not chosen to preview as guest
  if (!user && !isGuestBrowsing) {
    return (
      <div
        className={`min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 ${
          isDarkMode ? 'dark' : ''
        }`}
      >
        <AuthScreen
          initialMode="login"
          onGuestContinue={() => {
            setIsGuestBrowsing(true);
            try {
              localStorage.setItem('nagrikone_guest_browsing', 'true');
            } catch {}
          }}
          onSuccess={() => {
            setIsGuestBrowsing(false);
          }}
        />
      </div>
    );
  }

  // Verification-Pending Gate: If user registered or logged in with unverified email
  if (user && !isEmailVerified) {
    return (
      <div
        className={`min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 ${
          isDarkMode ? 'dark' : ''
        }`}
      >
        <AuthScreen
          initialMode="login"
          onGuestContinue={() => {
            setIsGuestBrowsing(true);
          }}
          onSuccess={() => {
            setIsGuestBrowsing(false);
          }}
        />
      </div>
    );
  }

  const unlockedBadgesCount = badges.filter((b) => b.unlocked).length;

  return (
    <div
      id="app-root"
      className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white transition-colors duration-200 ${
        isDarkMode ? 'dark' : ''
      }`}
    >
      {/* Top Main Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onOpenReportModal={handleOpenReportModal}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenAuth={(mode) => setAuthModalMode(mode)}
        reportsCount={reports.length}
        unlockedBadgesCount={unlockedBadgesCount}
        notifications={notifications}
        onMarkNotificationRead={(id) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          );
        }}
        profile={profile}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-12">
        {currentTab === 'home' && (
          <FeedView
            reports={reports}
            isLoading={isReportsLoading}
            error={reportsError}
            onOpenReportModal={handleOpenReportModal}
            onOpenReportDetail={(rep) => setActiveDetailReport(rep)}
            onUpvoteReport={handleUpvoteReport}
            onDeleteReport={handleDeleteReport}
            onSelectOnMap={(repId) => {
              setSelectedReportId(repId);
              setCurrentTab('map');
            }}
            onSelectTab={setCurrentTab}
          />
        )}

        {currentTab === 'map' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Interactive Civic Geolocation Map
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Real-time GPS geotagged civic reports, hazard hotspots, and municipal wards.
                </p>
              </div>
              <button
                onClick={handleOpenReportModal}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                + Pin New Grievance
              </button>
            </div>
            <CivicMap
              reports={reports}
              selectedReportId={selectedReportId}
              onSelectReport={(id) => setSelectedReportId(id)}
              onOpenReportDetail={(rep) => setActiveDetailReport(rep)}
              onUpvoteReport={handleUpvoteReport}
              isDarkMode={isDarkMode}
              userLocation={userLocation}
              locationStatus={locationStatus}
              onRefreshLocation={requestGeolocation}
              onOpenReportModal={handleOpenReportModal}
              onOpenReminder={(rep) => setReminderReport(rep)}
              onOpenEscalation={(rep) => setEscalationReport(rep)}
              onOpenSocialTagging={(rep) => setSocialTaggingReport(rep)}
              onOpenRti={(rep) => setRtiReport(rep)}
              onOpenLegalCounsel={(rep) => setLegalCounselReport(rep)}
              onOpenProcedure={() => setCurrentTab('procedure')}
            />
          </div>
        )}

        {currentTab === 'sahayak' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Nagrik Sahayak AI (नागरिक सहायक)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Your 24/7 intelligent municipal governance consultant powered by Gemini Flash AI.
              </p>
            </div>
            <SahayakChat
              onOpenReportModal={handleOpenReportModal}
              onOpenMap={() => setCurrentTab('map')}
            />
          </div>
        )}

        {currentTab === 'badges' && (
          <BadgesView
            badges={badges}
            profile={profile}
            onOpenReportModal={handleOpenReportModal}
          />
        )}

        {currentTab === 'analytics' && <AnalyticsView reports={reports} />}

        {currentTab === 'procedure' && (
          <ProcedureView
            reports={reports}
            onOpenReportModal={handleOpenReportModal}
            onOpenReportDetail={(rep) => setActiveDetailReport(rep)}
            onOpenReminder={(rep) => setReminderReport(rep)}
            onOpenEscalation={(rep) => setEscalationReport(rep)}
            onOpenSocialTagging={(rep) => setSocialTaggingReport(rep)}
            onOpenRti={(rep) => setRtiReport(rep)}
            onOpenLegalCounsel={(rep) => setLegalCounselReport(rep)}
            onSelectTab={(tab) => setCurrentTab(tab)}
          />
        )}
      </main>

      {/* Website Footer with Official Social Links */}
      <Footer onSelectTab={(tab) => setCurrentTab(tab)} />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenReportModal={handleOpenReportModal}
        unlockedBadgesCount={unlockedBadgesCount}
      />

      {/* Modals */}
      {isReportModalOpen && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          onSubmitReport={handleReportSubmit}
          userLocation={userLocation}
          profile={profile}
          onVerifyCitizen={(email) => {
            setProfile((prev) => ({
              ...prev,
              verifiedId: true,
              email,
              karmaPoints: prev.karmaPoints + 100,
            }));
          }}
        />
      )}

      {activeDetailReport && (
        <ReportDetailModal
          report={activeDetailReport}
          isOpen={!!activeDetailReport}
          onClose={() => setActiveDetailReport(null)}
          onUpvote={handleUpvoteReport}
          onDeleteReport={handleDeleteReport}
          onOpenReminder={(rep) => setReminderReport(rep)}
          onOpenEscalation={(rep) => setEscalationReport(rep)}
          onOpenSocialTagging={(rep) => setSocialTaggingReport(rep)}
          onOpenRti={(rep) => setRtiReport(rep)}
          onOpenLegalCounsel={(rep) => setLegalCounselReport(rep)}
          onAdvanceStatus={handleAdvanceStatus}
          onViewProcedure={() => setCurrentTab('procedure')}
          currentUserWard={profile.ward}
        />
      )}

      {reminderReport && (
        <ReminderModal
          report={reminderReport}
          isOpen={!!reminderReport}
          onClose={() => setReminderReport(null)}
          onReminderRecorded={handleReminderRecorded}
        />
      )}

      {escalationReport && (
        <EscalationModal
          report={escalationReport}
          isOpen={!!escalationReport}
          onClose={() => setEscalationReport(null)}
          onEscalationRecorded={handleEscalationRecorded}
        />
      )}

      {socialTaggingReport && (
        <SocialTaggingModal
          report={socialTaggingReport}
          isOpen={!!socialTaggingReport}
          onClose={() => setSocialTaggingReport(null)}
          onSocialPostRecorded={handleSocialPostRecorded}
        />
      )}

      {rtiReport && (
        <RtiGeneratorModal
          report={rtiReport}
          isOpen={!!rtiReport}
          onClose={() => setRtiReport(null)}
          onRtiDrafted={handleRtiDrafted}
          onRtiSubmissionRecorded={handleRtiSubmissionRecorded}
          onRtiResponseRecorded={handleRtiResponseRecorded}
        />
      )}

      {legalCounselReport && (
        <LegalCounselModal
          report={legalCounselReport}
          isOpen={!!legalCounselReport}
          onClose={() => setLegalCounselReport(null)}
          onLegalActionCompleted={handleLegalActionCompleted}
          onOpenRtiModal={(rep) => setRtiReport(rep)}
        />
      )}

      {isProfileModalOpen && (
        <ProfileModal
          key="nagrik-profile-modal"
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          profile={profile}
          reports={reports}
          onResetData={handleResetData}
          onSelectReport={(id) => {
            const found = reports.find((r) => r.id === id);
            if (found) setActiveDetailReport(found);
          }}
          onVerifyCitizen={(citizenId) => {
            setProfile((prev) => ({
              ...prev,
              verifiedId: true,
              id: citizenId,
              karmaPoints: prev.karmaPoints + 100,
            }));
          }}
        />
      )}

      {/* Authentication Modal (For Guest actions requiring verified Citizen access) */}
      {authModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-md my-auto">
            <button
              onClick={() => setAuthModalMode(null)}
              className="absolute -top-11 right-0 p-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              title="Close modal"
              aria-label="Close authentication modal"
            >
              <X className="w-5 h-5" />
            </button>
            <AuthScreen
              initialMode={authModalMode}
              onSuccess={() => {
                setAuthModalMode(null);
                setIsGuestBrowsing(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
