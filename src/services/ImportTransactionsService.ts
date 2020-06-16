import fs from 'fs';
import path from 'path';
import { In, getRepository, TransactionRepository } from 'typeorm';
import csvParser from 'csv-parse';
import uploadConfig from '../config/upload';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import CreateTransactionService from './CreateTransactionService';

interface TransactionsCSV {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(csvToImportFileName: string): Promise<Transaction[]> {
    const categoriesRepository = getRepository(Category);
    const readStreamCSV = fs.createReadStream(csvToImportFileName);
    const parseStream = csvParser({ from_line: 2, ltrim: true, rtrim: true });
    const parseCSV = readStreamCSV.pipe(parseStream);

    const transactions: TransactionsCSV[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line;

      if (!title || !type || !value || !category) {
        return;
      }

      categories.push(category);
      transactions.push({ title, value, type, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);
    const finalCategories = [...newCategories, ...existentCategories];

    const transactionRepository = getRepository(Transaction);
    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );
    await transactionRepository.save(createdTransactions);
    await fs.promises.unlink(csvToImportFileName);
    return createdTransactions;
  }
}

export default ImportTransactionsService;
