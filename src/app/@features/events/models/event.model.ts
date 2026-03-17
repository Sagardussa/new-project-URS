/**
 * Event payload for create/update API.
 */
export interface CreateEventPayload {
  eventName: string;
  displayName: string;
  description: string;
  category: string;
  expectedMetadata: Record<string, string>;
  isActive: boolean;
  allowDuplicates: boolean;
}



