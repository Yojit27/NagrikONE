import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  increment,
  deleteDoc,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage, auth } from '../lib/firebase';
import { CivicReport } from '../types';
import { ConvertedJpgImage } from '../utils/imageConverter';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validates image file type and size (Max 10MB)
 */
export function validateImage(fileOrSize: { sizeBytes?: number; size?: number; type?: string }): {
  valid: boolean;
  error?: string;
} {
  const size = fileOrSize.sizeBytes ?? fileOrSize.size ?? 0;
  const maxBytes = 10 * 1024 * 1024; // 10MB

  if (size > maxBytes) {
    return {
      valid: false,
      error: `Image size exceeds the 10MB limit (size: ${(size / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  if (fileOrSize.type && !fileOrSize.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'Invalid file format. Please attach a valid image (JPEG, PNG, or WebP).',
    };
  }

  return { valid: true };
}

/**
 * Helper to convert data URL to Blob for clean binary Storage upload
 */
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  try {
    const res = await fetch(dataUrl);
    return await res.blob();
  } catch {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0]?.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const base64Data = parts[1] || parts[0];
    const binaryStr = atob(base64Data);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  }
}

/**
 * Uploads a single report evidence photo to Firebase Storage
 * Returns permanent download URL and storage path
 */
export async function uploadReportPhoto(
  photo: ConvertedJpgImage | File | Blob,
  reportId: string,
  index: number
): Promise<{ downloadUrl: string; storagePath: string }> {
  let blob: Blob;
  let fileName = `evidence_${index + 1}.jpg`;

  if ('dataUrl' in photo) {
    // ConvertedJpgImage
    const validation = validateImage({ sizeBytes: photo.sizeBytes });
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    blob = await dataUrlToBlob(photo.dataUrl);
    fileName = photo.fileName || fileName;
  } else if (photo instanceof File) {
    const validation = validateImage(photo);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    blob = photo;
    fileName = photo.name;
  } else {
    // Plain Blob
    const validation = validateImage(photo);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    blob = photo;
  }

  // Create sanitized, collision-resistant storage path
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const storagePath = `reports/${reportId}/${timestamp}_${index}_${randomSuffix}_${sanitizedName}`;

  const storageRef = ref(storage, storagePath);

  // Upload genuine bytes to Firebase Storage
  await uploadBytes(storageRef, blob, {
    contentType: 'image/jpeg',
    customMetadata: {
      reportId,
      uploadedBy: auth.currentUser?.uid || 'anonymous',
      uploadedAt: new Date().toISOString(),
    },
  });

  // Get the permanent download URL
  const downloadUrl = await getDownloadURL(storageRef);

  return { downloadUrl, storagePath };
}

/**
 * Safely removes uploaded images from Firebase Storage in case of rollback or deletion
 */
export async function deleteStorageObjects(storagePaths: string[]): Promise<void> {
  const deletePromises = storagePaths.map(async (path) => {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (err: any) {
      // Idempotent: If object is already deleted or not found, it is successfully gone
      if (err?.code === 'storage/object-not-found' || err?.message?.includes('does not exist')) {
        return;
      }
      console.warn(`Could not delete storage object at ${path}:`, err);
    }
  });

  await Promise.allSettled(deletePromises);
}

/**
 * Persists a complete report record to Cloud Firestore
 */
export async function saveReportToFirestore(report: CivicReport): Promise<CivicReport> {
  const path = `reports/${report.id}`;
  try {
    const reportRef = doc(db, 'reports', report.id);

    // Clean payload for Firestore compatibility (remove undefined properties)
    const payload: Record<string, any> = {
      id: report.id,
      title: report.title,
      description: report.description,
      category: report.category,
      status: report.status || 'Reported',
      priority: report.priority || 'medium',
      severity_score: report.severity_score || 5,
      severity_label: report.severity_label || 'Moderate',
      department: report.department,
      sla_hours: report.sla_hours || 48,
      latitude: report.latitude,
      longitude: report.longitude,
      accuracy: report.accuracy || 10,
      address: report.address || '',
      location_name: report.location_name || report.address || '',
      ward: report.ward || 'Central Ward',
      upvotes: report.upvotes ?? 1,
      createdAt: report.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reportedBy: report.reportedBy || 'Citizen Sentinel',
      authorUid: report.authorUid || auth.currentUser?.uid || null,
      isUserSubmitted: true,
      timeline: report.timeline || [
        {
          status: 'Reported',
          timestamp: new Date().toISOString(),
          note: `Grievance registered. Transmitted via NagrikOne AI to ${report.department}.`,
          officer: 'NagrikOne AI Dispatcher',
        },
      ],
    };

    if (report.imageUrl) payload.imageUrl = report.imageUrl;
    if (report.images && report.images.length > 0) payload.images = report.images;
    if (report.storagePath) payload.storagePath = report.storagePath;
    if (report.storagePaths && report.storagePaths.length > 0) payload.storagePaths = report.storagePaths;
    if (report.safety_hazards) payload.safety_hazards = report.safety_hazards;
    if (report.administrative_summary) payload.administrative_summary = report.administrative_summary;
    if (report.verificationResult) payload.verificationResult = report.verificationResult;
    if (report.escalationLadder) payload.escalationLadder = report.escalationLadder;

    // AI Report Enhancement & Triaging (Priorities 1, 2, 3)
    if (report.original_description) payload.original_description = report.original_description;
    if (report.polished_description_en) payload.polished_description_en = report.polished_description_en;
    if (report.severity_index !== undefined) payload.severity_index = report.severity_index;
    if (report.severity_confidence !== undefined) payload.severity_confidence = report.severity_confidence;
    if (report.severity_explanation) payload.severity_explanation = report.severity_explanation;
    if (report.is_insufficient_info !== undefined) payload.is_insufficient_info = report.is_insufficient_info;
    if (report.manual_category) payload.manual_category = report.manual_category;
    if (report.ai_detected_category) payload.ai_detected_category = report.ai_detected_category;
    if (report.final_category) payload.final_category = report.final_category;
    if (report.category_confidence !== undefined) payload.category_confidence = report.category_confidence;
    if (report.category_explanation) payload.category_explanation = report.category_explanation;

    // Gemma 4 Multilingual Translation & Citizen Review
    if (report.originalText) payload.originalText = report.originalText;
    if (report.originalLanguage) payload.originalLanguage = report.originalLanguage;
    if (report.englishTranslation) payload.englishTranslation = report.englishTranslation;
    if (report.translationReviewed !== undefined) payload.translationReviewed = report.translationReviewed;
    if (report.gemmaModelUsed) payload.gemmaModelUsed = report.gemmaModelUsed;

    await setDoc(reportRef, payload, { merge: true });
    return { ...report, ...payload };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `reports/${report.id}`);
    throw err;
  }
}

/**
 * Orchestrates image upload to Firebase Storage and atomic report persistence in Firestore
 * Handles partial failures with automatic rollback to prevent orphaned files.
 */
export async function submitReportWithFirebase(
  data: Omit<CivicReport, 'id' | 'createdAt' | 'upvotes' | 'timeline'>,
  photos: (ConvertedJpgImage | File | Blob)[] = [],
  onProgress?: (message: string) => void
): Promise<CivicReport> {
  const newId = `NGK-${Math.floor(1000 + Math.random() * 9000)}`;
  const uploadedUrls: string[] = [];
  const uploadedStoragePaths: string[] = [];

  try {
    // 1. Upload photos to Firebase Storage if present
    if (photos && photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        if (onProgress) {
          onProgress(`Processing and uploading photo ${i + 1} of ${photos.length}...`);
        }
        try {
          const { downloadUrl, storagePath } = await uploadReportPhoto(photos[i], newId, i);
          uploadedUrls.push(downloadUrl);
          uploadedStoragePaths.push(storagePath);
        } catch (storageErr) {
          console.warn(`Firebase Storage upload for photo ${i + 1} fell back to local image data:`, storageErr);
          const p = photos[i];
          const fallbackDataUrl = 'dataUrl' in p ? p.dataUrl : '';
          if (fallbackDataUrl) {
            uploadedUrls.push(fallbackDataUrl);
          }
        }
      }
    }

    if (onProgress) {
      onProgress('Saving grievance details to Cloud Firestore...');
    }

    // 2. Assemble complete CivicReport document
    const primaryImageUrl = uploadedUrls[0] || data.imageUrl || undefined;
    const primaryStoragePath = uploadedStoragePaths[0] || undefined;

    const reportToSave: CivicReport = {
      ...data,
      id: newId,
      imageUrl: primaryImageUrl,
      images: uploadedUrls.length > 0 ? uploadedUrls : data.images,
      storagePath: primaryStoragePath,
      storagePaths: uploadedStoragePaths.length > 0 ? uploadedStoragePaths : undefined,
      createdAt: new Date().toISOString(),
      upvotes: 1,
      hasUpvoted: true,
      isUserSubmitted: true,
      authorUid: auth.currentUser?.uid || data.authorUid,
      reportedBy: auth.currentUser?.displayName || auth.currentUser?.email || data.reportedBy || 'Citizen Sentinel',
      timeline: [
        {
          status: 'Reported',
          timestamp: new Date().toISOString(),
          note: `Grievance registered. Transmitted via NagrikOne AI to ${data.department}.`,
          officer: 'NagrikOne AI Dispatcher',
        },
      ],
    };

    // 3. Save report to Firestore, with seamless fallback to backend API
    try {
      await saveReportToFirestore(reportToSave);
    } catch (firestoreErr) {
      console.warn('Firestore write fallback to backend /api/reports endpoint:', firestoreErr);
      const token = auth.currentUser ? await auth.currentUser.getIdToken().catch(() => '') : '';
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(reportToSave),
      });
      if (!res.ok) {
        throw firestoreErr;
      }
    }

    return reportToSave;
  } catch (err: any) {
    // Rollback: delete uploaded images from Firebase Storage to avoid orphaned files
    if (uploadedStoragePaths.length > 0) {
      console.warn('Rolling back uploaded images from Firebase Storage after failure...');
      await deleteStorageObjects(uploadedStoragePaths).catch((e) =>
        console.warn('Storage rollback cleanup error:', e)
      );
    }
    throw err;
  }
}

/**
 * Subscribes in real-time to reports collection in Firestore
 */
/**
 * Normalizes legacy or partial Firestore documents into a robust CivicReport
 */
export function normalizeFirestoreReport(d: any, id: string): CivicReport {
  const images: string[] = Array.isArray(d.images) && d.images.length > 0
    ? d.images
    : d.imageUrl
    ? [d.imageUrl]
    : [];

  const primaryImageUrl = d.imageUrl || (images.length > 0 ? images[0] : undefined);

  return {
    id: id || d.id,
    title: d.title || 'Civic Infrastructure Grievance',
    description: d.description || '',
    category: d.category || 'road_pothole',
    status: d.status || 'Reported',
    priority: d.priority || 'medium',
    severity_score: typeof d.severity_score === 'number' ? d.severity_score : 5,
    severity_label: d.severity_label || 'Moderate Priority',
    department: d.department || 'Public Works Department (PWD)',
    sla_hours: typeof d.sla_hours === 'number' ? d.sla_hours : 72,
    imageUrl: primaryImageUrl,
    images: images.length > 0 ? images : undefined,
    storagePath: d.storagePath || undefined,
    storagePaths: Array.isArray(d.storagePaths) ? d.storagePaths : undefined,
    resolved_proof_url: d.resolved_proof_url || undefined,
    latitude: typeof d.latitude === 'number' ? d.latitude : 28.6139,
    longitude: typeof d.longitude === 'number' ? d.longitude : 77.2090,
    accuracy: typeof d.accuracy === 'number' ? d.accuracy : undefined,
    address: d.address || d.location_name || 'Ward Area, Delhi NCR',
    location_name: d.location_name || d.address || 'Ward Area',
    ward: d.ward || 'Ward 42',
    upvotes: typeof d.upvotes === 'number' ? Math.max(0, d.upvotes) : 0,
    hasUpvoted: Boolean(d.hasUpvoted),
    createdAt: d.createdAt || new Date().toISOString(),
    reportedBy: d.reportedBy || 'Citizen Sentinel',
    authorUid: d.authorUid || undefined,
    isUserSubmitted: Boolean(d.isUserSubmitted || d.authorUid),
    safety_hazards: Array.isArray(d.safety_hazards) ? d.safety_hazards : [],
    administrative_summary: d.administrative_summary || '',
    timeline: Array.isArray(d.timeline) && d.timeline.length > 0
      ? d.timeline
      : [
          {
            status: d.status || 'Reported',
            timestamp: d.createdAt || new Date().toISOString(),
            note: 'Grievance recorded in system.',
            officer: 'Municipal Desk',
          },
        ],
    official_response: d.official_response || '',
    verificationResult: d.verificationResult || undefined,
    escalationLadder: d.escalationLadder || undefined,

    // Gemma 4 Multilingual Translation & Citizen Review
    originalText: d.originalText || undefined,
    originalLanguage: d.originalLanguage || undefined,
    englishTranslation: d.englishTranslation || undefined,
    translationReviewed: typeof d.translationReviewed === 'boolean' ? d.translationReviewed : undefined,
    gemmaModelUsed: d.gemmaModelUsed || undefined,
  };
}

/**
 * Subscribes in real-time to reports collection in Firestore
 */
export function subscribeToFirestoreReports(
  onUpdate: (reports: CivicReport[]) => void,
  onError?: (error: Error) => void
): () => void {
  const colRef = collection(db, 'reports');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const reports: CivicReport[] = [];
      snapshot.forEach((docSnap) => {
        reports.push(normalizeFirestoreReport(docSnap.data(), docSnap.id));
      });

      // Sort newest first
      reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(reports);
    },
    (err) => {
      console.warn('Real-time reports snapshot note:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Fetches all reports once from Cloud Firestore
 */
export async function getReportsFromFirestore(): Promise<CivicReport[]> {
  try {
    const colRef = collection(db, 'reports');
    const snapshot = await getDocs(colRef);
    const reports: CivicReport[] = [];
    snapshot.forEach((docSnap) => {
      reports.push(normalizeFirestoreReport(docSnap.data(), docSnap.id));
    });

    reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return reports;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'reports');
    return [];
  }
}

/**
 * Toggles an upvote in Cloud Firestore
 */
export async function upvoteReportInFirestore(reportId: string, delta: number): Promise<void> {
  try {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, {
      upvotes: increment(delta),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn(`Could not update upvotes for ${reportId} in Firestore:`, err);
  }
}

/**
 * Evaluates whether the currently authenticated citizen owns the report
 */
export function canUserDeleteReport(
  report: CivicReport,
  userUid?: string | null,
  userEmail?: string | null
): boolean {
  if (!userUid) return false;
  // Direct ownership via UID
  if (report.authorUid && report.authorUid === userUid) return true;
  // Legacy reports where authorUid was not stored, but reportedBy matches citizen email
  if (
    !report.authorUid &&
    userEmail &&
    report.reportedBy &&
    report.reportedBy.toLowerCase() === userEmail.toLowerCase()
  ) {
    return true;
  }
  // In-session local author flag (if authorUid was not recorded)
  if (report.isUserSubmitted && !report.authorUid) {
    return true;
  }
  return false;
}

/**
 * Deletes a report from Cloud Firestore and its associated Storage images.
 * Enforces ownership on client and triggers Firestore rule enforcement.
 */
export async function deleteReportFromFirestore(report: CivicReport): Promise<{
  success: boolean;
  deletedImagesCount: number;
}> {
  const currentUid = auth.currentUser?.uid;
  const currentEmail = auth.currentUser?.email;

  if (!currentUid) {
    throw new Error('Authentication required: Please log in to delete this grievance.');
  }

  const isOwner = canUserDeleteReport(report, currentUid, currentEmail);
  if (!isOwner) {
    throw new Error('Permission denied: You can only retract or delete reports that you authored.');
  }

  // 1. Gather all associated storage paths
  const pathsToDelete: string[] = [];
  if (report.storagePath) pathsToDelete.push(report.storagePath);
  if (report.storagePaths) {
    report.storagePaths.forEach((p) => {
      if (!pathsToDelete.includes(p)) pathsToDelete.push(p);
    });
  }

  // Also check if any image URLs contain encoded Firebase Storage paths
  const allUrls = [report.imageUrl, ...(report.images || [])].filter(Boolean) as string[];
  allUrls.forEach((url) => {
    if (url.includes('/o/reports%2F')) {
      const match = url.match(/\/o\/(reports%2F[^?]+)/);
      if (match) {
        try {
          const decoded = decodeURIComponent(match[1]);
          if (!pathsToDelete.includes(decoded)) {
            pathsToDelete.push(decoded);
          }
        } catch {
          // ignore uri decode error
        }
      }
    }
  });

  // 2. Delete Firestore record (Security rules strictly verify request.auth.uid == resource.data.authorUid)
  try {
    const reportRef = doc(db, 'reports', report.id);
    await deleteDoc(reportRef);
  } catch (err: any) {
    handleFirestoreError(err, OperationType.DELETE, `reports/${report.id}`);
    throw new Error(
      err?.message?.includes('permission-denied')
        ? 'Permission denied: Server security rules prevented deletion. You do not own this report.'
        : `Could not delete report from database: ${err?.message || 'Network error'}`
    );
  }

  // 3. Delete associated storage objects
  if (pathsToDelete.length > 0) {
    await deleteStorageObjects(pathsToDelete);
  }

  return { success: true, deletedImagesCount: pathsToDelete.length };
}
