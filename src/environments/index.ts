/**
 * Environment config. Use path alias in app code:
 *   import { environment } from '@env';
 * or
 *   import { environment } from '@env/environment';
 *
 * Build file-replacement (e.g. production) swaps the actual file; this barrel
 * re-exports whichever environment is resolved at build time.
 */
export * from './environment';
