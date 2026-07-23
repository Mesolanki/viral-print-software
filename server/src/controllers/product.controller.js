import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';

export const createProduct = async (req, res) => {
  try {
    const { company_id, category_id, name, unit, price, gst_rate, description } = req.body;

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' });
    }

    if (!category_id) {
      return res.status(400).json({ error: 'category_id is required' });
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Valid product name is required' });
    }

    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ error: 'Valid positive price is required' });
    }

    // Check if company exists
    const companyExists = await prisma.company.findUnique({
      where: { id: Number(company_id) },
    });

    if (!companyExists) {
      return res.status(404).json({ error: `Company with ID ${company_id} not found` });
    }

    // Check if category exists
    const categoryExists = await prisma.category.findUnique({
      where: { id: Number(category_id) },
    });

    if (!categoryExists) {
      return res.status(404).json({ error: `Category with ID ${category_id} not found` });
    }

    if (categoryExists.company_id !== Number(company_id)) {
      return res.status(400).json({ error: 'Selected category does not belong to the specified company' });
    }

    const product = await prisma.product.create({
      data: {
        company_id: Number(company_id),
        category_id: Number(category_id),
        name: name.trim(),
        unit: unit ? String(unit).trim() : 'pcs',
        price: new Prisma.Decimal(Number(price)),
        gst_rate: gst_rate !== undefined ? new Prisma.Decimal(Number(gst_rate)) : new Prisma.Decimal(18.00),
        description: description ? String(description).trim() : null,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, name, unit, price, gst_rate, description } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Valid product ID parameter is required' });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: `Product with ID ${id} not found` });
    }

    const updateData = {};

    if (category_id !== undefined) {
      if (isNaN(Number(category_id))) {
        return res.status(400).json({ error: 'Valid category_id is required' });
      }
      // Check if category exists
      const categoryExists = await prisma.category.findUnique({
        where: { id: Number(category_id) },
      });
      if (!categoryExists) {
        return res.status(404).json({ error: `Category with ID ${category_id} not found` });
      }
      if (categoryExists.company_id !== existingProduct.company_id) {
        return res.status(400).json({ error: 'Selected category does not belong to the same company' });
      }
      updateData.category_id = Number(category_id);
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Valid product name is required' });
      }
      updateData.name = name.trim();
    }

    if (unit !== undefined) {
      updateData.unit = String(unit).trim();
    }

    if (price !== undefined) {
      if (isNaN(Number(price)) || Number(price) < 0) {
        return res.status(400).json({ error: 'Valid positive price is required' });
      }
      updateData.price = new Prisma.Decimal(Number(price));
    }

    if (gst_rate !== undefined) {
      if (isNaN(Number(gst_rate)) || Number(gst_rate) < 0) {
        return res.status(400).json({ error: 'Valid positive gst_rate is required' });
      }
      updateData.gst_rate = new Prisma.Decimal(Number(gst_rate));
    }

    if (description !== undefined) {
      updateData.description = description ? String(description).trim() : null;
    }

    const updatedProduct = await prisma.product.update({
      where: { id: Number(id) },
      data: updateData,
    });

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Valid product ID parameter is required' });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: `Product with ID ${id} not found` });
    }

    // Delete product
    await prisma.product.delete({
      where: { id: Number(id) },
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { company_id, search, category_id } = req.query;

    if (!company_id) {
      return res.status(400).json({ error: 'company_id query parameter is required' });
    }

    const whereClause = {
      company_id: Number(company_id),
    };

    if (category_id) {
      whereClause.category_id = Number(category_id);
    }

    if (search) {
      const searchStr = String(search).trim();
      whereClause.OR = [
        {
          name: {
            contains: searchStr,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: searchStr,
            mode: 'insensitive',
          },
        },
      ];
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};
