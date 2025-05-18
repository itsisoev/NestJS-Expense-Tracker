import { IsNotEmpty, IsString } from 'class-validator';
import { Category } from '../../category/entities/category.entity';
import { User } from '../../users/entities/user.entity';

export class CreateTransactionDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  amount: number;

  @IsString()
  type: 'expense' | 'income';

  @IsNotEmpty()
  category: Category;

  //@IsNotEmpty()
  user: User;
}
