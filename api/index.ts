// Vercel serverless function wrapper for Express app
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createServer } from '../server/_core/index.js';

let app: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!app) {
    app = await createServer();
  }
  
  return app(req, res);
}
