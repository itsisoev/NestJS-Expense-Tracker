import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TransactionService } from '../transaction/transaction.service';
import { CategoryService } from '../category/category.service';

@Injectable()
export class AuthorGuard implements CanActivate {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly categoryService: CategoryService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { id, type } = request.params;

    let entity;

    switch (type) {
      case 'transaction':
        entity = await this.transactionService.findTransaction(id);
        break;
      case 'category':
        entity = await this.categoryService.findCategory(id);
        break;
      default:
        throw new NotFoundException();
    }

    const user = request.user;

    if (entity && user && entity.user.id === user.id) {
      return true;
    }

    throw new Error('User is not authorized to access this resource');
  }
}
