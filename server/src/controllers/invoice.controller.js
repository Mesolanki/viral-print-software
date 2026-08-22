/**
 * Viral Print Media — Invoice Controller (LAN Sync Engine)
 * Manages central database storage of all Tax Invoices, Quotations, and Estimate Slips
 * across all connected shop PCs (PC 1, PC 2, PC 3, PC 4).
 */

import seedData from '../../client/src/renderer/src/services/seedData.json' assert { type: 'json' };

// Initialize server master invoice list with seed data
let masterInvoices = Array.isArray(seedData?.invoices) ? [...seedData.invoices] : [];

// ── GET /api/invoices ──────────────────────────────────────────
export const getInvoices = async (req, res, next) => {
  try {
    const { query, type } = req.query;
    let list = [...masterInvoices];

    if (type && type !== 'ALL') {
      list = list.filter(i => i.type === type);
    }

    if (query) {
      const q = String(query).toLowerCase().trim();
      list = list.filter(i =>
        (i.invoice_number && i.invoice_number.toLowerCase().includes(q)) ||
        (i.customer_name && i.customer_name.toLowerCase().includes(q)) ||
        (i.customer_mobile && i.customer_mobile.includes(q))
      );
    }

    return res.status(200).json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/invoices ─────────────────────────────────────────
export const createOrUpdateInvoice = async (req, res, next) => {
  try {
    const invoice = req.body;
    if (!invoice || !invoice.invoice_number) {
      return res.status(400).json({ success: false, message: 'Invoice number is required' });
    }

    const existingIdx = masterInvoices.findIndex(i => i.id === invoice.id || i.invoice_number === invoice.invoice_number);

    if (existingIdx !== -1) {
      masterInvoices[existingIdx] = {
        ...masterInvoices[existingIdx],
        ...invoice,
        updated_at: new Date().toISOString()
      };
      return res.status(200).json({
        success: true,
        message: 'Invoice updated successfully across network',
        data: masterInvoices[existingIdx]
      });
    }

    const newId = masterInvoices.length > 0 ? Math.max(...masterInvoices.map(i => Number(i.id) || 0)) + 1 : 1;
    const newInvoice = {
      ...invoice,
      id: newId,
      created_at: invoice.created_at || new Date().toISOString().split('T')[0]
    };

    masterInvoices.unshift(newInvoice);

    return res.status(201).json({
      success: true,
      message: 'Invoice created successfully across network',
      data: newInvoice
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/invoices/:id ────────────────────────────────────
export const deleteInvoice = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    masterInvoices = masterInvoices.filter(i => Number(i.id) !== id);

    return res.status(200).json({
      success: true,
      message: `Invoice ${id} deleted successfully across network`
    });
  } catch (error) {
    next(error);
  }
};
