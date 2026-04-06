export interface AuthResponse {
  accessToken: string;
  expiresAt: number;
  csrfToken: string;
  tokenType: string;
}
