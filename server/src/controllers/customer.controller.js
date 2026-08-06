import { prisma } from '../config/database.js';

// Indian GST State Code dictionary
export const GST_STATE_CODES = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman and Diu',
  '26': 'Dadra and Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};

// Common Trade Name Mock Dictionary for Indian GST demo lookup
const KNOWN_GST_TRADES = {
  '24BAAPM9783K1Z7': {
    companyName: 'Viral Print Media',
    ownerName: 'Viral Patel',
    mobile: '9979963632',
    address: 'GF-10, Satyamev Arcade, Chandkheda, Ahmedabad, Gujarat - 382424',
  },
  '24AAACV1234A1Z5': {
    companyName: 'Vardhman Graphics & Advertising',
    ownerName: 'Vardhman Shah',
    mobile: '9825012345',
    address: 'Shop 12, Main Commercial Complex, Ashram Road, Ahmedabad, Gujarat - 380009',
  },
  '24AACCS9876Q1ZM': {
    companyName: 'Shreeji Digital Print Studio',
    ownerName: 'Ramesh Bhai Prajapati',
    mobile: '9712345678',
    address: 'Plot 45, GIDC Industrial Estate, Naroda, Ahmedabad, Gujarat - 382330',
  },
};

// ── Parse GSTIN structure ─────────────────────────────────────
export const parseGSTIN = (gstin) => {
  if (!gstin || typeof gstin !== 'string') return null;
  const clean = gstin.trim().toUpperCase();

  if (clean.length < 2) return null;
  const stateCode = clean.substring(0, 2);
  const stateName = GST_STATE_CODES[stateCode] || 'Unknown State';
  const pan = clean.length >= 12 ? clean.substring(2, 12) : '';

  // Check known trade or generate realistic structured trade details
  const known = KNOWN_GST_TRADES[clean];
  const derivedTradeName = known ? known.companyName : `${clean.substring(2, 6)} Traders & Printing Co.`;
  const derivedOwnerName = known ? known.ownerName : `Prop. (${pan.substring(0, 5)})`;
  const derivedMobile = known ? known.mobile : '';
  const derivedAddress = known ? known.address : `Industrial Premises, ${stateName}`;

  return {
    gstin: clean,
    isValidFormat: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(clean),
    stateCode,
    stateName,
    pan,
    companyName: derivedTradeName,
    ownerName: derivedOwnerName,
    mobile: derivedMobile,
    address: derivedAddress,
  };
};

// ── GET /api/customers ─────────────────────────────────────────
export const getCustomers = async (req, res, next) => {
  try {
    const { query } = req.query;
    let whereClause = {};

    if (query) {
      whereClause = {
        OR: [
          { name: { contains: query } },
          { mobile: { contains: query } },
          { gst_no: { contains: query } },
        ],
      };
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      take: 50,
    });

    return res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/customers/lookup-gst/:gstNo ─────────────────────
export const lookupGst = async (req, res, next) => {
  try {
    const { gstNo } = req.params;
    const parsed = parseGSTIN(gstNo);

    if (!parsed) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GST number format',
      });
    }

    // Check if customer exists in database
    const existing = await prisma.customer.findFirst({
      where: {
        gst_no: { contains: parsed.gstin },
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        parsed,
        existingCustomer: existing || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/customers ───────────────────────────────────────
export const createOrUpdateCustomer = async (req, res, next) => {
  try {
    const { name, mobile, email, gst_no, billing_address } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }

    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: { company_name: 'Viral Print Media' },
      });
    }

    let customer;
    if (gst_no && gst_no.trim()) {
      const existing = await prisma.customer.findFirst({
        where: { gst_no: gst_no.trim(), company_id: company.id },
      });
      if (existing) {
        customer = await prisma.customer.update({
          where: { id: existing.id },
          data: { name, mobile, email, billing_address },
        });
      }
    }

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          company_id: company.id,
          name,
          mobile: mobile || '',
          email: email || '',
          gst_no: gst_no || '',
          billing_address: billing_address || '',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};
