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
import { Between, Raw } from 'typeorm';
import * as dayjs from 'dayjs';

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

  async getExpensesAndIncomes(id: string) {
    const [income, expense] = await Promise.all([
      this.transactionRepository.find({
        where: { user: { id }, type: 'income' },
        relations: ['category'],
        order: { createdAt: 'DESC' },
      }),
      this.transactionRepository.find({
        where: { user: { id }, type: 'expense' },
        relations: ['category'],
        order: { createdAt: 'DESC' },
      }),
    ]);

    return { income, expense };
  }

  async getStatsByPeriod(userId: string, period: 'week' | 'month' | 'year') {
    let fromDate: Date;
    const toDate: Date = new Date();

    switch (period) {
      case 'week':
        fromDate = dayjs().subtract(6, 'day').startOf('day').toDate();
        break;
      case 'month':
        fromDate = dayjs().subtract(29, 'day').startOf('day').toDate();
        break;
      case 'year':
        fromDate = dayjs().subtract(11, 'month').startOf('month').toDate();
        break;
      default:
        throw new BadRequestException('Invalid period');
    }

    const transactions = await this.transactionRepository.find({
      where: {
        user: { id: userId },
        createdAt: Between(fromDate, toDate),
      },
    });

    const grouped = {};

    for (const tx of transactions) {
      let key: string;

      if (period === 'year') {
        key = dayjs(tx.createdAt).format('YYYY-MM');
      } else {
        key = dayjs(tx.createdAt).format('YYYY-MM-DD');
      }

      if (!grouped[key]) {
        grouped[key] = { income: 0, expense: 0 };
      }

      grouped[key][tx.type] += tx.amount;
    }

    const dates: string[] = [];
    const result: any[] = [];

    if (period === 'year') {
      for (let i = 11; i >= 0; i--) {
        const key = dayjs().subtract(i, 'month').format('YYYY-MM');
        dates.push(key);
      }
    } else {
      const length = period === 'week' ? 7 : 30;
      for (let i = length - 1; i >= 0; i--) {
        const key = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
        dates.push(key);
      }
    }

    for (const date of dates) {
      result.push({
        date,
        income: grouped[date]?.income || 0,
        expense: grouped[date]?.expense || 0,
      });
    }

    return {
      period,
      data: result,
    };
  }
}
