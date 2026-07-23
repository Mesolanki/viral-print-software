import { prisma } from '../config/database.js';

export const createCategory = async (req, res) => {
  try {
    const { company_id, name } = req.body;

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' });
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Valid category name is required' });
    }

    // Check if company exists
    const companyExists = await prisma.company.findUnique({
      where: { id: Number(company_id) },
    });

    if (!companyExists) {
      return res.status(404).json({ error: `Company with ID ${company_id} not found` });
    }

    // Check if category already exists for this company
    const existingCategory = await prisma.category.findUnique({
      where: {
        company_id_name: {
          company_id: Number(company_id),
          name: name.trim(),
        },
      },
    });

    if (existingCategory) {
      return res.status(400).json({ error: 'Category with this name already exists for the company' });
    }

    const category = await prisma.category.create({
      data: {
        company_id: Number(company_id),
        name: name.trim(),
      },
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const getCategories = async (req, res) => {
  try {
    const { company_id } = req.query;

    if (!company_id) {
      return res.status(400).json({ error: 'company_id query parameter is required' });
    }

    const categories = await prisma.category.findMany({
      where: {
        company_id: Number(company_id),
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};
