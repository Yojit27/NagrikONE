/**
 * Centralized AI Models Configuration for NagrikOne
 *
 * Strict Model Architecture:
 * - Chatbot: gemini-3.1-flash-lite
 * - Multilingual Speech-to-Text: gemini-3.5-transcribe
 * - Report Translation: gemma-4-26b-a4b-it (fallback: gemma-4-31b-it)
 * - Civic Severity Assessment: gemini-3.8-flash
 * - Preliminary AI-Generated Image Assessment: gemini-3.8-flash
 * - Image Web Reuse Investigation: TinyFish Search API
 */

export const AI_CONFIG = {
  CHATBOT_MODEL: 'gemini-3.1-flash-lite',
  TRANSCRIBE_MODEL: 'gemini-3.5-transcribe',
  TRANSLATION_MODEL: 'gemma-4-26b-a4b-it',
  TRANSLATION_FALLBACK_MODEL: 'gemma-4-31b-it',
  SEVERITY_MODEL: 'gemini-3.8-flash',
  IMAGE_DETECTION_MODEL: 'gemini-3.8-flash',
} as const;

export type SupportedAiModel =
  | typeof AI_CONFIG.CHATBOT_MODEL
  | typeof AI_CONFIG.TRANSCRIBE_MODEL
  | typeof AI_CONFIG.TRANSLATION_MODEL
  | typeof AI_CONFIG.TRANSLATION_FALLBACK_MODEL
  | typeof AI_CONFIG.SEVERITY_MODEL
  | typeof AI_CONFIG.IMAGE_DETECTION_MODEL;
