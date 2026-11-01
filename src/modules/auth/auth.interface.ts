export interface AuthResponse {
  accessToken: string;
  csrfToken: string;
  tokenType: string;
  expiresAt: number;
  permissions?: string[];
}

export interface ResetPasswordPayload {
  email: string;
  type: 'reset_password';
}
