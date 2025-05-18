import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async createTransaction(
    createTransactionDto: CreateTransactionDto,
    id: string,
  ) {
    if (createTransactionDto.type === 'expense') {
      const currentBalance = await this.calculateBalance(id);
      if (currentBalance < createTransactionDto.amount) {
        throw new BadRequestException('Expense exceeds current balance');
      }
    }

    const newTransaction = this.transactionRepository.create({
      title: createTransactionDto.title,
      amount: createTransactionDto.amount,
      type: createTransactionDto.type,
      category: { id: createTransactionDto.category.id },
      user: { id },
    });

    return await this.transactionRepository.save(newTransaction);
  }

  async findTransactions(id: string) {
    return await this.transactionRepository.find({
      where: {
        user: { id },
      },
      relations: ['category'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findTransaction(id: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['user', 'category'],
    });

    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  async updateTransaction(
    id: string,
    updateTransactionDto: UpdateTransactionDto,
  ) {
    const transaction = await this.transactionRepository.preload({
      id,
      ...updateTransactionDto,
    });

    if (!transaction) throw new NotFoundException('Transaction not found');

    return await this.transactionRepository.save(transaction);
  }

  async removeTransaction(id: string) {
    const transaction = await this.findTransaction(id);

    await this.transactionRepository.remove(transaction);
    return transaction;
  }

  async findTransactionsWithPagination(
    id: string,
    page: number,
    limit: number,
  ) {
    return await this.transactionRepository.find({
      where: {
        user: { id },
      },
      relations: ['user', 'category'],
      order: {
        createdAt: 'DESC',
      },
      take: limit,
      skip: (page - 1) * limit,
    });
  }

  async findAllByType(id: string, type: string) {
    const transaction = await this.transactionRepository.find({
      where: {
        user: { id },
        type,
      },
    });
    const total = transaction.reduce((acc, obj) => acc + obj.amount, 0);

    return total;
  }

  async calculateBalance(id: string) {
    const income = await this.findAllByType(id, 'income');
    const expense = await this.findAllByType(id, 'expense');
    return income - expense;
  }
}
