import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};
