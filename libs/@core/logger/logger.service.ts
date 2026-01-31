import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class LoggerService extends Logger {
  static withTopic(topic: string): LoggerService {
    const logger = new LoggerService(topic)
    return logger
  }

  debug(message: string, meta?: any) {
    super.debug(message, JSON.stringify(meta))
  }

  log(message: string, meta?: any) {
    super.log(message, JSON.stringify(meta))
  }

  warn(message: string, meta?: any) {
    super.warn(message, JSON.stringify(meta))
  }

  error(message: string, error?: any) {
    super.error(message, error?.message || JSON.stringify(error))
  }
}





