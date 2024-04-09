import { PrismaClient } from '@prisma/client'

export class PrismaCleaner {
  private prisma: PrismaClient
  private modelNames: string[]

  constructor(prisma = new PrismaClient()) {
    this.prisma = prisma
    const propertyNames = Object.getOwnPropertyNames(prisma)
    this.modelNames = propertyNames.filter((name) => this.isModelName(name))
  }

  async clean() {
    console.log(`Database cleaning...`)
    return Promise.all(
      this.modelNames.map((modelName) => this.prisma[modelName].deleteMany()),
    )
  }

  private isModelName(name: string): boolean {
    return !name.match(/^(_|\$)/)
  }
}
