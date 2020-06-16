import { getRepository, getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const balance = await transactionRepository.getBalance();

    if (type === 'outcome') {
      if (value > balance.total) {
        throw new AppError('Insuficient total value', 400);
      }
    }

    const categories = getRepository(Category);
    let categoryExistent = await categories.findOne({
      where: { title: category },
    });

    if (!categoryExistent) {
      categoryExistent = categories.create({ title: category });
      await categories.save(categoryExistent);
    }

    const transactions = getRepository(Transaction);
    const transaction = transactions.create({
      title,
      value,
      type,
      category_id: categoryExistent.id,
    });

    await transactions.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
