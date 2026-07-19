const isProduction = process.env.NODE_ENV === 'production';

type LogLevel = 'info' | 'warn' | 'error';

function log(level: LogLevel, message: string, context?: unknown) {
  if (isProduction && level !== 'error') {
    return;
  }

  const payload = context ? [message, context] : [message];
  if (level === 'warn') {
    console.warn(...payload);
    return;
  }

  if (level === 'error') {
    console.error(...payload);
    return;
  }

  console.info(...payload);
}

export const logger = {
  info: (message: string, context?: unknown) => log('info', message, context),
  warn: (message: string, context?: unknown) => log('warn', message, context),
  error: (message: string, context?: unknown) => log('error', message, context),
};
