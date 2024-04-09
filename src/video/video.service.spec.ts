import { Test, TestingModule } from '@nestjs/testing'
import { VideoService } from './video.service'

describe('VideoService', () => {
  let service: VideoService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VideoService],
    }).compile()

    service = module.get<VideoService>(VideoService)
  })

  it('generate success', async () => {
    await service.generateShorts()
  }, 10000)
})
