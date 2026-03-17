/**
 * Utility functions for text transformations
 */
export class TextTransformUtil {
  /**
   * Convert uppercase text to sentence case
   * Example: "CUSTOMER" -> "Customer", "REFERRAL_PARTNER" -> "Referral Partner"
   * Example: "Profile_completed" -> "Profile Completed"
   */
  static toSentenceCase(text: string | null | undefined): string {
    if (!text) return '';
    
    // Handle special cases
    if (text === 'N/A' || text === 'NA') return text;
    
    // Check if text contains underscores
    if (text.includes('_')) {
      return text
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    
    // Convert to lowercase and capitalize first letter
    const lowercased = text.toLowerCase();
    return lowercased.charAt(0).toUpperCase() + lowercased.slice(1);
  }

  /**
   * Convert snake_case or SCREAMING_SNAKE_CASE to Title Case
   * Example: "REFERRAL_PARTNER" -> "Referral Partner"
   */
  static toTitleCase(text: string | null | undefined): string {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Convert camelCase or PascalCase to readable format with spaces
   * Example: "lifecycleStage" -> "Lifecycle stage"
   */
  static camelToSentence(text: string | null | undefined): string {
    if (!text) return '';
    
    return text
      .replaceAll(/([A-Z])/g, ' $1')
      .toLowerCase()
      .trim()
      .replaceAll(/^\w/, c => c.toUpperCase());
  }
}
