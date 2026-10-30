import React, { useState } from 'react';
import {
  CivicCategoryType,
  CivicReport,
  PriorityLevel,
  ImageVerificationResult,
  CombinedImageVerification,
  CitizenProfile,
} from '../types';
import { CIVIC_CATEGORIES, getCategoryById } from '../data/categories';
import {
  X,
  Camera,
  MapPin,
  Sparkles,
  Mic,
  MicOff,
  AlertTriangle,
  Upload,
  CheckCircle2,
  Clock,
  Building2,
  ShieldCheck,
  RefreshCw,
  SearchCheck,
  Eye,
  ShieldAlert,
  Mail,
  UserCheck,
  Trash2,
  RotateCcw,
  Maximize2,
  Image as ImageIcon,
  Plus,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Cpu,
  Info,
  AlertCircle,
  Globe,
} from 'lucide-react';
import { playSuccessChime } from '../utils/audio';
import { convertToGenuineJpg, formatFileSize, ConvertedJpgImage } from '../utils/imageConverter';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useLanguageTheme } from '../context/LanguageThemeContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport: (
    newReport: Omit<CivicReport, 'id' | 'createdAt' | 'upvotes' | 'timeline'>,
    photos: ConvertedJpgImage[],
    onProgress?: (message: string) => void
  ) => Promise<CivicReport>;
  userLocation: { latitude: number; longitude: number } | null;
  profile?: CitizenProfile;
  onVerifyCitizen?: (email: string) => void;
}

const PRESET_SAMPLE_PHOTOS = [
  {
    name: 'Road Pothole',
    category: 'road_pothole',
    desc: 'Deep pothole on main road causing hazard for two-wheelers and pedestrians',
    urls: [
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1000&q=80',
    ],
  },
  {
    name: 'Overflowing Waste',
    category: 'garbage_waste',
    desc: 'Municipal container overflowing with uncollected garbage on walkway',
    urls: [
      'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=1000&q=80',
    ],
  },
  {
    name: 'Water Main Leak',
    category: 'water_drainage',
    desc: 'Underground drinking water pipeline ruptured and flooding road',
    urls: [
      'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=1000&q=80',
    ],
  },
  {
    name: 'Dark Streetlights',
    category: 'streetlight',
    desc: 'Multiple consecutive streetlights dark creating unsafe night conditions',
    urls: [
      'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1000&q=80',
    ],
  },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSubmitReport,
  userLocation,
  profile,
  onVerifyCitizen,
}) => {
  const {
    user,
    isEmailVerified,
    checkEmailVerification,
    sendVerificationEmail,
    resendCooldown,
  } = useAuth();
  const { t, language } = useLanguageTheme();

  const getCatLabel = (catId: string, fallback: string) => {
    const map: Record<string, string> = {
      road_pothole: 'catPothole',
      garbage_waste: 'catGarbage',
      streetlight: 'catStreetlight',
      water_drainage: 'catWater',
      traffic_parking: 'catTraffic',
      public_infrastructure: 'catInfrastructure',
      sanitation: 'catSanitation',
    };
    const key = map[catId];
    return key ? t(key, fallback) : fallback;
  };

  const citizenEmail = user?.email || profile?.email || '';
  const [checkingAuthVerification, setCheckingAuthVerification] = useState(false);
  const [authVerificationMessage, setAuthVerificationMessage] = useState<string | null>(null);
  const [authVerificationError, setAuthVerificationError] = useState<string | null>(null);

  const handleCheckEmailVerification = async () => {
    setCheckingAuthVerification(true);
    setAuthVerificationMessage(null);
    setAuthVerificationError(null);
    try {
      const verified = await checkEmailVerification();
      if (verified) {
        setAuthVerificationMessage('Email verified successfully! You can now dispatch reports.');
        playSuccessChime();
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        if (onVerifyCitizen && user?.email) {
          onVerifyCitizen(user.email);
        }
      } else {
        setAuthVerificationError(
          'Email not yet verified. Please click the link in your email inbox and try again.'
        );
      }
    } catch {
      setAuthVerificationError('Could not verify status. Please check your network connection.');
    } finally {
      setCheckingAuthVerification(false);
    }
  };

  const handleResendReportVerification = async () => {
    setAuthVerificationMessage(null);
    setAuthVerificationError(null);
    try {
      const res = await sendVerificationEmail();
      if (res.success) {
        setAuthVerificationMessage(
          `Verification link sent to ${user?.email}. Check your inbox and spam folder.`
        );
      } else {
        setAuthVerificationError(res.error || 'Failed to dispatch verification email.');
      }
    } catch (err: any) {
      setAuthVerificationError(err?.message || 'Failed to dispatch verification email.');
    }
  };

  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleReviewed, setTitleReviewed] = useState(false);
  const [isTranslatingTitle, setIsTranslatingTitle] = useState(false);

  const [description, setDescription] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionReviewed, setDescriptionReviewed] = useState(false);
  const [isTranslatingDesc, setIsTranslatingDesc] = useState(false);
  const [isTranslationOutdated, setIsTranslationOutdated] = useState(false);

  const [category, setCategory] = useState<CivicCategoryType>('road_pothole');
  const [priority, setPriority] = useState<PriorityLevel>('high');
  const [severityScore, setSeverityScore] = useState<number>(7);
  const [severityLabel, setSeverityLabel] = useState<string>('High Priority');
  const [department, setDepartment] = useState<string>('Public Works Department (PWD)');
  const [slaHours, setSlaHours] = useState<number>(72);

  // Priorities 1, 2, 3: AI Enhancement & Triage State
  const [userHasManuallySelectedCategory, setUserHasManuallySelectedCategory] = useState(false);
  const [polishedDescriptionEn, setPolishedDescriptionEn] = useState('');
  const [activeDescriptionTab, setActiveDescriptionTab] = useState<'original' | 'polished'>('original');
  const [isEditingPolished, setIsEditingPolished] = useState(false);
  const [severityIndex, setSeverityIndex] = useState<number>(70);
  const [severityConfidence, setSeverityConfidence] = useState<number>(0.85);
  const [severityExplanation, setSeverityExplanation] = useState<string>('Evaluated based on reported conditions.');
  const [isInsufficientInfo, setIsInsufficientInfo] = useState<boolean>(false);
  const [aiDetectedCategory, setAiDetectedCategory] = useState<CivicCategoryType | null>(null);
  const [categoryExplanation, setCategoryExplanation] = useState<string>('');
  
  // Photo Evidence State (Enforces Min 2, Max 3, Converted to genuine JPG)
  const [photos, setPhotos] = useState<ConvertedJpgImage[]>([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);
  const [zoomedPhoto, setZoomedPhoto] = useState<ConvertedJpgImage | null>(null);

  const cameraInputRef = React.useRef<HTMLInputElement | null>(null);
  const galleryInputRef = React.useRef<HTMLInputElement | null>(null);
  const retakeInputRef = React.useRef<HTMLInputElement | null>(null);

  const primaryPhotoUrl = photos[0]?.dataUrl || '';

  const [latitude, setLatitude] = useState<number>(userLocation?.latitude || 28.6289);
  const [longitude, setLongitude] = useState<number>(userLocation?.longitude || 77.2065);
  const [address, setAddress] = useState<string>('Ring Road near Metro Pillar 142, Ward 42');
  const [addressEn, setAddressEn] = useState<string>('');
  const [addressReviewed, setAddressReviewed] = useState(false);
  const [isTranslatingAddress, setIsTranslatingAddress] = useState(false);

  const [ward, setWard] = useState<string>('Ward 42 (Civil Lines)');
  const [safetyHazards, setSafetyHazards] = useState<string[]>([
    'Commuter fall hazard',
    'Traffic bottleneck',
  ]);
  const [adminSummary, setAdminSummary] = useState<string>('');

  // AI Translation & Triage State
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);
  const [triageSuccess, setTriageSuccess] = useState(false);

  // Dual Independent Verification State (TinyFish Online Reuse + Gemini AI Detection)
  const [photoVerifications, setPhotoVerifications] = useState<Record<number, CombinedImageVerification | null>>({});
  const [verifyingIndices, setVerifyingIndices] = useState<Record<number, boolean>>({});
  const [activeVerificationPhotoIndex, setActiveVerificationPhotoIndex] = useState<number>(0);
  const [expandedEvidence, setExpandedEvidence] = useState<Record<number, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  interface RetainedAudio {
    blob: Blob;
    mimeType: string;
    base64: string;
    durationMs: number;
    recordedAt: number;
  }

  // Voice recording state via Gemini 3.5 Transcribe with in-memory retention & retry
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [hasRetainedAudio, setHasRetainedAudio] = useState(false);
  const [retainedDurationSec, setRetainedDurationSec] = useState<number>(0);

  const retainedAudioRef = React.useRef<RetainedAudio | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const activeStreamRef = React.useRef<MediaStream | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const recordingStartTimeRef = React.useRef<number>(0);
  const transcriptionSeqRef = React.useRef<number>(0);
  const userEditedDuringTranscriptionRef = React.useRef<boolean>(false);
  const descriptionAtStartRef = React.useRef<string>('');
  const isStartingRecordingRef = React.useRef<boolean>(false);

  // Clean up any hardware microphone streams and memory on unmount
  React.useEffect(() => {
    return () => {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track) => track.stop());
        activeStreamRef.current = null;
      }
      retainedAudioRef.current = null;
    };
  }, []);

  // Execute transcription using captured in-memory audio
  const executeTranscription = async (seqId: number, audioPayload?: RetainedAudio) => {
    const audioData = audioPayload || retainedAudioRef.current;
    if (!audioData) return;

    setIsTranscribing(true);
    setTranscriptionError(null);

    try {
      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: audioData.base64,
          mimeType: audioData.mimeType,
        }),
      });

      // Guard: Ignore late or superseded responses
      if (seqId !== transcriptionSeqRef.current) {
        return;
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${res.status}`);
      }

      const json = await res.json();
      if (json.success) {
        const incoming = (json.transcript || '').trim();
        if (incoming) {
          setDescription((current) => {
            // If user typed during recording or in-flight transcription, append cleanly
            if (userEditedDuringTranscriptionRef.current) {
              return current ? `${current} ${incoming}` : incoming;
            }
            // Otherwise, combine with baseline text before recording began (prevents duplicate doubling on retry)
            const baseline = descriptionAtStartRef.current.trim();
            return baseline ? `${baseline} ${incoming}` : incoming;
          });
          playSuccessChime();
          setTranscriptionError(null);
        } else {
          setTranscriptionError(
            'Gemini 3.5 Transcribe completed but detected no audible speech. Audio retained for retry.'
          );
        }
      } else {
        throw new Error(json.error || 'Transcription response failed.');
      }
    } catch (err: any) {
      console.error('Transcription execution error:', err);
      if (seqId === transcriptionSeqRef.current) {
        setTranscriptionError(
          `Speech-to-text failed: ${err.message || 'Service unreachable'}. Captured audio is retained in memory.`
        );
      }
    } finally {
      if (seqId === transcriptionSeqRef.current) {
        setIsTranscribing(false);
      }
    }
  };

  const handleRetryTranscription = () => {
    if (!retainedAudioRef.current || isTranscribing) return;
    const newSeq = ++transcriptionSeqRef.current;
    userEditedDuringTranscriptionRef.current = false;
    executeTranscription(newSeq, retainedAudioRef.current);
  };

  const handleDiscardRetainedAudio = () => {
    retainedAudioRef.current = null;
    setHasRetainedAudio(false);
    setTranscriptionError(null);
    setRetainedDurationSec(0);
  };

  // Multilingual Speech-to-Text via Gemini 3.5 Transcribe (/api/ai/transcribe)
  const toggleVoiceRecording = async () => {
    // Prevent duplicate action during active transcription
    if (isTranscribing) {
      return;
    }

    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          if (mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.requestData();
          }
        } catch (flushErr) {
          console.warn('MediaRecorder requestData flush notice:', flushErr);
        }
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    if (isStartingRecordingRef.current) return;
    isStartingRecordingRef.current = true;
    setTranscriptionError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        fallbackWebSpeech();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      activeStreamRef.current = stream;
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();
      descriptionAtStartRef.current = description;
      userEditedDuringTranscriptionRef.current = false;

      const mimeCandidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/aac',
      ];
      const preferredMime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || '';

      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (activeStreamRef.current) {
          activeStreamRef.current.getTracks().forEach((track) => track.stop());
          activeStreamRef.current = null;
        }

        const durationMs = Date.now() - recordingStartTimeRef.current;
        if (durationMs < 400 || audioChunksRef.current.length === 0) {
          setTranscriptionError('Recording was too short. Please speak your grievance clearly and tap stop.');
          return;
        }

        const mimeType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        if (audioBlob.size < 400) {
          setTranscriptionError('No audible speech detected. Please speak closer to your microphone.');
          return;
        }

        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            // Extract raw base64 payload and clean base MIME type (RFC 2397)
            const commaIndex = dataUrl.indexOf(',');
            const rawBase64 = commaIndex !== -1 ? dataUrl.slice(commaIndex + 1).trim() : dataUrl.trim();
            const cleanMime = (mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();

            const retained: RetainedAudio = {
              blob: audioBlob,
              mimeType: cleanMime,
              base64: rawBase64,
              durationMs,
              recordedAt: Date.now(),
            };
            retainedAudioRef.current = retained;
            setHasRetainedAudio(true);
            setRetainedDurationSec(Math.round(durationMs / 100) / 10);

            const seqId = ++transcriptionSeqRef.current;
            executeTranscription(seqId, retained);
          };
        } catch (readErr: any) {
          console.error('Blob read error:', readErr);
          setTranscriptionError('Failed to process captured audio.');
        }
      };

      recorder.start(250);
      setIsRecording(true);
    } catch (err: any) {
      console.warn('MediaRecorder init failed, falling back to Web Speech:', err);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setTranscriptionError(t('voicePermissionError', 'Microphone permission denied. Please allow microphone access or type your grievance.'));
      } else {
        fallbackWebSpeech();
      }
    } finally {
      isStartingRecordingRef.current = false;
    }
  };

  const fallbackWebSpeech = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setTranscriptionError(t('voicePermissionError', 'Microphone permission denied or unsupported. Please type manually.'));
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang =
        language === 'hi'
          ? 'hi-IN'
          : language === 'pa'
          ? 'pa-IN'
          : language === 'bn'
          ? 'bn-IN'
          : language === 'mr'
          ? 'mr-IN'
          : language === 'kn'
          ? 'kn-IN'
          : 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recognition.start();
    } catch (e) {
      console.warn('Voice error:', e);
      setIsRecording(false);
    }
  };

  // Run TinyFish & Gemini Photo Verification for a specific photo index
  const handleVerifyPhoto = async (indexToVerify = activeVerificationPhotoIndex) => {
    const targetPhoto = photos[indexToVerify];
    if (!targetPhoto) return;

    setVerifyingIndices((prev) => ({ ...prev, [indexToVerify]: true }));

    try {
      const res = await fetch('/api/verify-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: targetPhoto.dataUrl.startsWith('http') ? targetPhoto.dataUrl : undefined,
          imageBase64: targetPhoto.dataUrl.startsWith('data:') ? targetPhoto.dataUrl : undefined,
          mimeType: 'image/jpeg',
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setPhotoVerifications((prev) => ({
          ...prev,
          [indexToVerify]: json.data,
        }));
        playSuccessChime();
      }
    } catch (err) {
      console.error(`Verification error for photo #${indexToVerify + 1}:`, err);
    } finally {
      setVerifyingIndices((prev) => ({ ...prev, [indexToVerify]: false }));
    }
  };

  // Run verification on all attached photos sequentially
  const handleVerifyAllPhotos = async () => {
    try {
      for (let i = 0; i < photos.length; i++) {
        await handleVerifyPhoto(i);
      }
    } catch (err) {
      console.error('Batch verification error:', err);
    } finally {
      setVerifyingIndices({});
    }
  };

  // Section-Wise Gemma 4 Translation Handler
  const handleTranslateSection = async (field: 'title' | 'description' | 'address') => {
    const textToTranslate = field === 'title' ? title : field === 'description' ? description : address;
    if (!textToTranslate.trim()) return;

    if (field === 'title') setIsTranslatingTitle(true);
    else if (field === 'description') setIsTranslatingDesc(true);
    else setIsTranslatingAddress(true);

    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToTranslate,
          fieldName:
            field === 'title'
              ? 'Issue Title'
              : field === 'description'
              ? 'Detailed Civic Grievance Description'
              : 'Location Landmark',
          languageHint: language,
        }),
      });

      const json = await res.json();
      if (json.success && json.englishTranslation) {
        if (field === 'title') {
          setTitleEn(json.englishTranslation);
          setTitleReviewed(false);
        } else if (field === 'description') {
          setDescriptionEn(json.englishTranslation);
          setPolishedDescriptionEn(json.englishTranslation);
          setDescriptionReviewed(false);
        } else if (field === 'address') {
          setAddressEn(json.englishTranslation);
          setAddressReviewed(false);
        }
        playSuccessChime();
      }
    } catch (err) {
      console.error(`Gemma 4 translation error for ${field}:`, err);
    } finally {
      if (field === 'title') setIsTranslatingTitle(false);
      else if (field === 'description') setIsTranslatingDesc(false);
      else setIsTranslatingAddress(false);
    }
  };

  // Master "Translate" Handler: Powered by Gemma 4 + Gemini 3.8 Flash Severity
  const handleTranslateMaster = async () => {
    if (!description.trim() && !title.trim()) {
      setSubmitError(t('descRequired', 'Please enter a brief description of the issue.'));
      return;
    }

    setIsTranslatingAll(true);
    setTriageSuccess(false);
    setSubmitError(null);

    try {
      // 1. Trigger photo verifications in background if attached
      if (photos.length > 0) {
        photos.forEach((_, idx) => {
          if (!photoVerifications[idx]) {
            handleVerifyPhoto(idx);
          }
        });
      }

      // 2. Structured Gemma 4 Translation for Title & Description
      let translatedTitle = titleEn;
      let translatedDesc = descriptionEn;

      const translateRes = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          languageHint: language,
        }),
      });

      const translateJson = await translateRes.json();
      if (translateJson.success) {
        if (translateJson.englishTitle) {
          translatedTitle = translateJson.englishTitle;
          setTitleEn(translateJson.englishTitle);
          setTitleReviewed(false);
        }
        if (translateJson.englishDescription) {
          translatedDesc = translateJson.englishDescription;
          setDescriptionEn(translateJson.englishDescription);
          setPolishedDescriptionEn(translateJson.englishDescription);
          setDescriptionReviewed(false);
        }
        setIsTranslationOutdated(false);
      }

      // 3. Translate Location / Address if present
      if (address.trim()) {
        const addrRes = await fetch('/api/ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: address,
            fieldName: 'Location Landmark',
            languageHint: language,
          }),
        });
        const addrJson = await addrRes.json();
        if (addrJson.success && addrJson.englishTranslation) {
          setAddressEn(addrJson.englishTranslation);
          setAddressReviewed(false);
        }
      }

      // 4. Civic Issue Severity Assessment via Gemini 3.8 Flash
      // Pass the translated English text to ensure municipal triage has accurate English context
      const sevRes = await fetch('/api/reports/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: translatedTitle || title.trim(),
          description: translatedDesc || description.trim(),
          manualCategory: userHasManuallySelectedCategory ? category : null,
          imageBase64: primaryPhotoUrl.startsWith('data:') ? primaryPhotoUrl : undefined,
        }),
      });

      const json = await sevRes.json();
      if (json.success && json.data) {
        const d = json.data;
        // Never overwrite title with original text or description slice; only set titleEn if still missing
        if (!title.trim() && !titleEn && !translateJson?.englishTitle && d.suggested_title) {
          setTitleEn(d.suggested_title);
        }
        if (d.severity_index !== undefined) {
          setSeverityIndex(d.severity_index);
          setSeverityScore(Math.round(d.severity_index / 10) || 5);
        }
        if (d.severity_label) setSeverityLabel(d.severity_label);
        if (d.severity_confidence !== undefined) setSeverityConfidence(d.severity_confidence);
        if (d.severity_explanation) setSeverityExplanation(d.severity_explanation);
        if (d.is_insufficient_info !== undefined) setIsInsufficientInfo(d.is_insufficient_info);
        if (d.ai_detected_category) setAiDetectedCategory(d.ai_detected_category as CivicCategoryType);
        if (d.final_category && !userHasManuallySelectedCategory) setCategory(d.final_category as CivicCategoryType);
        if (d.category_explanation) setCategoryExplanation(d.category_explanation);
        if (d.department) setDepartment(d.department);
        if (d.sla_hours) setSlaHours(d.sla_hours);
        if (d.safety_hazards) setSafetyHazards(d.safety_hazards);
        setTriageSuccess(true);
      }

      playSuccessChime();
    } catch (err) {
      console.error('Translation & Severity analysis error:', err);
    } finally {
      setIsTranslatingAll(false);
    }
  };

  // Geolocation quick fetch
  const handleDetectGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setAddress(
            `GPS Verified: ${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E (Local Ward)`
          );
        },
        () => {
          alert('Could not retrieve GPS coordinates. Default ward coordinates applied.');
        }
      );
    }
  };

  // Capture Photo using device camera (capture="environment")
  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photos.length >= 3) {
      setPhotoError('Maximum limit of 3 photos reached. Remove an existing photo to capture a new one.');
      e.target.value = '';
      return;
    }

    setIsProcessingPhotos(true);
    setPhotoError(null);
    try {
      const converted = await convertToGenuineJpg(file, `camera_capture_${Date.now()}`);
      setPhotos((prev) => [...prev, converted]);
      playSuccessChime();
    } catch (err: any) {
      setPhotoError('Failed to convert camera photo to genuine JPG: ' + (err.message || 'Error'));
    } finally {
      setIsProcessingPhotos(false);
      e.target.value = '';
    }
  };

  // Upload Photos from Gallery / File Picker (Supports multiple files up to 3 total)
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const availableSlots = 3 - photos.length;
    if (availableSlots <= 0) {
      setPhotoError('Maximum limit of 3 photos reached. Remove an existing photo to upload new ones.');
      e.target.value = '';
      return;
    }

    const filesToProcess = files.slice(0, availableSlots);
    if (files.length > availableSlots) {
      setPhotoError(`Only ${availableSlots} photo(s) attached to respect the 3 photos maximum.`);
    } else {
      setPhotoError(null);
    }

    setIsProcessingPhotos(true);
    try {
      const convertedList: ConvertedJpgImage[] = [];
      for (const file of filesToProcess) {
        const converted = await convertToGenuineJpg(file, file.name);
        convertedList.push(converted);
      }
      setPhotos((prev) => [...prev, ...convertedList]);
      playSuccessChime();
    } catch (err: any) {
      setPhotoError('Failed to convert uploaded photo to genuine JPG: ' + (err.message || 'Error'));
    } finally {
      setIsProcessingPhotos(false);
      e.target.value = '';
    }
  };

  // Retake a specific photo slot
  const handleTriggerRetake = (index: number) => {
    setRetakeIndex(index);
    if (retakeInputRef.current) {
      retakeInputRef.current.value = '';
      retakeInputRef.current.click();
    }
  };

  const handleRetakeInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || retakeIndex === null) return;

    const currentRetakeIndex = retakeIndex;
    setIsProcessingPhotos(true);
    setPhotoError(null);
    try {
      const converted = await convertToGenuineJpg(file, `retake_${Date.now()}`);
      setPhotos((prev) => {
        const next = [...prev];
        next[currentRetakeIndex] = converted;
        return next;
      });
      // Do not allow stale verification results from a previously selected image to be attached to a replacement image
      setPhotoVerifications((prev) => {
        const next = { ...prev };
        delete next[currentRetakeIndex];
        return next;
      });
      playSuccessChime();
    } catch (err: any) {
      setPhotoError('Failed to convert retake photo to genuine JPG: ' + (err.message || 'Error'));
    } finally {
      setIsProcessingPhotos(false);
      setRetakeIndex(null);
      e.target.value = '';
    }
  };

  // Remove a photo
  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length < 2) {
        setPhotoError(
          `Minimum 2 photos required (currently ${next.length} of 3 attached). Please take or upload at least ${2 - next.length} more.`
        );
      } else {
        setPhotoError(null);
      }
      return next;
    });

    // Reindex remaining verification results
    setPhotoVerifications((prev) => {
      const next: Record<number, CombinedImageVerification | null> = {};
      let newIdx = 0;
      for (let i = 0; i < photos.length; i++) {
        if (i !== index) {
          if (prev[i]) next[newIdx] = prev[i];
          newIdx++;
        }
      }
      return next;
    });
    setActiveVerificationPhotoIndex((prev) => Math.max(0, Math.min(prev, photos.length - 2)));
  };

  // Handle Preset Sample Selection (Loads 2 genuine JPG photos for selected category)
  const handleSelectPreset = async (preset: (typeof PRESET_SAMPLE_PHOTOS)[0]) => {
    setDescription(preset.desc);
    setTitleEn('');
    setDescriptionEn('');
    setPolishedDescriptionEn('');
    setTitleReviewed(false);
    setDescriptionReviewed(false);
    setIsTranslationOutdated(false);
    setCategory(preset.category as CivicCategoryType);
    setUserHasManuallySelectedCategory(true);
    const matched = getCategoryById(preset.category as CivicCategoryType);
    setDepartment(matched.typicalDepartment);
    setSlaHours(matched.defaultSlaHours);
    setPhotoVerifications({});
    setActiveVerificationPhotoIndex(0);
    setPhotoError(null);

    try {
      setIsProcessingPhotos(true);
      const converted = await Promise.all(
        preset.urls.slice(0, 2).map((url, i) =>
          convertToGenuineJpg(url, `${preset.category}_sample_${i + 1}`)
        )
      );
      setPhotos(converted);
    } catch (e) {
      console.warn('Preset photos load warn:', e);
    } finally {
      setIsProcessingPhotos(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setSubmitError(t('titleRequired', 'Please specify an issue title.'));
      return;
    }

    if (!description.trim()) {
      setSubmitError(t('descRequired', 'Please enter a description of the civic grievance.'));
      return;
    }

    // Strict Enforcement of Minimum 2 and Maximum 3 Photos
    if (photos.length < 2) {
      setPhotoError(
        t(
          'photoUploadMinWarning',
          `Minimum 2 photos required before submission (currently ${photos.length} of 3 attached). Please take or upload at least 2 photos.`
        )
      );
      return;
    }

    if (photos.length > 3) {
      setPhotoError('Maximum 3 photos allowed. Please remove extra photos.');
      return;
    }

    // Outdated translation guard: Ensure English translation is in sync with latest edits
    if (isTranslationOutdated) {
      setSubmitError(
        'The original title or description was edited after translation. Please click "Translate" to regenerate the official English translation before submitting.'
      );
      return;
    }

    // Non-Negotiable Requirement 12: Ensure every required free-text field has been translated into English and reviewed
    if (!titleEn.trim() || !descriptionEn.trim()) {
      setSubmitError(
        t(
          'reviewPendingWarning',
          'Please click "Translate" to generate the official English translation with Gemma 4 and confirm your review before submitting.'
        )
      );
      return;
    }

    if (!titleReviewed || !descriptionReviewed) {
      setSubmitError(
        t(
          'reviewPendingWarning',
          'Please review and check the confirmation box for both the Title and Description English translations before submitting.'
        )
      );
      return;
    }

    setSubmitting(true);
    setUploadProgress(null);
    setSubmitError(null);

    try {
      const primaryVerification = photoVerifications[0] || photoVerifications[1] || undefined;
      const finalReportDescription = descriptionEn.trim() || description.trim();
      const finalReportTitle = titleEn.trim() || title.trim();

      await onSubmitReport(
        {
          title: finalReportTitle,
          description: finalReportDescription,
          original_description: description.trim(),
          polished_description_en: descriptionEn.trim(),
          category, // Authoritative final category
          manual_category: userHasManuallySelectedCategory ? category : null,
          ai_detected_category: aiDetectedCategory || category,
          final_category: category,
          status: 'Reported',
          priority,
          severity_score: severityScore,
          severity_label: severityLabel,
          severity_index: severityIndex,
          severity_confidence: severityConfidence,
          severity_explanation: severityExplanation,
          is_insufficient_info: isInsufficientInfo,
          department,
          sla_hours: slaHours,
          imageUrl: primaryPhotoUrl || undefined,
          images: photos.map((p) => p.dataUrl),
          latitude,
          longitude,
          accuracy: 8,
          address,
          location_name: addressEn.trim() || address,
          reportedBy: user?.displayName || user?.email || citizenEmail || 'Citizen Sentinel',
          authorUid: user?.uid,
          isUserSubmitted: true,
          safety_hazards: safetyHazards,
          administrative_summary: adminSummary,
          verificationResult: primaryVerification,

          // Separate preservation of original and reviewed English translation (Requirements 11 & 12)
          originalText: {
            title: title.trim(),
            description: description.trim(),
            address: address.trim(),
          },
          originalLanguage: language,
          englishTranslation: {
            title: titleEn.trim(),
            description: descriptionEn.trim(),
            address: addressEn.trim() || address.trim(),
          },
          translationReviewed: Boolean(titleReviewed && descriptionReviewed),
          gemmaModelUsed: 'gemma-4-26b-a4b-it',
        },
        photos,
        (progressMessage: string) => {
          setUploadProgress(progressMessage);
        }
      );
      handleDiscardRetainedAudio();
      onClose();
    } catch (err: any) {
      console.error('Submit report error:', err);
      setSubmitError(err?.message || 'Failed to submit grievance to Firebase. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-1 flex items-center justify-center shadow-md shadow-blue-500/10 shrink-0">
              <img
                src="/logo-icon.svg"
                alt="Nagrik One"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                {t('reportModalTitle', 'Report Civic Issue')}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40">
                  AI-Powered
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('reportModalSubtitle', 'Direct dispatch to Municipal Corporation, PWD, Jal Board & DISCOMs')}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleDiscardRetainedAudio();
              onClose();
            }}
            disabled={submitting}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
            title={submitting ? 'Please wait while grievance is uploading' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* 1. Issue Title with Gemma 4 Section-Wise Translation */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                1. {t('reportTitleLabel', 'Issue Title')}
              </label>
              <button
                type="button"
                onClick={() => handleTranslateSection('title')}
                disabled={isTranslatingTitle || !title.trim()}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer disabled:opacity-40"
              >
                {isTranslatingTitle ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                )}
                <span>{isTranslatingTitle ? t('translatingGemma', 'Translating...') : t('btnTranslate', 'Translate')}</span>
              </button>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleEn) {
                  setIsTranslationOutdated(true);
                  setTitleReviewed(false);
                }
              }}
              placeholder={t('reportTitlePlaceholder', 'e.g. Hazardous deep pothole on arterial road')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {/* Gemma 4 Title Translation & Review Card */}
            {titleEn && (
              <div className="mt-2.5 p-3 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-slate-50 to-indigo-50/50 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950 border border-indigo-200/80 dark:border-indigo-900/60 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 dark:bg-slate-800 border border-indigo-500/40 text-white shadow-xs">
                    <img
                      src="/gemma-logo.svg"
                      alt="Gemma 4 Logo"
                      className="w-3.5 h-3.5 rounded-sm object-contain"
                    />
                    <span className="text-[10px] font-bold tracking-wide text-indigo-300">
                      {t('poweredByGemma4', 'Powered by Gemma 4')}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {t('englishTranslationLabel', 'English Translation (for Municipal Authority)')}
                  </span>
                </div>

                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => {
                    setTitleEn(e.target.value);
                    setTitleReviewed(false); // Force re-review confirmation if modified
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    checked={titleReviewed}
                    onChange={(e) => setTitleReviewed(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                  <span className={titleReviewed ? 'text-emerald-700 dark:text-emerald-400 font-bold' : ''}>
                    {t('reviewCheckbox', 'I have reviewed this English translation for accuracy')}
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* 2. Citizen Description with Gemini 3.5 Transcribe & Gemma 4 Translation */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                2. {t('reportDescriptionLabel', 'Detailed Description & Civic Hazard')}
              </label>
              <div className="flex items-center gap-2">
                {/* Voice Input with Gemini 3.5 Transcribe */}
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  disabled={isTranscribing}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse'
                      : isTranscribing
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title="Speak in your preferred language (Gemini 3.5 Transcribe)"
                >
                  {isRecording ? (
                    <MicOff className="w-3.5 h-3.5" />
                  ) : isTranscribing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  ) : (
                    <Mic className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span>
                    {isRecording
                      ? t('recordingVoice', 'Listening...')
                      : isTranscribing
                      ? t('transcribingVoice', 'Transcribing...')
                      : t('voiceInput', 'Voice Input')}
                  </span>
                </button>

                {/* Primary Button strictly labelled "Translate" per non-negotiable requirement 4 */}
                <button
                  type="button"
                  onClick={handleTranslateMaster}
                  disabled={isTranslatingAll || (!description.trim() && !title.trim())}
                  className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50 transition-all cursor-pointer"
                  title="Translate free-text sections to English via Gemma 4"
                >
                  {isTranslatingAll ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  )}
                  <span>
                    {isTranslatingAll
                      ? t('translatingGemma', 'Translating with Gemma 4...')
                      : t('btnTranslate', 'Translate')}
                  </span>
                </button>
                {isTranslationOutdated && (
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800 animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Re-translate needed</span>
                  </span>
                )}
              </div>
            </div>

            <textarea
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                userEditedDuringTranscriptionRef.current = true;
                if (descriptionEn) {
                  setIsTranslationOutdated(true);
                  setDescriptionReviewed(false);
                }
              }}
              placeholder={t(
                'reportDescPlaceholder',
                'Describe in your preferred language (Hindi, Punjabi, Kannada, Bengali, Marathi, or English)...'
              )}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />

            {/* Voice Audio Retention & Error Recovery Bar */}
            {(hasRetainedAudio || transcriptionError || isTranscribing) && (
              <div className="mt-2 p-2.5 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2.5 transition-all bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      transcriptionError
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                        : isTranscribing
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 animate-spin'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                    }`}
                  >
                    {transcriptionError ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : isTranscribing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Mic className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                      {transcriptionError
                        ? transcriptionError
                        : isTranscribing
                        ? 'Gemini 3.5 Transcribe converting speech to text...'
                        : `Voice audio retained in session memory (${retainedDurationSec}s)`}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {transcriptionError
                        ? 'Audio safely held in memory. You can retry transcription without recording again.'
                        : 'Stored exclusively in session memory. Discarded automatically upon submission or exit.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                  {hasRetainedAudio && !isTranscribing && (
                    <button
                      type="button"
                      onClick={handleRetryTranscription}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                      title="Retry speech transcription using retained audio"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  )}
                  {hasRetainedAudio && !isTranscribing && (
                    <button
                      type="button"
                      onClick={handleDiscardRetainedAudio}
                      className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-[11px] transition-colors cursor-pointer"
                      title="Discard retained voice audio from memory"
                    >
                      <span>Discard</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Gemma 4 Description Translation & Review Card */}
            {descriptionEn && (
              <div className="mt-2.5 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-slate-50 to-indigo-50/50 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950 border border-indigo-200/80 dark:border-indigo-900/60 space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 dark:bg-slate-800 border border-indigo-500/40 text-white shadow-xs">
                    <img
                      src="/gemma-logo.svg"
                      alt="Gemma 4 Logo"
                      className="w-3.5 h-3.5 rounded-sm object-contain"
                    />
                    <span className="text-[10px] font-bold tracking-wide text-indigo-300">
                      {t('poweredByGemma4', 'Powered by Gemma 4')}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {t('englishTranslationLabel', 'English Translation (for Municipal Authority)')}
                  </span>
                </div>

                <textarea
                  rows={3}
                  value={descriptionEn}
                  onChange={(e) => {
                    setDescriptionEn(e.target.value);
                    setPolishedDescriptionEn(e.target.value);
                    setDescriptionReviewed(false); // Force re-review confirmation if modified
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={descriptionReviewed}
                      onChange={(e) => setDescriptionReviewed(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                    />
                    <span className={descriptionReviewed ? 'text-emerald-700 dark:text-emerald-400 font-bold' : ''}>
                      {t('reviewCheckbox', 'I have reviewed this English translation for accuracy')}
                    </span>
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Preserved landmarks & factual details</span>
                  </span>
                </div>
              </div>
            )}

            {/* Severity Assessment via Gemini 3.8 Flash */}
            {triageSuccess && (
              <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Severity Index:
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        severityIndex >= 75
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                          : severityIndex >= 50
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : severityIndex >= 25
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      }`}
                    >
                      {severityLabel} ({severityIndex}/100)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Confidence: {(severityConfidence * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Severity Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      severityIndex >= 75
                        ? 'bg-rose-500'
                        : severityIndex >= 50
                        ? 'bg-amber-500'
                        : severityIndex >= 25
                        ? 'bg-blue-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(5, severityIndex)}%` }}
                  />
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {severityExplanation}
                </p>

                {isInsufficientInfo && (
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>Description is brief. Additional landmark details recommended for higher confidence.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category Selector Grid (Priority 3: Manual Precedence Guaranteed) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                2. Category & Department Routing
              </label>
              {aiDetectedCategory && (
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {userHasManuallySelectedCategory
                    ? 'Manual category prioritized ✓'
                    : 'AI recommended category applied ✨'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CIVIC_CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setUserHasManuallySelectedCategory(true);
                      setCategory(cat.id);
                      setDepartment(cat.typicalDepartment);
                      setSlaHours(cat.defaultSlaHours);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 shadow-sm ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="text-xl mb-1">{cat.icon}</span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                      {getCatLabel(cat.id, cat.label)}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      SLA: {cat.defaultSlaHours}h
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Category Precedence Explanation Banner */}
            {aiDetectedCategory && (
              <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">Status:</span>
                  {userHasManuallySelectedCategory ? (
                    <span className="text-emerald-700 dark:text-emerald-300 font-semibold truncate">
                      Citizen manual selection ({category.replace('_', ' ')}) is authoritative.
                    </span>
                  ) : (
                    <span className="text-blue-700 dark:text-blue-300 font-semibold truncate">
                      AI recommendation ({category.replace('_', ' ')}) selected by default.
                    </span>
                  )}
                </div>
                {userHasManuallySelectedCategory && aiDetectedCategory !== category && (
                  <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                    (AI suggested: {aiDetectedCategory.replace('_', ' ')})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 3. Photo Evidence Section (Exclusively inside Report an Issue) */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>3. Photo Evidence ({photos.length} of 3 attached)</span>
              </label>

              {/* Photo Counter Status Pill */}
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                    photos.length === 0
                      ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                      : photos.length === 1
                      ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  {photos.length >= 2 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  )}
                  <span>
                    {photos.length === 0
                      ? '0 / 3 attached • Minimum 2 required'
                      : photos.length === 1
                      ? '1 / 3 attached • 1 more required'
                      : photos.length === 2
                      ? '2 / 3 attached • Minimum met (1 slot open)'
                      : '3 / 3 attached • Maximum limit reached'}
                  </span>
                </span>
              </div>
            </div>

            {/* Hidden Native File & Camera Inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleCameraCapture}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleGalleryUpload}
            />
            <input
              ref={retakeInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleRetakeInput}
            />

            {/* Top Action Controls: "Take Photo" and "Upload Photos" Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Take Photo Button (Device Camera) */}
              <button
                type="button"
                onClick={() => {
                  if (photos.length >= 3) {
                    setPhotoError('Maximum of 3 photos reached. Remove an existing photo to take a new one.');
                    return;
                  }
                  if (cameraInputRef.current) {
                    cameraInputRef.current.value = '';
                    cameraInputRef.current.click();
                  }
                }}
                disabled={photos.length >= 3 || isProcessingPhotos}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                title="Capture photo using device camera"
              >
                <Camera className="w-4 h-4 shrink-0" />
                <span>Take Photo</span>
                {photos.length < 3 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/20 font-mono">
                    Slot {photos.length + 1}
                  </span>
                )}
              </button>

              {/* Upload Photos Button (Gallery Multi-Picker) */}
              <button
                type="button"
                onClick={() => {
                  if (photos.length >= 3) {
                    setPhotoError('Maximum of 3 photos reached. Remove an existing photo to upload new ones.');
                    return;
                  }
                  if (galleryInputRef.current) {
                    galleryInputRef.current.value = '';
                    galleryInputRef.current.click();
                  }
                }}
                disabled={photos.length >= 3 || isProcessingPhotos}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Select 1 to 3 photos from device gallery"
              >
                <Upload className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Upload Photos</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                  (Gallery)
                </span>
              </button>
            </div>

            {/* Validation Alert Box */}
            {photos.length < 2 && (
              <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Minimum 2 photos required for civic verification.</span> Currently{' '}
                  <b>{photos.length} of 3</b> photos attached. Please capture or upload at least{' '}
                  <b>{2 - photos.length} more photo(s)</b> from different angles or distances before submitting.
                </div>
              </div>
            )}

            {/* Processing / Conversion Indicator */}
            {isProcessingPhotos && (
              <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Converting image to genuine JPG format (image/jpeg) & optimizing compression...</span>
              </div>
            )}

            {/* Error Message */}
            {photoError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
                <span>{photoError}</span>
                <button
                  type="button"
                  onClick={() => setPhotoError(null)}
                  className="text-xs font-bold underline cursor-pointer ml-2"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Previews Grid: Attached Photos (1 to 3 items) */}
            {photos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-sm flex flex-col"
                  >
                    {/* Image Thumbnail */}
                    <div className="relative h-32 w-full overflow-hidden bg-black/10">
                      <img
                        src={photo.dataUrl}
                        alt={`Civic photo evidence #${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-white text-[10px] font-extrabold">
                          #{index + 1} {index === 0 ? '(Primary)' : ''}
                        </span>
                      </div>

                      {/* Genuine JPG Badge */}
                      <div className="absolute bottom-2 left-2">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-900/80 backdrop-blur-sm text-emerald-200 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>JPG &bull; {formatFileSize(photo.sizeBytes)}</span>
                        </span>
                      </div>

                      {/* Zoom Button */}
                      <button
                        type="button"
                        onClick={() => setZoomedPhoto(photo)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Zoom full photo"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Bottom Action Strip: Retake & Remove */}
                    <div className="p-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleTriggerRetake(index)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-colors cursor-pointer"
                        title="Retake / replace this photo slot"
                      >
                        <RotateCcw className="w-3 h-3 text-amber-500" />
                        <span>Retake</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Open Slot Placeholder (if photos < 3) */}
                {photos.length < 3 && (
                  <div
                    onClick={() => {
                      if (cameraInputRef.current) {
                        cameraInputRef.current.value = '';
                        cameraInputRef.current.click();
                      }
                    }}
                    className="h-40 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col items-center justify-center text-center p-4 transition-colors cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950 text-slate-500 group-hover:text-emerald-600 flex items-center justify-center mb-1.5 transition-colors">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Add Photo #{photos.length + 1}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {photos.length < 2 ? 'Required (Min 2)' : 'Optional (Max 3)'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 text-center space-y-2">
                <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No Photos Attached Yet
                </div>
                <p className="text-[11px] text-slate-500">
                  Take photos using your camera or upload 2 to 3 photos from your gallery.
                </p>
              </div>
            )}

            {/* Quick Sample Presets (auto-converted to genuine JPGs) */}
            <div className="pt-1">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1.5">
                Or test with verified multi-angle sample photos (auto-converted to genuine JPG):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SAMPLE_PHOTOS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>📷</span>
                    <span>{preset.name} (2 photos)</span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Image Verification Section (Dual Engine: TinyFish + Gemini) */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    🛡️
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>AI Image Verification</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Dual Audit
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Independent checks for online image reuse (TinyFish) & AI generation / manipulation (Gemini).
                    </p>
                  </div>
                </div>

                {photos.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleVerifyPhoto(activeVerificationPhotoIndex)}
                      disabled={!!verifyingIndices[activeVerificationPhotoIndex]}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      title="Verify selected photo"
                    >
                      {verifyingIndices[activeVerificationPhotoIndex] ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      ) : (
                        <SearchCheck className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>
                        {verifyingIndices[activeVerificationPhotoIndex]
                          ? `Auditing #${activeVerificationPhotoIndex + 1}...`
                          : `Verify Photo #${activeVerificationPhotoIndex + 1}`}
                      </span>
                    </button>

                    {photos.length > 1 && (
                      <button
                        type="button"
                        onClick={handleVerifyAllPhotos}
                        disabled={Object.values(verifyingIndices).some(Boolean)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                        title="Audit all attached photos"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Audit All ({photos.length})</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {photos.length > 0 && (
                <div className="space-y-3">
                  {/* Photo Selector Tabs (if multiple photos attached) */}
                  {photos.length > 1 && (
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl overflow-x-auto no-scrollbar">
                      {photos.map((_, pIdx) => {
                        const isSelected = activeVerificationPhotoIndex === pIdx;
                        const vResult = photoVerifications[pIdx];
                        const isVerifying = !!verifyingIndices[pIdx];

                        return (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => setActiveVerificationPhotoIndex(pIdx)}
                            className={`flex-1 min-w-[130px] flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <span>Photo #{pIdx + 1}</span>
                              {pIdx === 0 && (
                                <span className="text-[10px] text-slate-400 font-normal">(Primary)</span>
                              )}
                            </span>

                            {isVerifying ? (
                              <RefreshCw className="w-3 h-3 animate-spin text-emerald-600 shrink-0" />
                            ) : vResult ? (
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
                                  vResult.verificationStatus === 'Checks completed'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : vResult.verificationStatus === 'Needs review'
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {vResult.verificationStatus}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-normal">Unchecked</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Active Photo Verification Card */}
                  {(() => {
                    const currentIdx = activeVerificationPhotoIndex;
                    const isVerifying = !!verifyingIndices[currentIdx];
                    const activeResult = photoVerifications[currentIdx];
                    const isEvidenceOpen = !!expandedEvidence[currentIdx];

                    return (
                      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                        {/* Card Top Strip: Photo Reference & Audit Action */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-slate-800 dark:text-white">
                              Auditing Photo #{currentIdx + 1}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              ({formatFileSize(photos[currentIdx]?.sizeBytes || 0)} &bull; genuine JPG)
                            </span>
                          </div>

                          {!activeResult && !isVerifying && (
                            <button
                              type="button"
                              onClick={() => handleVerifyPhoto(currentIdx)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-sm cursor-pointer"
                            >
                              Run Dual Audit
                            </button>
                          )}
                        </div>

                        {/* Status Rows Container */}
                        <div className="p-3.5 space-y-3">
                          {/* -------------------------------------------------- */}
                          {/* ROW 1: Online Image Reuse Check — Powered by TinyFish */}
                          {/* -------------------------------------------------- */}
                          <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-base">🐟</span>
                                <div>
                                  <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                                    Online Image Reuse Check — Powered by TinyFish
                                  </div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                    Online web investigation across indexed sources & public records
                                  </div>
                                </div>
                              </div>

                              {/* TinyFish Status Badge */}
                              <div>
                                {isVerifying ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 animate-pulse">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    <span>Investigating web records...</span>
                                  </span>
                                ) : activeResult ? (
                                  activeResult.tinyfish.status === 'Possible match found' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                                      <AlertTriangle className="w-3 h-3" />
                                      <span>Possible match found</span>
                                    </span>
                                  ) : activeResult.tinyfish.status === 'No match found' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>No match found</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                                      <Info className="w-3 h-3 text-slate-400" />
                                      <span>Check unavailable</span>
                                    </span>
                                  )
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800">
                                    <Clock className="w-3 h-3" />
                                    <span>Pending Scan</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* TinyFish Explanation / Details */}
                            {activeResult ? (
                              <div className="text-xs text-slate-600 dark:text-slate-300 pl-6 space-y-1.5">
                                <p>{activeResult.tinyfish.explanation}</p>

                                {/* Candidate matches and source links if any */}
                                {activeResult.tinyfish.matches && activeResult.tinyfish.matches.length > 0 && (
                                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-1.5 mt-2">
                                    <div className="text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                                      <Globe className="w-3 h-3" />
                                      <span>Candidate Web Matches & Source References:</span>
                                    </div>
                                    <div className="space-y-1">
                                      {activeResult.tinyfish.matches.map((match, mIdx) => (
                                        <div
                                          key={mIdx}
                                          className="text-[11px] flex items-center justify-between gap-2 p-1.5 rounded bg-white/70 dark:bg-slate-900/70 border border-amber-100 dark:border-slate-800"
                                        >
                                          <div className="truncate">
                                            <span className="font-bold text-slate-800 dark:text-white">
                                              {match.title || match.source}
                                            </span>
                                            {match.url && (
                                              <span className="text-[10px] text-slate-400 ml-1.5 font-mono truncate">
                                                {match.url}
                                              </span>
                                            )}
                                          </div>
                                          {match.url && (
                                            <a
                                              href={match.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 flex items-center gap-0.5 font-bold text-[10px]"
                                            >
                                              <span>Source</span>
                                              <ExternalLink className="w-2.5 h-2.5" />
                                            </a>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : !isVerifying ? (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-6">
                                Ready to query TinyFish Agent to investigate online references across public municipal and web records.
                              </p>
                            ) : null}
                          </div>

                          {/* -------------------------------------------------- */}
                          {/* ROW 2: AI-Generated Image Check — Powered by Gemini */}
                          {/* -------------------------------------------------- */}
                          <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <div>
                                  <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                                    AI-Generated Image Check — Powered by Gemini
                                  </div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                    Diffusion model artifact inspection & sensor physics evaluation
                                  </div>
                                </div>
                              </div>

                              {/* Gemini Status Badge */}
                              <div>
                                {isVerifying ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 animate-pulse">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    <span>Gemini Vision evaluating...</span>
                                  </span>
                                ) : activeResult ? (
                                  activeResult.gemini.status === 'Possible AI-generated' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                                      <ShieldAlert className="w-3 h-3" />
                                      <span>Possible AI-generated</span>
                                    </span>
                                  ) : activeResult.gemini.status === 'Potentially manipulated' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                                      <AlertTriangle className="w-3 h-3" />
                                      <span>Potentially manipulated</span>
                                    </span>
                                  ) : activeResult.gemini.status === 'No strong evidence detected' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>No strong evidence detected</span>
                                    </span>
                                  ) : activeResult.gemini.status === 'Inconclusive' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800">
                                      <AlertTriangle className="w-3 h-3" />
                                      <span>Inconclusive</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                                      <Info className="w-3 h-3 text-slate-400" />
                                      <span>Check unavailable</span>
                                    </span>
                                  )
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800">
                                    <Clock className="w-3 h-3" />
                                    <span>Pending Scan</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Gemini Explanation & Confidence */}
                            {activeResult ? (
                              <div className="text-xs text-slate-600 dark:text-slate-300 pl-6 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <p>{activeResult.gemini.explanation}</p>
                                  {typeof activeResult.gemini.confidence === 'number' && (
                                    <span className="shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                                      {activeResult.gemini.confidence}% Confidence
                                    </span>
                                  )}
                                </div>

                                {activeResult.gemini.detectedClues &&
                                  activeResult.gemini.detectedClues.length > 0 && (
                                    <ul className="space-y-1 pt-1">
                                      {activeResult.gemini.detectedClues.map((clue, cIdx) => (
                                        <li key={cIdx} className="flex items-center gap-1.5 text-[11px]">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                          <span>{clue}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                              </div>
                            ) : !isVerifying ? (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-6">
                                Ready to submit image pixels directly to Gemini Flash vision model to inspect for generative AI patterns, unrealistic smoothness, and digital manipulation.
                              </p>
                            ) : null}
                          </div>

                          {/* -------------------------------------------------- */}
                          {/* Combined Summary & Expandable Evidence Area */}
                          {/* -------------------------------------------------- */}
                          {activeResult && (
                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-slate-800 dark:text-white">
                                    Combined Status:
                                  </span>
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full font-extrabold text-[11px] ${
                                      activeResult.verificationStatus === 'Checks completed'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                        : activeResult.verificationStatus === 'Needs review'
                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    }`}
                                  >
                                    {activeResult.verificationStatus}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedEvidence((prev) => ({
                                      ...prev,
                                      [currentIdx]: !prev[currentIdx],
                                    }))
                                  }
                                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                                >
                                  <span>
                                    {isEvidenceOpen ? 'Hide Verification Evidence' : 'View Verification Evidence'}
                                  </span>
                                  {isEvidenceOpen ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>

                              {/* Concise 4-field Summary Breakdown */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                                  <div className="text-[10px] text-slate-400 uppercase font-bold">Online Reuse</div>
                                  <div className="font-extrabold text-slate-800 dark:text-white truncate">
                                    {activeResult.onlineReuse}
                                  </div>
                                </div>
                                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                                  <div className="text-[10px] text-slate-400 uppercase font-bold">AI Assessment</div>
                                  <div className="font-extrabold text-slate-800 dark:text-white truncate">
                                    {activeResult.aiAssessment}
                                  </div>
                                </div>
                                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                                  <div className="text-[10px] text-slate-400 uppercase font-bold">Source Links</div>
                                  <div className="font-extrabold text-slate-800 dark:text-white truncate">
                                    {activeResult.evidence.sourceLinks.length > 0
                                      ? `${activeResult.evidence.sourceLinks.length} match link(s)`
                                      : 'No match links'}
                                  </div>
                                </div>
                                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                                  <div className="text-[10px] text-slate-400 uppercase font-bold">Verification Status</div>
                                  <div className="font-extrabold text-slate-800 dark:text-white truncate">
                                    {activeResult.verificationStatus}
                                  </div>
                                </div>
                              </div>

                              {/* Expandable Evidence Details */}
                              {isEvidenceOpen && (
                                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs animate-in fade-in duration-200">
                                  <div className="font-extrabold text-slate-800 dark:text-white text-[11px] flex items-center justify-between">
                                    <span>Audited Evidence & Model Observations:</span>
                                    <span className="font-mono text-[10px] text-slate-400">
                                      {new Date(activeResult.verifiedAt).toLocaleTimeString()}
                                    </span>
                                  </div>

                                  <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                                    {activeResult.evidence.briefExplanations.map((exp, eIdx) => (
                                      <div key={eIdx} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                                        {exp}
                                      </div>
                                    ))}
                                  </div>

                                  {activeResult.evidence.sourceLinks.length > 0 && (
                                    <div className="pt-1 space-y-1">
                                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Source Reference URLs:
                                      </div>
                                      {activeResult.evidence.sourceLinks.map((url, uIdx) => (
                                        <a
                                          key={uIdx}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-mono truncate"
                                        >
                                          <span>{url}</span>
                                          <ExternalLink className="w-3 h-3 shrink-0" />
                                        </a>
                                      ))}
                                    </div>
                                  )}

                                  <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 italic">
                                    Transparency notice: Vision models provide probabilistic likelihood assessments based on optical artifacts and do not constitute definitive legal proof.
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Geolocation Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                4. {t('reportLocationLabel', 'Location & Municipal Ward')}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{t('useGps', 'Auto-Detect GPS')}</span>
                </button>
                {address.trim() && (
                  <button
                    type="button"
                    onClick={() => handleTranslateSection('address')}
                    disabled={isTranslatingAddress}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer disabled:opacity-40"
                  >
                    {isTranslatingAddress ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    <span>{t('btnTranslate', 'Translate')}</span>
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('reportLocationLabel', 'Street address or landmark')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="text"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                placeholder="Municipal Ward / Zone"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {addressEn && (
              <div className="mt-2 p-2.5 rounded-xl bg-indigo-50/60 dark:bg-slate-950 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-between text-xs animate-in fade-in">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-900 text-white text-[9px] font-bold">
                    <img src="/gemma-logo.svg" alt="Gemma 4" className="w-2.5 h-2.5 object-contain" />
                    <span>Gemma 4</span>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{addressEn}</span>
                </div>
                <label className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer shrink-0 ml-2">
                  <input
                    type="checkbox"
                    checked={addressReviewed}
                    onChange={(e) => setAddressReviewed(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Reviewed</span>
                </label>
              </div>
            )}
          </div>

          {/* 5. Citizen Verification & Accountability */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>5. Citizen Email Verification</span>
              </label>
              {isEmailVerified ? (
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-300/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Account Verified</span>
                </span>
              ) : (
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-300/40">
                  Verify For Faster Dispatch
                </span>
              )}
            </div>

            {isEmailVerified ? (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{citizenEmail}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        Firebase Verified
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Authenticated Citizen Sentinel &bull; Official grievance registered with verified identity.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-extrabold text-xs text-amber-900 dark:text-amber-200">
                      Email Verification Required
                    </h5>
                    <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                      To prevent malicious or duplicate reports, the municipal dispatch desk requires a verified citizen email address.
                    </p>
                  </div>
                </div>

                {user ? (
                  <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        Account: <b>{user.email}</b>
                      </span>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-md">
                        Pending Verification
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCheckEmailVerification}
                        disabled={checkingAuthVerification}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {checkingAuthVerification ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>{checkingAuthVerification ? 'Checking...' : 'Check Verification'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResendReportVerification}
                        disabled={resendCooldown > 0}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>
                          {resendCooldown > 0
                            ? `Resend in ${resendCooldown}s`
                            : 'Resend Verification Link'}
                        </span>
                      </button>
                    </div>

                    {authVerificationMessage && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        {authVerificationMessage}
                      </p>
                    )}
                    {authVerificationError && (
                      <p className="text-xs text-rose-500 font-medium">{authVerificationError}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Please log in or register with an email to file reports.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Department Dispatch Summary Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Target Authority
                </div>
                <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">
                  {department}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                Citizen SLA
              </div>
              <div className="font-extrabold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                <Clock className="w-3.5 h-3.5" />
                {slaHours} Hours
              </div>
            </div>
          </div>

          {/* Upload Progress Banner */}
          {uploadProgress && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="flex-1">
                <span className="font-bold">{uploadProgress}</span>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
                  Uploading binary image to Firebase Storage & saving record in Cloud Firestore.
                </p>
              </div>
            </div>
          )}

          {/* Submission Error Banner */}
          {submitError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Submission Failed</span>
                <p className="mt-0.5 leading-relaxed text-[11px] text-rose-700 dark:text-rose-300">
                  {submitError}
                </p>
              </div>
            </div>
          )}

          {/* Footer Submit Actions */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {t('btnCancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || photos.length > 3 || !isEmailVerified}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>
                {submitting
                  ? (uploadProgress || 'Saving to Firebase...')
                  : !isEmailVerified
                  ? 'Email Verification Required'
                  : photos.length > 0
                  ? `Dispatch with ${photos.length} Photo${photos.length > 1 ? 's' : ''}`
                  : 'Dispatch Report to Municipal Desk'}
              </span>
            </button>
          </div>
        </form>

        {/* Zoomed Photo Modal */}
        {zoomedPhoto && (
          <div
            className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setZoomedPhoto(null)}
          >
            <div
              className="relative max-w-4xl max-h-[85vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3 bg-black/40 flex items-center justify-between text-white text-xs border-b border-white/10">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{zoomedPhoto.fileName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono">
                    Genuine JPG • {formatFileSize(zoomedPhoto.sizeBytes)} • {zoomedPhoto.width}x{zoomedPhoto.height}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setZoomedPhoto(null)}
                  className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-2 flex-1 flex items-center justify-center overflow-auto max-h-[75vh]">
                <img
                  src={zoomedPhoto.dataUrl}
                  alt="Zoomed civic evidence"
                  className="max-w-full max-h-[70vh] object-contain rounded-xl"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
