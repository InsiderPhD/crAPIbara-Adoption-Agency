import { sanitize } from 'isomorphic-dompurify';

/**
 * Sanitizes HTML input to prevent XSS attacks
 * @param input The string to sanitize
 * @returns Sanitized string
 */
export function sanitizeHtml(input: string): string {
  return sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true // Keep the text content
  });
} 