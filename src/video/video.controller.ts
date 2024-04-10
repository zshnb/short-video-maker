import { Controller, Post } from '@nestjs/common'
import { VideoService } from './video.service'

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}
  @Post('generate')
  async generateShorts() {
    await this.videoService.generateShorts()
    return {
      data: 'ok',
    }
  }
}
