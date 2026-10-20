import { describe, it, expect } from 'vitest';
import { evaluateReportEscalation } from './escalationLadder';
import { CivicReport } from '../types';

describe('escalationLadder - Six-Stage Municipal Escalation Logic', () => {
  const baseReport: CivicReport = {
    id: 'NGK-TEST-1',
    title: 'Water pipe leak',
    description: 'Clean drinking water overflowing',
    category: 'water_drainage',
    status: 'Reported',
    priority: 'high',
    severity_score: 7,
    severity_label: 'High Priority',
    department: 'Delhi Jal Board',
    sla_hours: 24,
    latitude: 28.6,
    longitude: 77.2,
    address: 'Connaught Place',
    location_name: 'Connaught Place',
    upvotes: 5,
    createdAt: new Date().toISOString(),
    reportedBy: 'citizen@example.com',
    timeline: [],
  };

  it('evaluates Stage 1 for newly reported issues within SLA window', () => {
    // Created 2 hours ago with 24h SLA
    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    const report: CivicReport = { ...baseReport, createdAt: twoHoursAgo };

    const evaluation = evaluateReportEscalation(report);
    expect(evaluation.isResolved).toBe(false);
    expect(evaluation.isSlaBreached).toBe(false);
    expect(evaluation.slaRemainingHours).toBeGreaterThan(0);
    expect(evaluation.isReminderEligible).toBe(false);
    expect(evaluation.highestEligibleStage).toBe(1);
  });

  it('unlocks Stage 2 automated reminder when Citizen Charter SLA is breached', () => {
    // Created 30 hours ago with 24h SLA
    const thirtyHoursAgo = new Date(Date.now() - 30 * 3600 * 1000).toISOString();
    const report: CivicReport = { ...baseReport, createdAt: thirtyHoursAgo };

    const evaluation = evaluateReportEscalation(report);
    expect(evaluation.isReminderEligible).toBe(true);
    expect(evaluation.highestEligibleStage).toBeGreaterThanOrEqual(2);
  });

  it('unlocks Stage 4 social tagging after 14 days of inaction', () => {
    // Created 15 days ago
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString();
    const report: CivicReport = { ...baseReport, createdAt: fifteenDaysAgo };

    const evaluation = evaluateReportEscalation(report);
    expect(evaluation.isSocialTaggingEligible).toBe(true);
    expect(evaluation.highestEligibleStage).toBeGreaterThanOrEqual(4);
  });

  it('unlocks Stage 5 statutory RTI draft engine after 21 days', () => {
    // Created 22 days ago
    const twentyTwoDaysAgo = new Date(Date.now() - 22 * 24 * 3600 * 1000).toISOString();
    const report: CivicReport = { ...baseReport, createdAt: twentyTwoDaysAgo };

    const evaluation = evaluateReportEscalation(report);
    expect(evaluation.isRtiEligible).toBe(true);
    expect(evaluation.highestEligibleStage).toBeGreaterThanOrEqual(5);
  });

  it('unlocks Stage 6 legal notice after RTI submission and 30-day response window', () => {
    // Created 60 days ago with RTI filed 35 days ago
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString();
    const thirtyFiveDaysAgo = new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString();

    const report: CivicReport = {
      ...baseReport,
      createdAt: sixtyDaysAgo,
      escalationLadder: {
        rtiSubmitted: true,
        rtiSubmittedAt: thirtyFiveDaysAgo,
        rtiResponseReceived: false,
      },
    };

    const evaluation = evaluateReportEscalation(report);
    expect(evaluation.isLegalNoticeEligible).toBe(true);
    expect(evaluation.highestEligibleStage).toBe(6);
  });

  it('halts all escalation stages when report status is Resolved', () => {
    const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString();
    const report: CivicReport = {
      ...baseReport,
      status: 'Resolved',
      createdAt: fortyDaysAgo,
    };

    const evaluation = evaluateReportEscalation(report);
    expect(evaluation.isResolved).toBe(true);
    expect(evaluation.isReminderEligible).toBe(false);
    expect(evaluation.isEscalationEligible).toBe(false);
    expect(evaluation.isSocialTaggingEligible).toBe(false);
    expect(evaluation.isRtiEligible).toBe(false);
    expect(evaluation.isLegalNoticeEligible).toBe(false);
  });
});
