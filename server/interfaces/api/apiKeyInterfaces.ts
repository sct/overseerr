export interface ApiKeyResponse {
  id: number;
  name: string;
  last4: string;
  permissions: number;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date | null;
  userId: number;
}

export interface ApiKeyCreateResponse extends ApiKeyResponse {
  apiKey: string;
}

