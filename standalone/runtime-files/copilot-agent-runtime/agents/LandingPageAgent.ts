// landingPageAgent.ts — hardened replacement
import SmartPayloadBuilder from '../utils';
import { AgentExecutor } from '../types';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.resolve(__dirname, '../public');

const TEMPLATES: Record<string, (projectName: string, metadata: any) => string> = {
  default: (projectName, metadata) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${metadata.title || projectName}</title>
      <meta name="description" content="${metadata.description || ''}">
    </head>
    <body>
      <h1>Welcome to ${projectName}</h1>
      <p>${metadata.content || 'Your landing page is live!'}</p>
    </body>
    </html>
  `,
  // You can add other template variants here (e.g. 'marketing', 'portfolio')
};

function validatePayload(payload: any) {
  const missing = [];
  if (!payload?.projectName) missing.push('projectName');
  if (!payload?.metadata) missing.push('metadata');
  if (missing.length) {
    throw new Error(`Missing required payload fields: ${missing.join(', ')}`);
  }
}

export const LandingPageAgent: AgentExecutor = {
  execute: async (payload) => {
    try {
      validatePayload(payload);

      const { projectName, template = 'default', metadata } = payload;

      const safeName = path.basename(projectName); // prevent path traversal
      const builder = TEMPLATES[template] || TEMPLATES.default;
      const html = builder(safeName, metadata);

      // Ensure public dir exists
      if (!fs.existsSync(PUBLIC_DIR)) {
        fs.mkdirSync(PUBLIC_DIR, { recursive: true });
      }

      const filePath = path.join(PUBLIC_DIR, `${safeName}.html`);
      fs.writeFileSync(filePath, html, 'utf8');

      console.info(`[${new Date().toISOString()}] Landing page generated for ${safeName}`);

      return SmartPayloadBuilder.success(`Landing page for ${safeName} generated`, {
        path: filePath,
        preview: `/${safeName}.html`,
      });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] LandingPageAgent error:`, error);
      return SmartPayloadBuilder.error(
        'LandingPageAgent Error',
        error.message || String(error)
      );
    }
  },
};

export default LandingPageAgent;
