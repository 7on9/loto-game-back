import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { QueryFailedError, TypeORMError } from 'typeorm'

@Catch(TypeORMError)
export class TypeOrmFilter implements ExceptionFilter {
  private readonly logger = new Logger(TypeOrmFilter.name)

  catch(exception: TypeORMError, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let message = 'Database error'
    if (exception instanceof QueryFailedError) {
      message = 'Database query failed'
    }

    this.logger.error(
      `${request.method} ${request.url}`,
      exception.stack,
      'TypeOrmFilter',
    )

    response.status(400).json({
      statusCode: 400,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }
}





