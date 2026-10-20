import { describe, it, expect } from 'vitest';
import {
  normalizeFirestoreReport,
  canUserDeleteReport,
  validateImage,
} from './reportFirebaseService';
import { CivicReport } from '../types';

describe('reportFirebaseService - Data Integrity & Deletion Security', () => {
  describe('canUserDeleteReport', () => {
    const mockReport: CivicReport = {
      id: 'NGK-5001',
      title: 'Pothole on Ring Road',
      description: 'Dangerous pothole',
      category: 'road_pothole',
      status: 'Reported',
      priority: 'high',
      severity_score: 8,
      severity_label: 'High Priority',
      department: 'PWD',
      sla_hours: 48,
      latitude: 28.6139,
      longitude: 77.209,
      address: 'Ring Road',
      location_name: 'Ring Road',
      upvotes: 3,
      createdAt: new Date().toISOString(),
      reportedBy: 'rajesh@example.com',
      authorUid: 'uid-user-123',
      timeline: [],
    };

    it('allows deletion when current user UID matches authorUid', () => {
      expect(canUserDeleteReport(mockReport, 'uid-user-123', 'rajesh@example.com')).toBe(true);
    });

    it('denies deletion when current user UID does not match authorUid', () => {
      expect(canUserDeleteReport(mockReport, 'uid-attacker-999', 'attacker@example.com')).toBe(false);
    });

    it('denies deletion when user is unauthenticated (null or undefined UID)', () => {
      expect(canUserDeleteReport(mockReport, null, null)).toBe(false);
      expect(canUserDeleteReport(mockReport, undefined, undefined)).toBe(false);
    });

    it('allows deletion of legacy reports where authorUid is missing but reportedBy matches citizen email', () => {
      const legacyReport: CivicReport = {
        ...mockReport,
        authorUid: undefined,
        reportedBy: 'anita@delhi.gov.in',
      };
      expect(canUserDeleteReport(legacyReport, 'uid-anita-456', 'anita@delhi.gov.in')).toBe(true);
    });

    it('denies deletion of legacy report if email does not match reportedBy', () => {
      const legacyReport: CivicReport = {
        ...mockReport,
        authorUid: undefined,
        reportedBy: 'anita@delhi.gov.in',
      };
      expect(canUserDeleteReport(legacyReport, 'uid-other-789', 'other@delhi.gov.in')).toBe(false);
    });
  });

  describe('normalizeFirestoreReport', () => {
    it('normalizes legacy documents containing only single imageUrl', () => {
      const rawDoc = {
        title: 'Broken street light',
        category: 'streetlight',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/app/o/reports%2F1.jpg',
      };
      const normalized = normalizeFirestoreReport(rawDoc, 'NGK-1001');

      expect(normalized.id).toBe('NGK-1001');
      expect(normalized.title).toBe('Broken street light');
      expect(normalized.imageUrl).toBe(rawDoc.imageUrl);
      expect(normalized.images).toEqual([rawDoc.imageUrl]);
      expect(normalized.status).toBe('Reported');
      expect(normalized.priority).toBe('medium');
      expect(normalized.department).toBe('Public Works Department (PWD)');
      expect(normalized.upvotes).toBe(0);
      expect(normalized.timeline.length).toBeGreaterThan(0);
    });

    it('normalizes modern documents with multi-image array', () => {
      const rawDoc = {
        title: 'Garbage dump on sidewalk',
        category: 'garbage_waste',
        images: [
          'https://storage.googleapis.com/app/img1.jpg',
          'https://storage.googleapis.com/app/img2.jpg',
          'https://storage.googleapis.com/app/img3.jpg',
        ],
        storagePaths: ['reports/1/img1.jpg', 'reports/1/img2.jpg', 'reports/1/img3.jpg'],
      };
      const normalized = normalizeFirestoreReport(rawDoc, 'NGK-1002');

      expect(normalized.id).toBe('NGK-1002');
      expect(normalized.images).toHaveLength(3);
      expect(normalized.imageUrl).toBe(rawDoc.images[0]);
      expect(normalized.storagePaths).toEqual(rawDoc.storagePaths);
    });

    it('provides sensible coordinate and status defaults for malformed documents', () => {
      const rawDoc = {};
      const normalized = normalizeFirestoreReport(rawDoc, 'NGK-9999');

      expect(normalized.id).toBe('NGK-9999');
      expect(normalized.latitude).toBeCloseTo(28.6139);
      expect(normalized.longitude).toBeCloseTo(77.209);
      expect(normalized.severity_score).toBe(5);
      expect(normalized.upvotes).toBe(0);
    });
  });

  describe('validateImage', () => {
    it('approves standard image file under 10MB', () => {
      const result = validateImage({ sizeBytes: 2 * 1024 * 1024, type: 'image/jpeg' });
      expect(result.valid).toBe(true);
    });

    it('rejects image exceeding 10MB', () => {
      const result = validateImage({ sizeBytes: 11 * 1024 * 1024, type: 'image/jpeg' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10MB limit');
    });

    it('rejects unsupported non-image file type', () => {
      const result = validateImage({ sizeBytes: 50000, type: 'application/pdf' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file format');
    });
  });
});
