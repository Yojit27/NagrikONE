import { relations } from 'drizzle-orm';
import { doublePrecision, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table authenticated via Firebase Auth
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  role: text('role').default('citizen'),
  karmaPoints: integer('karma_points').default(100),
  createdAt: timestamp('created_at').defaultNow(),
});

// Citizen email verification records with secure hash and rate limiting
export const emailVerifications = pgTable('email_verifications', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  codeHash: text('code_hash').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  verified: integer('verified').default(0).notNull(), // 0 = unverified, 1 = verified
  verifiedAt: timestamp('verified_at'),
  lastSentAt: timestamp('last_sent_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Civic reports filed by citizens
export const reports = pgTable('reports', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  status: text('status').notNull().default('Reported'),
  priority: text('priority').notNull().default('medium'),
  severityScore: integer('severity_score').default(5),
  severityLabel: text('severity_label').default('Moderate Impact'),
  department: text('department').notNull(),
  slaHours: integer('sla_hours').default(48),
  imageUrl: text('image_url'),
  resolvedProofUrl: text('resolved_proof_url'),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  address: text('address').notNull(),
  locationName: text('location_name').notNull(),
  ward: text('ward'),
  upvotes: integer('upvotes').default(0),
  reporterUid: text('reporter_uid'),
  reportedBy: text('reported_by').default('Citizen'),
  safetyHazards: text('safety_hazards'), // JSON stringified array
  timeline: text('timeline'), // JSON stringified timeline events
  verificationResult: text('verification_result'), // JSON stringified AI verification result
  createdAt: timestamp('created_at').defaultNow(),
});

// Upvotes on reports
export const upvotes = pgTable('upvotes', {
  id: serial('id').primaryKey(),
  reportId: text('report_id')
    .references(() => reports.id, { onDelete: 'cascade' })
    .notNull(),
  userUid: text('user_uid').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Comments on reports
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  reportId: text('report_id')
    .references(() => reports.id, { onDelete: 'cascade' })
    .notNull(),
  authorUid: text('author_uid').notNull(),
  authorName: text('author_name').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  reports: many(reports),
  upvotes: many(upvotes),
  comments: many(comments),
}));

export const reportsRelations = relations(reports, ({ many }) => ({
  upvotes: many(upvotes),
  comments: many(comments),
}));

export const upvotesRelations = relations(upvotes, ({ one }) => ({
  report: one(reports, {
    fields: [upvotes.reportId],
    references: [reports.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  report: one(reports, {
    fields: [comments.reportId],
    references: [reports.id],
  }),
}));
