import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { TokenController } from 'src/controller/token.controller'
import InternalMiddleware from 'src/middleware/internal.middleware'
import { TokenService } from 'src/service/token.service'
import { EntityManager } from 'typeorm'

@Module({
    imports: [  ],
    controllers: [ TokenController ],
    providers: [ TokenService, EntityManager ],
})

export class TokenModule implements NestModule {
    configure(_consumer: MiddlewareConsumer) {
        _consumer
            .apply(InternalMiddleware)
            .exclude({ path: 'v0/session', method: RequestMethod.POST })
            .forRoutes(TokenController)
    }
}
  