declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Database
      DB_PRIMARY_HOST?: string
      DB_PRIMARY_PORT?: string
      DB_PRIMARY_USERNAME?: string
      DB_PRIMARY_PASSWORD?: string
      DB_PRIMARY_DATABASE?: string
      DB_PRIMARY_SYNCHRONIZE?: string
      DB_PRIMARY_SSL?: string
      DB_PRIMARY_SSL_REJECT_UNAUTHORIZED?: string

      // JWT
      JWT_SECRET?: string
      JWT_EXPIRY?: string
      JWT_REFRESH_TOKEN_SECRET?: string
      JWT_REFRESH_TOKEN_EXPIRY?: string

      // App
      PORT?: string
      APP_NAME?: string

      // Swagger
      SWAGGER_TITLE?: string
      SWAGGER_DESCRIPTION?: string
      SWAGGER_VERSION?: string

      // Logging
      LOG_LEVEL?: string
      LOG_OUTPUT?: string
      LOG_FILE_PATH?: string
      LOG_FILE_MAX_SIZE?: string
      LOG_FILE_MAX_FILES?: string
      LOG_REDIS_KEY?: string
      LOG_SHOW_CONTEXT?: string

      // Other
      DISPLAY_TIMEZONE?: string
      TZ?: string
    }
  }
}

export {}





