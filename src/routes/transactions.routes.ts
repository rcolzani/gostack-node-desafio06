import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { getCustomRepository } from 'typeorm';
import uploadConfig from '../config/upload';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';
import AppError from '../errors/AppError';

const transactionsRouter = Router();
const upload = multer(uploadConfig);

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  const transactions = await transactionsRepository.find();
  const balance = await transactionsRepository.getBalance();

  const transactionsResponse = {
    transactions,
    balance,
  };

  return response.json(transactionsResponse);
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  if (type !== 'income' && type !== 'outcome') {
    return response.status(400).json({ error: 'Invalid type' });
  }

  const createTransaction = new CreateTransactionService();
  const transaction = await createTransaction.execute({
    title,
    value,
    type,
    category,
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;
  const deleteTransaction = new DeleteTransactionService();
  await deleteTransaction.execute(id);
  return response.json({ ok: true });
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const importTransactionService = new ImportTransactionsService();

    if (!request.file) {
      return response.json({ error: 'Invalid file type' });
    }

    const transactionsAdded = await importTransactionService.execute(
      path.join(uploadConfig.directory, request.file.filename),
    );

    return response.json(transactionsAdded);
  },
);

export default transactionsRouter;
