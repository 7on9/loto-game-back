import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { QueryFailedError, TypeORMError } from 'typeorm'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()
      message = typeof exceptionResponse === 'string' ? exceptionResponse : (exceptionResponse as any).message
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST
      message = 'Database query failed'
    } else if (exception instanceof TypeORMError) {
      status = HttpStatus.BAD_REQUEST
      message = 'Database error'
    }

    const errorResponse = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    }

    this.logger.error(
      `${request.method} ${request.url}`,
      {
        statusCode: status,
        message,
        stack: exception.stack,
      },
      'ExceptionFilter',
    )

    response.status(status).json(errorResponse)
  }
}





