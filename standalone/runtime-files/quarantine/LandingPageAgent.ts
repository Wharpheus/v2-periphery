import SmartPayloadBuilder from '../utils';
import { AgentExecutor } from '../types';
import fs from 'fs';
import path from 'path';

const LandingPageAgent: AgentExecutor = {
  execute: async (payload) => {
    try {
      const { projectName, template, metadata } = payload;

      // Generate HTML template
      const html = `
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
      `;

      // File setup
      const filePath = path.resolve(__dirname, `../public/${projectName}.html`);
      fs.writeFileSync(filePath, html);

      return SmartPayloadBuilder.success(`Landing page for ${projectName} generated`, {
        path: filePath,
        preview: `/${projectName}.html`,
      });
    } catch (error) {
      return SmartPayloadBuilder.error('LandingPageAgent Error', error.message);
    }
  },
};

export default LandingPageAgent;
