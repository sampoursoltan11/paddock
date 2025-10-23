import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

// Create Winston logger
export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'smartproof-backend',
    environment: process.env.ENVIRONMENT || 'development',
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Add correlation ID to logs
export function logWithCorrelation(level: string, message: string, correlationId?: string, meta?: any) {
  logger.log(level, message, {
    correlationId,
    ...meta,
  });
}

export default logger;
