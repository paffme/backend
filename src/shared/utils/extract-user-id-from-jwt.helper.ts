import * as jwt from 'jsonwebtoken';
import { JwtPayload } from '../auth/jwt-payload.interface';

export function ExtractUserIdFromJWT(token: string): string {
  const decoded = jwt.decode(token) as JwtPayload;
  return decoded.id;
}
