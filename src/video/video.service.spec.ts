import { Test, TestingModule } from '@nestjs/testing'
import { VideoService } from './video.service'
import { describe, beforeEach, it } from 'vitest'
import { Composition } from './composition'

describe('VideoService', () => {
  let service: VideoService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoService,
        {
          provide: Composition,
          useValue: new Composition(),
        },
      ],
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
