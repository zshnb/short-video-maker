import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import { ClsModule } from 'nestjs-cls'

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`config/.env.${process.env.NODE_ENV}`],
      isGlobal: true,
    }),
    ClsModule.forRoot({
      middleware: {
        mount: true,
        setup: (cls, req) => {
          cls.set('userId', req.headers['x-user-id'])
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
