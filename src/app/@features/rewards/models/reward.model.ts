/**
 * Reward entity from API.
 */
export interface Reward {
  uuid: string;
  name: string;
  description?: string;
  points?: number;
  type?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Payload for create/update reward (when needed).
 */
export interface CreateRewardPayload {
  name: string;
  description?: string;
  points?: number;
  type?: string;
  isActive?: boolean;
}
