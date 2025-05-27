import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
  UseInterceptors,
  ClassSerializerInterceptor,
  Query,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthorGuard } from '../ guards/author.guard';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  @UseGuards(JwtAuthGuard)
  createTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
    @Req() req,
  ) {
    return this.transactionService.createTransaction(
      createTransactionDto,
      req.user.id,
    );
  }

  @Get(':type/find')
  @UseGuards(JwtAuthGuard)
  findAllByType(@Req() req, @Param('type') type: string) {
    return this.transactionService.findAllByType(req.user.id, type);
  }

  @Get('pagination')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  findTransactionsWithPagination(
    @Req() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 3,
  ) {
    return this.transactionService.findTransactionsWithPagination(
      req.user.id,
      +page,
      +limit,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findTransactions(@Req() req) {
    return this.transactionService.findTransactions(req.user.id);
  }

  @Get(':type/:id')
  @UseGuards(JwtAuthGuard, AuthorGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  findTransaction(@Param('id') id: string) {
    return this.transactionService.findTransaction(id);
  }

  @Patch(':type/:id')
  @UseGuards(JwtAuthGuard, AuthorGuard)
  updateTransaction(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionService.updateTransaction(id, updateTransactionDto);
  }

  @Delete(':type/:id')
  @UseGuards(JwtAuthGuard, AuthorGuard)
  removeTransaction(@Param('id') id: string) {
    return this.transactionService.removeTransaction(id);
  }

  @Get('balance')
  @UseGuards(JwtAuthGuard)
  getBalance(@Req() req) {
    return this.transactionService.calculateBalance(req.user.id);
  }

  @Get('split')
  @UseGuards(JwtAuthGuard)
  getSplitTransactions(@Req() req) {
    return this.transactionService.getExpensesAndIncomes(req.user.id);
  }
}
