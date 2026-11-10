import { Injectable, Scope, LoggerService } from "@nestjs/common";
import * as winston from "winston";
import { OpenTelemetryTransportV3 } from "@opentelemetry/winston-transport";

const level = process.env.LOG_LEVEL || "info";

const winstonInstance = winston.createLogger({
  level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context, stack }) => {
          const ctx = context ? ` [${context}]` : "";
          return `${timestamp} ${level}${ctx}: ${message}${stack ? `\n${stack}` : ""}`;
        }),
      ),
    }),
    new OpenTelemetryTransportV3({ level }),
  ],
});

@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService implements LoggerService {
  private context?: string;

  setContext(context: string) {
    this.context = context;
  }

  private format(message: any): string {
    return typeof message === "string" ? message : JSON.stringify(message);
  }

  log(message: any, context?: string) {
    winstonInstance.info(this.format(message), { context: context || this.context });
  }

  error(message: any, stack?: string, context?: string) {
    winstonInstance.error(message, { 
      stack, 
      context: context || this.context 
    });
  }

  warn(message: any, context?: string) {
    winstonInstance.warn(this.format(message), { context: context || this.context });
  }

  debug(message: any, context?: string) {
    winstonInstance.debug(this.format(message), { context: context || this.context });
  }

  verbose(message: any, context?: string) {
    winstonInstance.verbose(this.format(message), { context: context || this.context });
  }
}
