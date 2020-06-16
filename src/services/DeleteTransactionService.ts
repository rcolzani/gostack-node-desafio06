import { getRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactions = await getRepository(Transaction);
    const transaction = transactions.findOne(id);

    if (!transaction) {
      throw new AppError('Invalid transaction ID');
    }

    await transactions.delete(id);
  }
}

export default DeleteTransactionService;
