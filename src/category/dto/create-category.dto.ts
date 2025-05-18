import { IsNotEmpty, IsOptional } from 'class-validator';
import { User } from '../../users/entities/user.entity';

export class CreateCategoryDto {
  @IsNotEmpty()
  title: string;

  @IsOptional()
  user?: User;
}
