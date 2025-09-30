import SmartPayloadBuilder from '../utils';
import { AgentExecutor } from '../types';
import fs from 'fs';
import path from 'path';

const inferDescription = (code: string): string => {
  if (/fetch|axios|http/.test(code)) return 'This code performs an HTTP request.';
  if (/map|filter|reduce/.test(code)) return 'This code processes an array using functional methods.';
  if (/connect|query|db/.test(code)) return 'This code interacts with a database.';
  return 'Description could not be inferred automatically.';
};

const CodeDocumentationAgent: AgentExecutor = {
  execute: async (payload) => {
    try {
      const { code, language, fileName } = payload;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      if (!code || !language || !fileName) {
        return SmartPayloadBuilder.error('CodeDocumentationAgent Error', 'Missing required parameters: code, language, and fileName.');
      }

      const description = inferDescription(code);
      const markdown = `
# Code Documentation for ${fileName}

## Language: ${language}

### Timestamp
${timestamp}

### Code Snippet
\`\`\`${language}
${code}
\`\`\`

### Description
${description}

### Usage
(Explain how to use the code here.)

### Agent Metadata
- Executor: CodeDocumentationAgent
- Runtime ID: docgen_${fileName}_${timestamp}
- Scroll Ref: scroll_docgen_${fileName}
`;

      const publicDir = path.resolve(__dirname, '../public');
      if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

      const filePath = path.join(publicDir, `${fileName}_${timestamp}.md`);
      fs.writeFileSync(filePath, markdown);

      const logEntry = `${timestamp} - Documented ${fileName} (${language}) → ${filePath}\n`;
      fs.appendFileSync(path.resolve(__dirname, '../logs/runtime.log'), logEntry);

      return SmartPayloadBuilder.success(`Documentation for ${fileName} generated`, {
        path: filePath,
        preview: `/${fileName}_${timestamp}.md`,
        runtime_id: `docgen_${fileName}_${timestamp}`,
      });
    } catch (error) {
      return SmartPayloadBuilder.error('CodeDocumentationAgent Error', error.message);
    }
  },
};

export default CodeDocumentationAgent;
