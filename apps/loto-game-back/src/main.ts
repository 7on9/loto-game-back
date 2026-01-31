import 'reflect-metadata'
import * as dotenv from 'dotenv'
dotenv.config()
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { GlobalPrefix } from '@libs/@core/constants'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { configEnv } from '@libs/@config/env'
import { LoggerService } from '@libs/@core/logger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  //#region Common config
  app.enableCors({
    origin: '*',
  })
  app.setGlobalPrefix(GlobalPrefix.API, { exclude: ['/'] })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  )

  // Swagger setup
  const { SWAGGER_TITLE, SWAGGER_DESCRIPTION, SWAGGER_VERSION } = configEnv()
  const options = new DocumentBuilder()
    .setTitle(SWAGGER_TITLE ?? 'API')
    .setDescription(SWAGGER_DESCRIPTION ?? 'API')
    .setVersion(SWAGGER_VERSION ?? '1.0')
    .addSecurity('bearer', {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
    .build()

  const document = SwaggerModule.createDocument(app, options)
  SwaggerModule.setup('swagger', app, document)
  //#endregion

  const logger = LoggerService.withTopic('MAIN_APP')
  const port = process.env.PORT ?? 3000
  logger.log(`Server started on port ${port}`, {
    port,
    urls: {
      app: `http://localhost:${port}`,
      swagger: `http://localhost:${port}/swagger`,
      swaggerJson: `http://localhost:${port}/swagger-json`,
    },
    timezone: process.env.TZ,
  })

  await app.listen(process.env.PORT ?? 3000)
}

bootstrap()
