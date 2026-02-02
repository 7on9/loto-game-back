import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User } from '@libs/@systems/entities/primary'
import { RegisterDto, LoginDto } from '@libs/@systems/dtos'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ user: Omit<User, 'password'>; accessToken: string }> {
    // Check if user already exists by email
    const existingUserByEmail = await this.userRepository.findOne({
      where: { email: registerDto.email },
    })

    if (existingUserByEmail) {
      throw new ConflictException('Email already registered')
    }

    // Check if username already exists
    const existingUserByUsername = await this.userRepository.findOne({
      where: { username: registerDto.username },
    })

    if (existingUserByUsername) {
      throw new ConflictException('Username already taken')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10)

    // Create user
    const user = this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      username: registerDto.username,
      avatar: registerDto.avatar,
    })

    const savedUser = await this.userRepository.save(user)

    // Generate JWT token
    const accessToken = this.generateToken(savedUser)

    // Remove password from response
    const { password, ...userWithoutPassword } = savedUser

    return {
      user: userWithoutPassword,
      accessToken,
    }
  }

  async login(loginDto: LoginDto): Promise<{ user: Omit<User, 'password'>; accessToken: string }> {
    // Find user
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    })

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password)

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    // Generate JWT token
    const accessToken = this.generateToken(user)

    // Remove password from response
    const { password, ...userWithoutPassword } = user

    return {
      user: userWithoutPassword,
      accessToken,
    }
  }

  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
    })
  }

  private generateToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    }

    return this.jwtService.sign(payload)
  }
}






