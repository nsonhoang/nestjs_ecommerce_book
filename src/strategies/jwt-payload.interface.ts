export interface JwtPayload {
  sub: string;
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
