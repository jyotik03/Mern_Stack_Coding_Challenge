import express from 'express';
import fetch from 'node-fetch'; // To fetch external data
import Transaction from '../models/Transaction.js'; // Assuming you have a Transaction model set up

const router = express.Router();

// Route to import data from external API and save to MongoDB
router.get('/import', async (req, res) => {
  try {
    const response = await fetch('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const data = await response.json();

    // Assuming data is an array of transaction objects
    const transactions = data.map(item => ({
      title: item.title,
      description: item.description,
      image: item.image,
      price: item.price,
      sold: item.sold,
      dateOfSale: new Date(item.dateOfSale),
    }));

    await Transaction.insertMany(transactions); // Save to MongoDB
    res.status(200).json({ message: 'Transactions imported successfully!', count: transactions.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error importing transactions' });
  }
});

// API to list transactions with search and pagination
router.get('/search', async (req, res) => {
  const { search = '', page = 1, perPage = 10 } = req.query;
  const pageInt = parseInt(page, 10);
  const perPageInt = parseInt(perPage, 10);

  try {
    const searchQuery = {
      $or: [
        { title: { $regex: search, $options: 'i' } }, // case-insensitive search on title
        { description: { $regex: search, $options: 'i' } },
        { price: { $regex: search, $options: 'i' } }
      ]
    };

    const transactions = await Transaction
      .find(search ? searchQuery : {})
      .skip((pageInt - 1) * perPageInt)
      .limit(perPageInt);

    const total = await Transaction.countDocuments(search ? searchQuery : {});

    res.status(200).json({
      transactions,
      total,
      page: pageInt,
      perPage: perPageInt,
      totalPages: Math.ceil(total / perPageInt)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

// API for statistics of a selected month
router.get('/statistics', async (req, res) => {
  const { month, year } = req.query;
  
  if (!month || !year) {
    return res.status(400).json({ message: 'Month and year are required' });
  }

  const startDate = new Date(`${year}-${month}-01`);
  const endDate = new Date(`${year}-${month}-31`);

  try {
    const totalSales = await Transaction.aggregate([
      { $match: { dateOfSale: { $gte: startDate, $lte: endDate }, sold: true } },
      { $group: { _id: null, totalAmount: { $sum: '$price' } } }
    ]);

    const soldCount = await Transaction.countDocuments({
      dateOfSale: { $gte: startDate, $lte: endDate },
      sold: true
    });

    const notSoldCount = await Transaction.countDocuments({
      dateOfSale: { $gte: startDate, $lte: endDate },
      sold: false
    });

    res.status(200).json({
      totalSales: totalSales[0]?.totalAmount || 0,
      soldCount,
      notSoldCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

// API for bar chart data (price range count for selected month)
router.get('/barchart', async (req, res) => {
  const { month, year } = req.query;
  
  if (!month || !year) {
    return res.status(400).json({ message: 'Month and year are required' });
  }

  const startDate = new Date(`${year}-${month}-01`);
  const endDate = new Date(`${year}-${month}-31`);

  try {
    const priceRanges = await Transaction.aggregate([
      { $match: { dateOfSale: { $gte: startDate, $lte: endDate } } },
      {
        $bucket: {
          groupBy: '$price',
          boundaries: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
          default: '901-above',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    res.status(200).json(priceRanges);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching price range data' });
  }
});

// API for pie chart (unique categories for selected month)
router.get('/piechart', async (req, res) => {
  const { month, year } = req.query;
  
  if (!month || !year) {
    return res.status(400).json({ message: 'Month and year are required' });
  }

  const startDate = new Date(`${year}-${month}-01`);
  const endDate = new Date(`${year}-${month}-31`);

  try {
    const categoryCounts = await Transaction.aggregate([
      { $match: { dateOfSale: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$title', count: { $sum: 1 } } }
    ]);

    res.status(200).json(categoryCounts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching category data' });
  }
});

// API to combine data from all APIs (statistics, bar chart, pie chart)
router.get('/combined', async (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ message: 'Month and year are required' });
  }

  try {
    const [statistics, barChart, pieChart] = await Promise.all([
      fetch(`http://localhost:5000/api/transactions/statistics?month=${month}&year=${year}`).then(res => res.json()),
      fetch(`http://localhost:5000/api/transactions/barchart?month=${month}&year=${year}`).then(res => res.json()),
      fetch(`http://localhost:5000/api/transactions/piechart?month=${month}&year=${year}`).then(res => res.json())
    ]);

    res.status(200).json({
      statistics,
      barChart,
      pieChart
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching combined data' });
  }
});

export default router;
