import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User } from '@libs/@systems/entities/primary'
import { UpdateUserDto, ChangePasswordDto } from '@libs/@systems/dtos'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async updateProfile(userId: string, updateUserDto: UpdateUserDto): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    // Update user fields
    if (updateUserDto.username) {
      user.username = updateUserDto.username
    }
    if (updateUserDto.avatar !== undefined) {
      user.avatar = updateUserDto.avatar
    }

    const updatedUser = await this.userRepository.save(user)

    const { password, ...userWithoutPassword } = updatedUser
    return userWithoutPassword
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password)

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect')
    }

    // Hash and update new password
    user.password = await bcrypt.hash(changePasswordDto.newPassword, 10)
    await this.userRepository.save(user)

    return { message: 'Password changed successfully' }
  }

  async findById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
    })
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    })
  }
}






