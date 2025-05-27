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
      throw new BadRequestException(
        'Категория с таким названием уже существует',
      );

    const newCategory = this.categoryRepository.create({
      title: createCategoryDto.title,
      user: {
        id,
      },
    });

    const savedCategory = await this.categoryRepository.save(newCategory);

    return {
      message: 'Категория успешно создана',
      data: savedCategory,
    };
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

    if (!category) throw new NotFoundException('Категория не найдена');

    const updatedCategory = await this.categoryRepository.save(category);

    return {
      message: 'Категория успешно обновлена',
      data: updatedCategory,
    };
  }

  async removeCategory(id: string) {
    const category = await this.findCategory(id);

    await this.categoryRepository.remove(category);

    return {
      message: 'Категория успешно удалена',
      data: category,
    };
  }
}
