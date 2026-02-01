import * as fs from 'fs'
import * as path from 'path'
import { PrimaryDataSource } from '@libs/@config/datasources/primary.datasource'
import { Card } from '@libs/@systems/entities/primary'
import { CardLayout } from '@libs/@systems/entities/primary'

interface ParsedCardFile {
  filename: string
  colorTheme: string
  cardNumber: number
  data: Array<Array<string | number>>
}

async function scanCardFiles(directory: string): Promise<Array<string>> {
  const files = fs.readdirSync(directory)
  return files
    .filter(file => file.endsWith('.csv'))
    .map(file => path.join(directory, file))
    .sort()
}

function parseFilename(filename: string): { colorTheme: string; cardNumber: number } {
  // Extract filename without path and extension
  const basename = path.basename(filename, '.csv')
  // Expected format: card-{color}-{number}
  // e.g., card-pink-1.csv -> color: pink, number: 1
  const match = basename.match(/^card-([^-]+)-(\d+)$/)
  
  if (!match) {
    throw new Error(`Invalid filename format: ${filename}. Expected format: card-{color}-{number}.csv`)
  }

  return {
    colorTheme: match[1],
    cardNumber: parseInt(match[2], 10),
  }
}

function parseCSV(filePath: string): Array<Array<string | number>> {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.trim().split('\n')
  
  return lines.map(line => {
    return line.split(',').map(cell => {
      const trimmed = cell.trim()
      if (trimmed === 'x' || trimmed === 'X' || trimmed === '') {
        return 'x'
      }
      const num = parseInt(trimmed, 10)
      if (isNaN(num)) {
        throw new Error(`Invalid number in CSV: ${trimmed} at ${filePath}`)
      }
      return num
    })
  })
}

function generateCardId(index: number): string {
  // Generate C01, C02, C03, etc.
  return `C${String(index + 1).padStart(2, '0')}`
}

function generatePairId(colorTheme: string): string {
  // Pair ID is based on color theme: card-{color}
  return `card-${colorTheme}`
}

async function seedCards() {
  console.log('🚀 Starting card seeding process...')

  // Initialize datasource
  if (!PrimaryDataSource.isInitialized) {
    await PrimaryDataSource.initialize()
    console.log('✅ Database connection initialized')
  }

  // Resolve path relative to project root
  // Works both from source (src/scripts) and compiled (dist/apps/loto-game-back/src/scripts)
  // Try multiple possible locations
  let cardsDirectory = path.join(__dirname, '../../assets/data/cards')
  if (!fs.existsSync(cardsDirectory)) {
    // Try from project root (for compiled code)
    const projectRoot = process.cwd()
    cardsDirectory = path.join(projectRoot, 'apps/loto-game-back/assets/data/cards')
  }
  
  if (!fs.existsSync(cardsDirectory)) {
    throw new Error(`Cards directory not found: ${cardsDirectory}`)
  }

  // Scan all CSV files
  const csvFiles = await scanCardFiles(cardsDirectory)
  console.log(`📁 Found ${csvFiles.length} CSV files`)

  if (csvFiles.length === 0) {
    console.log('⚠️  No CSV files found. Exiting.')
    return
  }

  // Parse all files
  const parsedCards: Array<ParsedCardFile> = []
  for (const filePath of csvFiles) {
    const { colorTheme, cardNumber } = parseFilename(filePath)
    const data = parseCSV(filePath)
    parsedCards.push({
      filename: path.basename(filePath),
      colorTheme,
      cardNumber,
      data,
    })
    console.log(`📄 Parsed: ${path.basename(filePath)} (color: ${colorTheme}, number: ${cardNumber})`)
  }

  // Sort by color theme and card number for consistent ID generation
  parsedCards.sort((a, b) => {
    if (a.colorTheme !== b.colorTheme) {
      return a.colorTheme.localeCompare(b.colorTheme)
    }
    return a.cardNumber - b.cardNumber
  })

  // Get repository
  const cardRepository = PrimaryDataSource.getRepository(Card)
  const cardLayoutRepository = PrimaryDataSource.getRepository(CardLayout)

  // Start transaction
  const queryRunner = PrimaryDataSource.createQueryRunner()
  await queryRunner.connect()
  await queryRunner.startTransaction()

  try {
    let cardIndex = 0

    for (const parsedCard of parsedCards) {
      const cardId = generateCardId(cardIndex)
      const pairId = generatePairId(parsedCard.colorTheme)

      // Check if card already exists
      const existingCard = await queryRunner.manager.findOne(Card, {
        where: { id: cardId },
      })

      if (existingCard) {
        // Update existing card
        existingCard.pairId = pairId
        existingCard.colorTheme = parsedCard.colorTheme
        existingCard.isActive = true
        await queryRunner.manager.save(existingCard)
        console.log(`🔄 Updated card: ${cardId} (pair: ${pairId}, color: ${parsedCard.colorTheme})`)

        // Delete existing layouts
        await queryRunner.manager.delete(CardLayout, { cardId })
        console.log(`   🗑️  Deleted existing layouts`)
      } else {
        // Create new card
        const card = cardRepository.create({
          id: cardId,
          pairId,
          colorTheme: parsedCard.colorTheme,
          isActive: true,
        })

        await queryRunner.manager.save(card)
        console.log(`✅ Created card: ${cardId} (pair: ${pairId}, color: ${parsedCard.colorTheme})`)
      }

      // Create/update card layouts
      const layouts: Array<CardLayout> = []
      for (let rowIdx = 0; rowIdx < parsedCard.data.length; rowIdx++) {
        const row = parsedCard.data[rowIdx]
        for (let colIdx = 0; colIdx < row.length; colIdx++) {
          const cell = row[colIdx]
          if (cell !== 'x' && typeof cell === 'number') {
            const layout = cardLayoutRepository.create({
              cardId,
              rowIdx,
              colIdx,
              number: cell,
            })
            layouts.push(layout)
          }
        }
      }

      if (layouts.length > 0) {
        await queryRunner.manager.save(CardLayout, layouts)
        console.log(`   📋 Created ${layouts.length} layout positions`)
      }

      cardIndex++
    }

    // Commit transaction
    await queryRunner.commitTransaction()
    console.log('✅ All cards seeded successfully!')
  } catch (error) {
    // Rollback on error
    await queryRunner.rollbackTransaction()
    console.error('❌ Error seeding cards:', error)
    throw error
  } finally {
    // Release query runner
    await queryRunner.release()
    await PrimaryDataSource.destroy()
    console.log('🔌 Database connection closed')
  }
}

// Run the seed function
seedCards()
  .then(() => {
    console.log('🎉 Seeding completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error)
    process.exit(1)
  })
