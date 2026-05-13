export interface JwtPayload {
  sub: string;
  sessionId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}
export interface JwtUser {
  userId: string;
  email: string;
  role: string;
}
