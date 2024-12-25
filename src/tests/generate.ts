import { faker } from '@faker-js/faker'
import { Client } from '../validation'

export function generateClients(num: number): Client[] {
  return Array(num)
    .fill(0)
    .map(() => {
      return {
        clientId: faker.string.uuid(),
        clientName: faker.company.name(),
        email: faker.internet.email(),
        createdAt: faker.date.recent().toISOString(),
        updatedAt: faker.date.recent().toISOString(),
        userId: faker.string.uuid(),
        currencyPreference: faker.finance.currencyCode(),
        address: faker.location.streetAddress(),
        phone: faker.phone.number(),
        VATNumber: faker.string.uuid()
      }
    })
}
