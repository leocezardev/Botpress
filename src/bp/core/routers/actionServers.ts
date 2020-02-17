import { Logger } from 'botpress/sdk'
import { ConfigProvider } from 'core/config/config-loader'
import AuthService, { TOKEN_AUDIENCE } from 'core/services/auth/auth-service'
import { RequestHandler, Router } from 'express'

import { CustomRouter } from './customRouter'
import { checkTokenHeader } from './util'

export class ActionServersRouter extends CustomRouter {
  private checkTokenHeader!: RequestHandler

  constructor(logger: Logger, private authService: AuthService, private configProvider: ConfigProvider) {
    super('ActionServers', logger, Router())
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
    this.setupRoutes()
  }

  private setupRoutes(): void {
    this.router.get(
      '/',
      this.checkTokenHeader,
      this.asyncMiddleware(async (_req, res, _next) => {
        const config = await this.configProvider.getBotpressConfig()
        res.send(config.actionServers)
      })
    )
  }
}
