import fs from 'fs';
import path from 'path';

interface LogEntry {
  timestamp: string;
  requestId?: string;
  [key: string]: unknown;
}

const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), 'logs', 'api');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const accessLogStream = fs.createWriteStream(
  path.join(LOG_DIR, 'access.log'),
  { flags: 'a' }
);
const errorLogStream = fs.createWriteStream(
  path.join(LOG_DIR, 'error.log'),
  { flags: 'a' }
);
const auditLogStream = fs.createWriteStream(
  path.join(LOG_DIR, 'audit.log'),
  { flags: 'a' }
);

function writeLog(stream: fs.WriteStream, entry: LogEntry): void {
  const line = JSON.stringify(entry) + '\n';
  stream.write(line);
  if (process.env.NODE_ENV !== 'production') {
    console.log(line);
  }
}

export const logger = {
  access(entry: Omit<LogEntry, 'timestamp'>): void {
    writeLog(accessLogStream, {
      timestamp: new Date().toISOString(),
      ...entry
    });
  },

  error(entry: Omit<LogEntry, 'timestamp'>): void {
    writeLog(errorLogStream, {
      timestamp: new Date().toISOString(),
      ...entry
    });
  },

  audit(entry: Omit<LogEntry, 'timestamp'>): void {
    writeLog(auditLogStream, {
      timestamp: new Date().toISOString(),
      ...entry
    });
  },

  warn(entry: Omit<LogEntry, 'timestamp'>): void {
    writeLog(errorLogStream, {
      timestamp: new Date().toISOString(),
      level: 'warn',
      ...entry
    });
  },

  info(entry: Omit<LogEntry, 'timestamp'>): void {
    writeLog(accessLogStream, {
      timestamp: new Date().toISOString(),
      level: 'info',
      ...entry
    });
  }
};
