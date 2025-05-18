import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async createCategory(createCategoryDto: CreateCategoryDto, id: string) {
    const isExist = await this.categoryRepository.count({
      where: {
        user: { id },
        title: createCategoryDto.title,
      },
    });

    if (isExist > 0)
      throw new BadRequestException('This category already exists');

    const newCategory = this.categoryRepository.create({
      title: createCategoryDto.title,
      user: {
        id,
      },
    });

    return await this.categoryRepository.save(newCategory);
  }

  async findCategories(id: string) {
    return await this.categoryRepository.find({
      where: {
        user: { id },
      },
      relations: {
        transactions: true,
      },
    });
  }

  async findCategory(id: string) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: {
        user: true,
        transactions: true,
      },
    });

    if (!category) throw new NotFoundException('Category not found');

    return category;
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryRepository.preload({
      id,
      ...updateCategoryDto,
    });

    if (!category) throw new NotFoundException('Category not found');

    return await this.categoryRepository.save(category);
  }

  async removeCategory(id: string) {
    const category = await this.findCategory(id);

    await this.categoryRepository.remove(category);
    return category;
  }
}
