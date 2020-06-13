import { getRepository } from 'typeorm';

import AppError from '../errors/AppError';

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

    transactions.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
