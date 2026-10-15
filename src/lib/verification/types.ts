export interface PlatformVerificationMeta {
  platform: string;
  name: string;
  fieldName: string;
  settingsUrl: string | ((handle: string) => string);
  instructions: string;
  tips?: string | undefined;
}

export interface VerificationChallengeData {
  platform: string;
  handle: string;
  challengeCode: string;
  expiresAt: string;
  attemptsRemaining: number;
  settingsUrl: string;
  fieldName: string;
  instructions: string;
}

export interface VerificationResult {
  verified: boolean;
  attemptsRemaining?: number | undefined;
  error?: string | undefined;
  profileId?: string | undefined;
}

