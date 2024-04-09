import { Controller, Post } from '@nestjs/common'

@Controller('video')
export class VideoController {
  @Post('generate')
  async generateShorts() {}
}
