export interface AuthResponse {
  accessToken: string;
  csrfToken: string;
  tokenType: string;
  // deviceId?: string; // cái này để lưu token thiết bị, phục vụ cho việc rate-limit
  expiresAt: number;
}

export interface ResetPasswordPayload {
  email: string;
  type: 'reset_password';
}
