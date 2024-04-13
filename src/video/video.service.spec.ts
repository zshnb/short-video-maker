import { Test, TestingModule } from '@nestjs/testing'
import { VideoService } from './video.service'
import { describe, beforeEach, it } from 'vitest'

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
  }, 600000)

  it('get all scene time ranges', async () => {
    const sceneTimeRanges = await service.getAllSceneInfo(
      'test_data/test_data_m2',
    )
    console.log(JSON.stringify(sceneTimeRanges, null, 2))
  })
})
