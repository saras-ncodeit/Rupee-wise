import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AccountsController, TransactionsController],
  providers: [AccountsService, TransactionsService],
  exports: [AccountsService, TransactionsService],
})
export class TransactionsModule {}
