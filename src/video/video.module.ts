import { Module } from '@nestjs/common'
import { VideoController } from './video.controller'
import { VideoService } from './video.service'
import { Composition } from './composition'

@Module({
  controllers: [VideoController],
  providers: [VideoService, Composition],
})
export class VideoModule {}
