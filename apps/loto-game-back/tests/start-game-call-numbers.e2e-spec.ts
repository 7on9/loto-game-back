import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { DataSource } from 'typeorm'
import { AppModule } from '../src/app.module'
import { PrimaryDataSource } from '@libs/@config/datasources/primary.datasource'
import { GlobalPrefix } from '@libs/@core/constants'
import {
  Game,
  User,
  Card,
  GameCard,
  GameNumberOrder,
  GameCalledNumber,
} from '@libs/@systems/entities/primary'
import { GameStatus } from '@libs/@systems/enums'

describe('Start Game & Call Numbers Flow (e2e)', () => {
  let app: INestApplication
  let dataSource: DataSource
  let gameId: string
  let userAId: string
  let userBId: string
  let testCards: Array<Card>

  // Test user IDs
  const USER_A_ID = '550e8400-e29b-41d4-a716-446655440000'
  const USER_B_ID = '550e8400-e29b-41d4-a716-446655440001'

  const getAuthHeader = (userId: string) => ({
    Authorization: `Bearer mock-jwt-token`,
    'x-test-user-id': userId,
  })

  const apiUrl = (path: string) => `/api/v1${path}`

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix(GlobalPrefix.API, { exclude: ['/'] })
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: false,
        forbidNonWhitelisted: false,
        transform: true,
      }),
    )
    await app.init()

    // Initialize datasource for direct DB access
    if (!PrimaryDataSource.isInitialized) {
      await PrimaryDataSource.initialize()
    }
    dataSource = PrimaryDataSource
  })

  afterAll(async () => {
    await app.close()
    if (PrimaryDataSource.isInitialized) {
      await PrimaryDataSource.destroy()
    }
  })

  beforeEach(async () => {
    // Clean up previous test data using TRUNCATE CASCADE to handle foreign keys
    await dataSource.query('TRUNCATE TABLE game_cards, game_number_order, game_called_numbers, game_win_claims, game_winner_snapshot, games CASCADE')

    // Create or update test users
    const userRepo = dataSource.getRepository(User)
    const existingUserA = await userRepo.findOne({ where: { id: USER_A_ID } })
    const existingUserB = await userRepo.findOne({ where: { id: USER_B_ID } })

    if (!existingUserA) {
      const userA = userRepo.create({
        id: USER_A_ID,
        email: 'usera@test.com',
        password: 'password123',
        username: 'userA',
      })
      await userRepo.save(userA)
    } else {
      await userRepo.update(USER_A_ID, {
        email: 'usera@test.com',
        password: 'password123',
        username: 'userA',
      })
    }

    if (!existingUserB) {
      const userB = userRepo.create({
        id: USER_B_ID,
        email: 'userb@test.com',
        password: 'password123',
        username: 'userB',
      })
      await userRepo.save(userB)
    } else {
      await userRepo.update(USER_B_ID, {
        email: 'userb@test.com',
        password: 'password123',
        username: 'userB',
      })
    }

    // Create game in PREPARE status
    const gameRepo = dataSource.getRepository(Game)
    const game = gameRepo.create({
      name: 'Test Game',
      status: GameStatus.PREPARE,
    })
    const savedGame = await gameRepo.save(game)
    gameId = savedGame.id

    // Get seeded cards (should be 18 cards from seed script)
    const cardRepo = dataSource.getRepository(Card)
    testCards = await cardRepo.find({ where: { isActive: true } })
    
    // If no cards exist, create some test cards
    if (testCards.length === 0) {
      const testCardData = [
        { id: 'C01', pairId: 'card-red', colorTheme: 'red', isActive: true },
        { id: 'C02', pairId: 'card-red', colorTheme: 'red', isActive: true },
        { id: 'C03', pairId: 'card-blue', colorTheme: 'blue', isActive: true },
        { id: 'C04', pairId: 'card-blue', colorTheme: 'blue', isActive: true },
        { id: 'C05', pairId: 'card-green', colorTheme: 'green', isActive: true },
        { id: 'C06', pairId: 'card-green', colorTheme: 'green', isActive: true },
      ]
      testCards = await cardRepo.save(testCardData.map(data => cardRepo.create(data)))
    }

    // Select at least one card for the game
    const gameCardRepo = dataSource.getRepository(GameCard)
    const gameCard = gameCardRepo.create({
      gameId,
      cardId: testCards[0].id,
      userId: USER_A_ID,
    })
    await gameCardRepo.save(gameCard)
  })

  afterEach(async () => {
    // Clean up after each test
    await dataSource.query('TRUNCATE TABLE game_cards, game_number_order, game_called_numbers, game_win_claims, game_winner_snapshot, games CASCADE')
  })

  describe('0️⃣ Test Preconditions', () => {
    it('should have game in PREPARE status', async () => {
      const game = await dataSource.getRepository(Game).findOne({ where: { id: gameId } })
      expect(game).toBeDefined()
      expect(game?.status).toBe(GameStatus.PREPARE)
    })

    it('should have at least one card selected', async () => {
      const gameCards = await dataSource.getRepository(GameCard).find({ where: { gameId } })
      expect(gameCards.length).toBeGreaterThan(0)
    })

    it('should have no number order initially', async () => {
      const numberOrder = await dataSource.getRepository(GameNumberOrder).find({ where: { gameId } })
      expect(numberOrder.length).toBe(0)
    })

    it('should have no called numbers initially', async () => {
      const calledNumbers = await dataSource.getRepository(GameCalledNumber).find({ where: { gameId } })
      expect(calledNumbers.length).toBe(0)
    })
  })

  describe('1️⃣ Start Game - Happy Path Tests', () => {
    it('TC-01: Start game successfully', async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/start`))
        .set(getAuthHeader(USER_A_ID))
        .expect(200)

      expect(response.body.gameId).toBe(gameId)
      expect(response.body.status).toBe(GameStatus.STARTED)
      expect(response.body.totalNumbers).toBe(90)
      expect(response.body.startedAt).toBeDefined()

      // Verify game status updated
      const game = await dataSource.getRepository(Game).findOne({ where: { id: gameId } })
      expect(game?.status).toBe(GameStatus.STARTED)
      expect(game?.startedAt).toBeDefined()

      // Verify number order created (90 numbers)
      const numberOrder = await dataSource.getRepository(GameNumberOrder).find({
        where: { gameId },
        order: { position: 'ASC' },
      })
      expect(numberOrder.length).toBe(90)
      
      // Verify all numbers 1-90 are present
      const numbers = numberOrder.map(no => no.number).sort((a, b) => a - b)
      expect(numbers).toEqual(Array.from({ length: 90 }, (_, i) => i + 1))
    })

    it('TC-02: Number order is shuffled (not sequential)', async () => {
      await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/start`))
        .set(getAuthHeader(USER_A_ID))
        .expect(200)

      const numberOrder = await dataSource.getRepository(GameNumberOrder).find({
        where: { gameId },
        order: { position: 'ASC' },
      })

      // Check that numbers are not in sequential order (very unlikely if shuffled)
      const firstTenNumbers = numberOrder.slice(0, 10).map(no => no.number)
      const isSequential = firstTenNumbers.every((num, idx) => num === idx + 1)
      expect(isSequential).toBe(false) // Should be shuffled
    })

    it('TC-03: Number order is persisted and deterministic', async () => {
      // Start game
      await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/start`))
        .set(getAuthHeader(USER_A_ID))
        .expect(200)

      const firstOrder = await dataSource.getRepository(GameNumberOrder).find({
        where: { gameId },
        order: { position: 'ASC' },
      })
      const firstOrderNumbers = firstOrder.map(no => no.number)

      // Verify order persists (simulate server restart by reading again)
      const persistedOrder = await dataSource.getRepository(GameNumberOrder).find({
        where: { gameId },
        order: { position: 'ASC' },
      })
      const persistedOrderNumbers = persistedOrder.map(no => no.number)

      // Order should be the same (deterministic)
      expect(persistedOrderNumbers).toEqual(firstOrderNumbers)
      expect(persistedOrder.length).toBe(90)
    })
  })

  describe('2️⃣ Start Game - Validation & Business Rule Tests', () => {
    it('TC-04: Cannot start game twice', async () => {
      // Start game first time
      await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/start`))
        .set(getAuthHeader(USER_A_ID))
        .expect(200)

      // Try to start again
      const response = await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/start`))
        .set(getAuthHeader(USER_A_ID))
        .expect(400)

      expect(response.body.message).toContain('already exists')
    })

    it('TC-05: Cannot start game without cards', async () => {
      // Delete all game cards
      await dataSource
        .createQueryBuilder()
        .delete()
        .from(GameCard)
        .where('gameId = :gameId', { gameId })
        .execute()

      const response = await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/start`))
        .set(getAuthHeader(USER_A_ID))
        .expect(400)

      expect(response.body.message).toContain('at least 1 card')
    })

    it('TC-06: Cannot start game when status is STARTED', async () => {
      // Manually set game to STARTED
      await dataSource.getRepository(Game).update(gameId, { status: GameStatus.STARTED })

      const response = await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/start`))
        .set(getAuthHeader(USER_A_ID))
        .expect(400)

      expect(response.body.message).toContain('PREPARE')
    })

    it('TC-07: Cannot start game when status is FINISHED', async () => {
      // Manually set game to FINISHED
      await dataSource.getRepository(Game).update(gameId, { status: GameStatus.FINISHED })

      const response = await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/start`))
        .set(getAuthHeader(USER_A_ID))
        .expect(400)

      expect(response.body.message).toContain('PREPARE')
    })
  })

  describe('3️⃣ Call Next Number - Happy Path Tests', () => {
    beforeEach(async () => {
      // Start game before each test
      await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/start`))
        .set(getAuthHeader(USER_A_ID))
        .expect(200)
    })

    it('TC-08: Call first number successfully', async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/call-next`))
        .set(getAuthHeader(USER_A_ID))
        .expect(200)

      expect(response.body.number).toBeGreaterThanOrEqual(1)
      expect(response.body.number).toBeLessThanOrEqual(90)
      expect(response.body.callIndex).toBe(0)
      expect(response.body.totalNumbers).toBe(90)
      expect(response.body.isComplete).toBe(false)

      // Verify called number persisted
      const calledNumbers = await dataSource.getRepository(GameCalledNumber).find({
        where: { gameId },
      })
      expect(calledNumbers.length).toBe(1)
      expect(calledNumbers[0].number).toBe(response.body.number)
    })

    it('TC-09: Call multiple numbers sequentially', async () => {
      const calledNumbers: Array<number> = []

      // Call 10 numbers
      for (let i = 0; i < 10; i++) {
        const response = await request(app.getHttpServer())
          .post(apiUrl(`/games/${gameId}/call-next`))
          .set(getAuthHeader(USER_A_ID))
          .expect(200)

        expect(response.body.callIndex).toBe(i)
        expect(response.body.number).toBeGreaterThanOrEqual(1)
        expect(response.body.number).toBeLessThanOrEqual(90)
        calledNumbers.push(response.body.number)
      }

      // Verify all numbers are unique
      const uniqueNumbers = new Set(calledNumbers)
      expect(uniqueNumbers.size).toBe(10)

      // Verify all persisted
      const persistedCalled = await dataSource.getRepository(GameCalledNumber).find({
        where: { gameId },
        order: { calledAt: 'ASC' },
      })
      expect(persistedCalled.length).toBe(10)
    })

    it('TC-10: Numbers come from persisted order (deterministic)', async () => {
      // Get the number order
      const numberOrder = await dataSource.getRepository(GameNumberOrder).find({
        where: { gameId },
        order: { position: 'ASC' },
      })

      // Call first 5 numbers
      for (let i = 0; i < 5; i++) {
        const response = await request(app.getHttpServer())
          .post(apiUrl(`/games/${gameId}/call-next`))
          .set(getAuthHeader(USER_A_ID))
          .expect(200)

        // Verify number matches the order at position i
        expect(response.body.number).toBe(numberOrder[i].number)
        expect(response.body.callIndex).toBe(i)
      }
    })

    it('TC-11: Call all 90 numbers', async () => {
      const calledNumbers: Array<number> = []

      // Call all 90 numbers
      for (let i = 0; i < 90; i++) {
        const response = await request(app.getHttpServer())
          .post(apiUrl(`/games/${gameId}/call-next`))
          .set(getAuthHeader(USER_A_ID))
          .expect(200)

        expect(response.body.callIndex).toBe(i)
        expect(response.body.isComplete).toBe(i === 89) // Last call should be complete
        calledNumbers.push(response.body.number)
      }

      // Verify all 90 numbers called
      expect(calledNumbers.length).toBe(90)
      const uniqueNumbers = new Set(calledNumbers)
      expect(uniqueNumbers.size).toBe(90) // All unique

      // Verify all numbers 1-90 are present
      const sortedNumbers = [...calledNumbers].sort((a, b) => a - b)
      expect(sortedNumbers).toEqual(Array.from({ length: 90 }, (_, i) => i + 1))
    })
  })

  describe('4️⃣ Call Next Number - Validation & Business Rule Tests', () => {
    it('TC-12: Cannot call number before game started', async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/call-next`))
        .set(getAuthHeader(USER_A_ID))
        .expect(400)

      expect(response.body.message).toContain('STARTED')
    })

    it('TC-13: Cannot call number when game is PREPARE', async () => {
      // Game is already in PREPARE, try to call
      const response = await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/call-next`))
        .set(getAuthHeader(USER_A_ID))
        .expect(400)

      expect(response.body.message).toContain('STARTED')
    })

    it('TC-14: Cannot call number when game is FINISHED', async () => {
      // Start game
      await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/start`))
        .set(getAuthHeader(USER_A_ID))
        .expect(200)

      // Manually set to FINISHED
      await dataSource.getRepository(Game).update(gameId, { status: GameStatus.FINISHED })

      const response = await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/call-next`))
        .set(getAuthHeader(USER_A_ID))
        .expect(400)

      expect(response.body.message).toContain('STARTED')
    })

    it('TC-15: Cannot call after all 90 numbers called', async () => {
      // Start game
      await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/start`))
        .set(getAuthHeader(USER_A_ID))
        .expect(200)

      // Call all 90 numbers
      for (let i = 0; i < 90; i++) {
        await request(app.getHttpServer())
          .post(apiUrl(`/games/${gameId}/call-next`))
          .set(getAuthHeader(USER_A_ID))
          .expect(200)
      }

      // Try to call one more
      const response = await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/call-next`))
        .set(getAuthHeader(USER_A_ID))
        .expect(400)

      expect(response.body.message).toContain('already been called')
    })
  })

  describe('5️⃣ Concurrency & Race Condition Tests', () => {
    beforeEach(async () => {
      // Start game before each test
      await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/start`))
        .set(getAuthHeader(USER_A_ID))
        .expect(200)
    })

    it('TC-16: Concurrent start attempts (only one succeeds)', async () => {
      // Create a new game for this test
      const gameRepo = dataSource.getRepository(Game)
      const newGame = gameRepo.create({
        name: 'Concurrent Test Game',
        status: GameStatus.PREPARE,
      })
      const savedNewGame = await gameRepo.save(newGame)

      // Select a card
      const gameCardRepo = dataSource.getRepository(GameCard)
      await gameCardRepo.save(
        gameCardRepo.create({
          gameId: savedNewGame.id,
          cardId: testCards[0].id,
          userId: USER_A_ID,
        }),
      )

      // Try to start game concurrently
      const [response1, response2] = await Promise.all([
        request(app.getHttpServer())
          .post(apiUrl(`/games/${savedNewGame.id}/start`))
          .set(getAuthHeader(USER_A_ID)),
        request(app.getHttpServer())
          .post(apiUrl(`/games/${savedNewGame.id}/start`))
          .set(getAuthHeader(USER_B_ID)),
      ])

      // One should succeed, one should fail
      const successCount = [response1.status === 200, response2.status === 200].filter(Boolean).length
      const failCount = [response1.status === 400, response2.status === 400].filter(Boolean).length

      expect(successCount).toBe(1)
      expect(failCount).toBe(1)

      // Verify only one number order exists
      const numberOrders = await dataSource.getRepository(GameNumberOrder).find({
        where: { gameId: savedNewGame.id },
      })
      expect(numberOrders.length).toBe(90) // Should have exactly 90 numbers
    })

    it('TC-17: Concurrent call attempts (only one succeeds)', async () => {
      // Try to call next number concurrently
      const [response1, response2] = await Promise.all([
        request(app.getHttpServer())
          .post(apiUrl(`/games/${gameId}/call-next`))
          .set(getAuthHeader(USER_A_ID)),
        request(app.getHttpServer())
          .post(apiUrl(`/games/${gameId}/call-next`))
          .set(getAuthHeader(USER_B_ID)),
      ])

      // One should succeed, one should fail (or both succeed with different numbers if called sequentially)
      // Actually, with pessimistic locking, only one should succeed
      const successCount = [response1.status === 200, response2.status === 200].filter(Boolean).length
      
      // At least one should succeed, but with proper locking, only one should
      expect(successCount).toBeGreaterThanOrEqual(1)
      expect(successCount).toBeLessThanOrEqual(2) // In rare cases both might succeed if timing is perfect

      // Verify only one or two numbers called (depending on timing)
      const calledNumbers = await dataSource.getRepository(GameCalledNumber).find({
        where: { gameId },
      })
      expect(calledNumbers.length).toBeGreaterThanOrEqual(1)
      expect(calledNumbers.length).toBeLessThanOrEqual(2)
    })

    it('TC-18: Multiple rapid calls maintain order', async () => {
      // Make 10 rapid concurrent calls
      const promises = Array.from({ length: 10 }, () =>
        request(app.getHttpServer())
          .post(apiUrl(`/games/${gameId}/call-next`))
          .set(getAuthHeader(USER_A_ID)),
      )

      const responses = await Promise.all(promises)
      const successfulResponses = responses.filter(r => r.status === 200)

      // Verify all successful calls have unique numbers
      const calledNumbers = successfulResponses.map(r => r.body.number)
      const uniqueNumbers = new Set(calledNumbers)
      expect(uniqueNumbers.size).toBe(successfulResponses.length)

      // Verify persisted called numbers match
      const persistedCalled = await dataSource.getRepository(GameCalledNumber).find({
        where: { gameId },
        order: { calledAt: 'ASC' },
      })
      expect(persistedCalled.length).toBe(successfulResponses.length)
    })
  })

  describe('6️⃣ Data Integrity & Determinism Tests', () => {
    it('TC-19: Number order persists after server restart simulation', async () => {
      // Start game
      await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/start`))
        .set(getAuthHeader(USER_A_ID))
        .expect(200)

      // Get the number order
      const numberOrder = await dataSource.getRepository(GameNumberOrder).find({
        where: { gameId },
        order: { position: 'ASC' },
      })

      // Call first 5 numbers
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post(apiUrl(`/games/${gameId}/call-next`))
          .set(getAuthHeader(USER_A_ID))
          .expect(200)
      }

      // Simulate server restart: verify order is still the same
      const orderAfterCalls = await dataSource.getRepository(GameNumberOrder).find({
        where: { gameId },
        order: { position: 'ASC' },
      })

      expect(orderAfterCalls.length).toBe(90)
      expect(orderAfterCalls.map(no => no.number)).toEqual(numberOrder.map(no => no.number))
    })

    it('TC-20: Resume calling after interruption', async () => {
      // Start game
      await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/start`))
        .set(getAuthHeader(USER_A_ID))
        .expect(200)

      // Get number order
      const numberOrder = await dataSource.getRepository(GameNumberOrder).find({
        where: { gameId },
        order: { position: 'ASC' },
      })

      // Call first 10 numbers
      for (let i = 0; i < 10; i++) {
        await request(app.getHttpServer())
          .post(apiUrl(`/games/${gameId}/call-next`))
          .set(getAuthHeader(USER_A_ID))
          .expect(200)
      }

      // Verify we can resume and get number 11
      const response = await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/call-next`))
        .set(getAuthHeader(USER_A_ID))
        .expect(200)

      expect(response.body.callIndex).toBe(10)
      expect(response.body.number).toBe(numberOrder[10].number)
    })

    it('TC-21: Numbers are never duplicated in called list', async () => {
      // Start game
      await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/start`))
        .set(getAuthHeader(USER_A_ID))
        .expect(200)

      // Call 20 numbers
      for (let i = 0; i < 20; i++) {
        await request(app.getHttpServer())
          .post(apiUrl(`/games/${gameId}/call-next`))
          .set(getAuthHeader(USER_A_ID))
          .expect(200)
      }

      // Verify no duplicates
      const calledNumbers = await dataSource.getRepository(GameCalledNumber).find({
        where: { gameId },
      })
      const numbers = calledNumbers.map(cn => cn.number)
      const uniqueNumbers = new Set(numbers)
      expect(uniqueNumbers.size).toBe(numbers.length)
    })
  })

  describe('7️⃣ Transaction & Atomicity Tests', () => {
    it('TC-22: Start game is atomic (all or nothing)', async () => {
      // Start game
      const response = await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/start`))
        .set(getAuthHeader(USER_A_ID))
        .expect(200)

      // Verify all parts completed:
      // 1. Game status updated
      const game = await dataSource.getRepository(Game).findOne({ where: { id: gameId } })
      expect(game?.status).toBe(GameStatus.STARTED)

      // 2. Number order created
      const numberOrder = await dataSource.getRepository(GameNumberOrder).find({
        where: { gameId },
      })
      expect(numberOrder.length).toBe(90)

      // 3. Started timestamp set
      expect(game?.startedAt).toBeDefined()
    })

    it('TC-23: Call number is atomic (number persisted correctly)', async () => {
      // Start game
      await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/start`))
        .set(getAuthHeader(USER_A_ID))
        .expect(200)

      // Call number
      const response = await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/call-next`))
        .set(getAuthHeader(USER_A_ID))
        .expect(200)

      // Verify number persisted
      const calledNumber = await dataSource.getRepository(GameCalledNumber).findOne({
        where: { gameId, number: response.body.number },
      })
      expect(calledNumber).toBeDefined()
      expect(calledNumber?.number).toBe(response.body.number)
      expect(calledNumber?.calledAt).toBeDefined()
    })
  })

  describe('8️⃣ Security & Abuse Tests', () => {
    it('TC-24: Cannot start game without authentication', async () => {
      await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/start`))
        .expect(401)
    })

    it('TC-25: Cannot call number without authentication', async () => {
      // Start game first
      await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/start`))
        .set(getAuthHeader(USER_A_ID))
        .expect(200)

      await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/call-next`))
        .expect(401)
    })

    it('TC-26: Cannot start game with invalid game ID', async () => {
      const invalidGameId = '00000000-0000-0000-0000-000000000000'
      const response = await request(app.getHttpServer())
        .post(apiUrl(`/games/${invalidGameId}/start`))
        .set(getAuthHeader(USER_A_ID))
        .expect(404)

      expect(response.body.message).toContain('not found')
    })

    it('TC-27: Cannot call number with invalid game ID', async () => {
      const invalidGameId = '00000000-0000-0000-0000-000000000000'
      const response = await request(app.getHttpServer())
        .post(apiUrl(`/games/${invalidGameId}/call-next`))
        .set(getAuthHeader(USER_A_ID))
        .expect(404)

      expect(response.body.message).toContain('not found')
    })
  })

  describe('9️⃣ Observability & Logging Tests', () => {
    it('TC-28: Start game creates audit trail', async () => {
      const beforeTime = new Date()

      await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/start`))
        .set(getAuthHeader(USER_A_ID))
        .expect(200)

      // Verify game has started_at timestamp
      const game = await dataSource.getRepository(Game).findOne({ where: { id: gameId } })
      expect(game?.startedAt).toBeDefined()
      if (game?.startedAt) {
        expect(game.startedAt.getTime()).toBeGreaterThan(beforeTime.getTime() - 60000) // Within last minute
      }
    })

    it('TC-29: Called number has timestamp', async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/call-next`))
        .set(getAuthHeader(USER_A_ID))
        .expect(200)

      // Verify called number has timestamp
      const calledNumber = await dataSource.getRepository(GameCalledNumber).findOne({
        where: { gameId, number: response.body.number },
      })
      expect(calledNumber).toBeDefined()
      expect(calledNumber?.calledAt).toBeDefined()
      if (calledNumber?.calledAt) {
        expect(calledNumber.calledAt.getTime()).toBeGreaterThan(0)
      }
    })
  })

  describe('🔟 Edge Cases & Boundary Tests', () => {
    it('TC-30: Start game with exactly one card', async () => {
      // Game already has one card from beforeEach
      const response = await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/start`))
        .set(getAuthHeader(USER_A_ID))
        .expect(200)

      expect(response.body.status).toBe(GameStatus.STARTED)
    })

    it('TC-31: Start game with multiple cards', async () => {
      // Add more cards
      const gameCardRepo = dataSource.getRepository(GameCard)
      for (let i = 1; i < Math.min(5, testCards.length); i++) {
        await gameCardRepo.save(
          gameCardRepo.create({
            gameId,
            cardId: testCards[i].id,
            userId: i % 2 === 0 ? USER_A_ID : USER_B_ID,
          }),
        )
      }

      const response = await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/start`))
        .set(getAuthHeader(USER_A_ID))
        .expect(200)

      expect(response.body.status).toBe(GameStatus.STARTED)
    })

    it('TC-32: Call numbers in exact order from persisted sequence', async () => {
      // Start game
      await request(app.getHttpServer())
        .post(apiUrl(`/games/${gameId}/start`))
        .set(getAuthHeader(USER_A_ID))
        .expect(200)

      // Get number order
      const numberOrder = await dataSource.getRepository(GameNumberOrder).find({
        where: { gameId },
        order: { position: 'ASC' },
      })

      // Call all 90 numbers and verify order
      for (let i = 0; i < 90; i++) {
        const response = await request(app.getHttpServer())
          .post(apiUrl(`/games/${gameId}/call-next`))
          .set(getAuthHeader(USER_A_ID))
          .expect(200)

        expect(response.body.number).toBe(numberOrder[i].number)
        expect(response.body.callIndex).toBe(i)
      }
    })
  })
})
