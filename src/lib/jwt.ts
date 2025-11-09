import jwt from "jsonwebtoken";
import type { Secret, SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRE = (process.env.JWT_EXPIRE as string) || "1d";

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  area: string;
  iat: number;
  exp: number;
}

export function generateToken(
  payload: Omit<JWTPayload, "iat" | "exp">
): string {
  return jwt.sign(
    payload,
    JWT_SECRET as Secret,
    { expiresIn: JWT_EXPIRE } as SignOptions
  );
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}
