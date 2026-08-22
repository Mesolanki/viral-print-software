// ============================================================
// Viral Print Media - Data & API Service
// ============================================================
import * as XLSX from 'xlsx'
import seedData from './seedData.json'


export interface Customer {
  id: number
  name: string
  mobile: string
  email: string
  gst_no: string
  billing_address: string
  shipping_address: string
  outstanding_balance: number
  created_at: string
}

export interface Supplier {
  id: number
  name: string
  mobile: string
  email: string
  gst_no: string
  address: string
  created_at: string
}

export interface Product {
  id: number
  name: string
  category: string
  unit: string
  price: number
  gst_rate: number
  hsn_code: string
  description: string
}

export interface InvoiceItem {
  id?: number
  product_id?: number
  description: string
  hsn: string
  unit?: string
  tax_percent: number
  qty: number
  rate: number
  amount: number
}

export interface DailyTransaction {
  id: number
  type: 'INCOME' | 'EXPENSE'
  category: string
  amount: number
  payment_mode: 'CASH' | 'UPI' | 'BANK'
  date: string
  time?: string
  notes?: string
  created_at: string
}

export interface Invoice {
  id: number
  invoice_number: string
  type: 'TAX_INVOICE' | 'QUOTATION' | 'ESTIMATE'
  date: string
  time?: string
  customer_name: string
  customer_mobile: string
  customer_gstin: string
  customer_address: string
  eway_bill_no?: string
  vehicle_no?: string
  transporter_name?: string
  distance_km?: number
  supply_type?: string
  document_type?: string
  valid_for?: string
  credit_period?: string
  sub_total: number
  cgst: number
  sgst: number
  round_off: number
  grand_total: number
  paid_amount: number
  balance_amount: number
  status: 'PAID' | 'UNPAID' | 'PARTIALLY_PAID'
  payment_mode?: 'CASH' | 'BANK' | 'UPI' | 'CARD'
  items: InvoiceItem[]
  terms?: string
  created_at: string
}

/**
 * Calculates current Indian Financial Year (April 1 to March 31).
 * E.g. for date 2026-08-07 -> '26-27'
 */
export function getIndianFinancialYear(dateInput?: Date | string): string {
  const d = dateInput ? new Date(dateInput) : new Date()
  const year = d.getFullYear()
  const month = d.getMonth() + 1 // 1=Jan, 4=Apr

  let startYear = year
  let endYear = year + 1

  if (month < 4) {
    startYear = year - 1
    endYear = year
  }

  return `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`
}

/**
 * Generates official sequential Invoice / Quote / Estimate Number.
 * Tax Invoice: VPM/26-27/73
 * Quotation: VPM/QT/26-27/72
 * Estimate: EST/26-27/460
 */
export function getNextInvoiceNumber(type: 'TAX_INVOICE' | 'QUOTATION' | 'ESTIMATE', dateInput?: Date | string): string {
  const fy = getIndianFinancialYear(dateInput)
  const invoices = DataService.getInvoices()

  // Base starting sequence numbers as requested:
  // Tax Invoice starts with 73 (VPM/26-27/73)
  // Quotation starts with 72 (VPM/QT/26-27/72)
  // Estimate starts with 460 (EST/26-27/460)
  const startSeq = type === 'TAX_INVOICE' ? 73 : type === 'QUOTATION' ? 72 : 460
  const prefix = type === 'TAX_INVOICE' ? `VPM/${fy}/` : type === 'QUOTATION' ? `VPM/QT/${fy}/` : `EST/${fy}/`

  const sameFyInvoices = invoices.filter(i => {
    if (!i.invoice_number) return false
    if (i.type === type && i.invoice_number.includes(`/${fy}/`)) return true
    if (type === 'TAX_INVOICE' && i.invoice_number.startsWith(`VPM/${fy}/`) && !i.invoice_number.includes('/QT/')) return true
    if (type === 'QUOTATION' && (i.invoice_number.startsWith(`VPM/QT/${fy}/`) || i.invoice_number.includes('/QT/'))) return true
    if (type === 'ESTIMATE' && (i.invoice_number.startsWith(`EST/${fy}/`) || i.invoice_number.startsWith('EST/'))) return true
    return false
  })

  let nextSeq = startSeq
  if (sameFyInvoices.length > 0) {
    const seqs = sameFyInvoices.map(i => {
      const parts = i.invoice_number.split('/')
      const numPart = parts[parts.length - 1] || ''
      const match = numPart.match(/\d+/)
      return match ? parseInt(match[0], 10) : 0
    })
    const maxSeq = Math.max(...seqs, 0)
    if (maxSeq >= startSeq) {
      nextSeq = maxSeq + 1
    }
  }

  return `${prefix}${nextSeq}`
}



export interface PurchaseItem {
  id?: number
  product_name: string
  unit?: string
  qty: number
  rate: number
  amount: number
}

export interface Purchase {
  id: number
  purchase_number: string
  supplier_name: string
  supplier_mobile: string
  supplier_gstin?: string
  date: string
  total_amount: number
  paid_amount: number
  balance_amount: number
  status: 'PAID' | 'UNPAID' | 'PARTIALLY_PAID'
  items: PurchaseItem[]
  notes: string
  created_at: string
}

export interface PaymentRecord {
  id: number
  invoice_id: number
  invoice_number: string
  invoice_type: 'TAX_INVOICE' | 'QUOTATION' | 'ESTIMATE'
  customer_name: string
  date: string
  amount: number
  payment_type: 'CASH' | 'BANK' | 'UPI' | 'CARD'
  notes: string
  created_at: string
}

export interface TaskItem {
  id: number
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  assigned_to: string
  start_date: string
  due_date: string
  created_at: string
}

export interface SystemUser {
  id: number
  full_name: string
  username: string
  role: 'Admin' | 'Operator' | 'Viewer'
  status: 'ACTIVE' | 'INACTIVE'
  last_login: string
}

export interface ActivityLogItem {
  id: number
  username: string
  action: string
  module: string
  detail: string
  timestamp: string
}

const STORAGE_KEYS = {
  CUSTOMERS: 'vpm_customers',
  SUPPLIERS: 'vpm_suppliers',
  PRODUCTS: 'vpm_products',
  INVOICES: 'vpm_invoices',
  PURCHASES: 'vpm_purchases',
  PAYMENTS: 'vpm_payments',
  TASKS: 'vpm_tasks',
  USERS: 'vpm_users',
  LOGS: 'vpm_activity_logs'
}

// Restored Data from InvoicePrintDB22-08-2026.bak
const INITIAL_CUSTOMERS: Customer[] = (seedData.customers || []) as Customer[]


const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 1,
    name: 'Gujarat Paper Mart',
    mobile: '98980 11223',
    email: 'sales@gujarattpaper.com',
    gst_no: '24DDDDD3333D4Z8',
    address: 'Plot 45, GIDC Naroda, Ahmedabad',
    created_at: '2026-07-01'
  },
  {
    id: 2,
    name: 'Sun Flex & Banner Vinyl Media',
    mobile: '99090 33445',
    email: 'sunflex.media@gmail.com',
    gst_no: '24EEEEE4444E5Z9',
    address: 'Shop 12, Industrial Estate, Odhav, Ahmedabad',
    created_at: '2026-07-05'
  }
]

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, name: 'Star Flex Banner (13 oz)', category: 'Banners & Flex', unit: 'sqft', price: 18, gst_rate: 18, hsn_code: '4911', description: 'Premium 13 oz frontlit star flex banner' },
  { id: 2, name: 'Eco-Solvent Vinyl Sticker', category: 'Stickers & Labels', unit: 'sqft', price: 45, gst_rate: 18, hsn_code: '4911', description: 'Waterproof high gloss outdoor vinyl sticker' },
  { id: 3, name: '3D Acrylic Glow Signboard', category: 'Signages & Boards', unit: 'sqft', price: 650, gst_rate: 18, hsn_code: '9405', description: 'LED backlit 3D acrylic channel letters' },
  { id: 4, name: '350 GSM Velvet Visiting Cards (1000 Pcs)', category: 'Visiting Cards', unit: 'set', price: 450, gst_rate: 12, hsn_code: '4911', description: 'Super velvet soft touch double side printed' },
  { id: 5, name: 'One-Way Vision Film', category: 'Stickers & Labels', unit: 'sqft', price: 55, gst_rate: 18, hsn_code: '4911', description: 'Perforated window vinyl film for glass' },
  { id: 6, name: 'Roll-up Standee (6x3 Feet)', category: 'Display Standees', unit: 'pcs', price: 1250, gst_rate: 18, hsn_code: '4911', description: 'Aluminum base roll up standee with flex banner' },
  { id: 7, name: 'Foamsheet Board Printing (5mm)', category: 'Signages & Boards', unit: 'sqft', price: 75, gst_rate: 18, hsn_code: '4911', description: 'Direct UV printing on 5mm PVC foamsheet' }
]
const INITIAL_INVOICES: Invoice[] = (seedData.invoices || []) as Invoice[]



const INITIAL_PURCHASES: Purchase[] = [
  {
    id: 1,
    purchase_number: 'PUR-2627-012',
    supplier_name: 'Gujarat Paper Mart',
    supplier_mobile: '98980 11223',
    date: '2026-07-28',
    total_amount: 45000,
    paid_amount: 30000,
    balance_amount: 15000,
    status: 'PARTIALLY_PAID',
    items: [
      { product_name: '170 GSM Art Paper Rolls', qty: 10, rate: 3500, amount: 35000 },
      { product_name: '350 GSM Board Paper Packets', qty: 20, rate: 500, amount: 10000 }
    ],
    notes: 'Raw paper material stock purchase',
    created_at: '2026-07-28'
  }
]

const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 1,
    invoice_id: 1,
    invoice_number: 'VPM/26-27/0101',
    invoice_type: 'TAX_INVOICE',
    customer_name: 'Apex Infotech Solutions',
    date: '2026-08-02',
    amount: 10000,
    payment_type: 'BANK',
    notes: 'Advance transfer via IMPS Bank transfer',
    created_at: '2026-08-02'
  },
  {
    id: 2,
    invoice_id: 3,
    invoice_number: 'EST-2026-089',
    invoice_type: 'ESTIMATE',
    customer_name: 'Satyam Advertising Agency',
    date: '2026-08-06',
    amount: 8500,
    payment_type: 'UPI',
    notes: 'Full payment via PhonePe UPI',
    created_at: '2026-08-06'
  }
]

const INITIAL_TASKS: TaskItem[] = [
  {
    id: 1,
    title: 'Print & Mount Glow Sign Board for Apex Infotech',
    description: 'Ensure Samsung LED wiring and 3D acrylic cutouts are aligned.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assigned_to: 'Ramesh Sharma (Operator)',
    start_date: '2026-08-06',
    due_date: '2026-08-08',
    created_at: '2026-08-06'
  },
  {
    id: 2,
    title: 'Dispatch 500 sqft Flex Banners',
    description: 'Deliver to SG Highway client site by 4 PM.',
    priority: 'URGENT',
    status: 'PENDING',
    assigned_to: 'Vikram Patel',
    start_date: '2026-08-07',
    due_date: '2026-08-07',
    created_at: '2026-08-07'
  },
  {
    id: 3,
    title: 'Prepare Monthly GST CA File for July 2026',
    description: 'Compile all B2B Tax Invoices and purchase bills.',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    assigned_to: 'Admin User',
    start_date: '2026-08-01',
    due_date: '2026-08-05',
    created_at: '2026-08-01'
  }
]

const INITIAL_USERS: SystemUser[] = [
  {
    id: 1,
    full_name: 'Viral Administrator',
    username: 'admin',
    role: 'Admin',
    status: 'ACTIVE',
    last_login: '2026-08-07 16:30'
  },
  {
    id: 2,
    full_name: 'Ramesh Sharma',
    username: 'ramesh',
    role: 'Operator',
    status: 'ACTIVE',
    last_login: '2026-08-07 10:15'
  },
  {
    id: 3,
    full_name: 'Accounts Manager',
    username: 'accounts',
    role: 'Operator',
    status: 'ACTIVE',
    last_login: '2026-08-06 18:00'
  }
]

const INITIAL_LOGS: ActivityLogItem[] = [
  {
    id: 1,
    username: 'admin',
    action: 'Invoice Created',
    module: 'Invoice Management',
    detail: 'Created Tax Invoice VPM/26-27/0101 for Apex Infotech Solutions',
    timestamp: '2026-08-01 11:20:00'
  },
  {
    id: 2,
    username: 'ramesh',
    action: 'Task Updated',
    module: 'Task Management',
    detail: 'Updated status to IN_PROGRESS for Glow Sign Board task',
    timestamp: '2026-08-06 14:10:00'
  }
]

// Generic Storage Helper Functions
function getStoredItem<T>(key: string, initialDefault: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initialDefault))
      return initialDefault
    }
    const parsed = JSON.parse(raw) as T
    // Reset products to clean standard printing list if holding old unformatted items
    if (key === STORAGE_KEYS.PRODUCTS && Array.isArray(parsed) && parsed.length > 100) {
      localStorage.setItem(key, JSON.stringify(initialDefault))
      return initialDefault as unknown as T
    }
    if (Array.isArray(parsed) && Array.isArray(initialDefault) && initialDefault.length > parsed.length) {
      localStorage.setItem(key, JSON.stringify(initialDefault))
      return initialDefault as unknown as T
    }


    return parsed

  } catch (err) {
    console.warn(`[DataService] Error reading key ${key}:`, err)
    return initialDefault
  }
}

function setStoredItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.error(`[DataService] Error writing key ${key}:`, err)
  }
}

export const DataService = {
  // Customers
  getCustomers: (): Customer[] => getStoredItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS),
  lookupGst: (gstNo: string) => {
    const clean = gstNo.trim().toUpperCase()
    const customers = DataService.getCustomers()
    const existing = customers.find(c => c.gst_no && c.gst_no.trim().toUpperCase().includes(clean))
    
    const stateCode = clean.substring(0, 2)
    const GST_STATE_MAP: Record<string, string> = {
      '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
      '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan',
      '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
      '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram', '16': 'Tripura',
      '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal', '20': 'Jharkhand',
      '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
      '25': 'Daman & Diu', '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra', '28': 'Andhra Pradesh',
      '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala',
      '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman & Nicobar', '36': 'Telangana',
      '37': 'Andhra Pradesh', '38': 'Ladakh'
    }
    const stateName = GST_STATE_MAP[stateCode] || 'Gujarat'
    const pan = clean.length >= 12 ? clean.substring(2, 12) : ''

    return {
      existingCustomer: existing || null,
      parsed: {
        gstin: clean,
        stateCode,
        stateName,
        pan,
        companyName: existing ? existing.name : `${clean.substring(2, 6)} Enterprises`,
        ownerName: `Prop. (${pan.substring(0, 5)})`,
        mobile: existing ? existing.mobile : '',
        address: existing ? existing.billing_address : `Commercial Estate, ${stateName}`
      }
    }
  },
  saveCustomer: (customer: Partial<Customer>): Customer => {
    const list = DataService.getCustomers()
    if (customer.id) {
      const idx = list.findIndex(c => c.id === customer.id)
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...customer }
        setStoredItem(STORAGE_KEYS.CUSTOMERS, list)
        return list[idx]
      }
    }
    const newCustomer: Customer = {
      id: list.length > 0 ? Math.max(...list.map(c => c.id)) + 1 : 1,
      name: customer.name || '',
      mobile: customer.mobile || '',
      email: customer.email || '',
      gst_no: customer.gst_no || '',
      billing_address: customer.billing_address || '',
      shipping_address: customer.shipping_address || customer.billing_address || '',
      outstanding_balance: customer.outstanding_balance || 0,
      created_at: new Date().toISOString().split('T')[0]
    }
    list.unshift(newCustomer)
    setStoredItem(STORAGE_KEYS.CUSTOMERS, list)
    DataService.addActivityLog('admin', 'Customer Added', 'Customer Management', `Added customer: ${newCustomer.name}`)
    return newCustomer
  },
  deleteCustomer: (id: number): void => {
    const list = DataService.getCustomers().filter(c => c.id !== id)
    setStoredItem(STORAGE_KEYS.CUSTOMERS, list)
  },

  // Suppliers
  getSuppliers: (): Supplier[] => getStoredItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS),
  saveSupplier: (supplier: Partial<Supplier>): Supplier => {
    const list = DataService.getSuppliers()
    if (supplier.id) {
      const idx = list.findIndex(s => s.id === supplier.id)
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...supplier }
        setStoredItem(STORAGE_KEYS.SUPPLIERS, list)
        return list[idx]
      }
    }
    const newSupplier: Supplier = {
      id: list.length > 0 ? Math.max(...list.map(s => s.id)) + 1 : 1,
      name: supplier.name || '',
      mobile: supplier.mobile || '',
      email: supplier.email || '',
      gst_no: supplier.gst_no || '',
      address: supplier.address || '',
      created_at: new Date().toISOString().split('T')[0]
    }
    list.unshift(newSupplier)
    setStoredItem(STORAGE_KEYS.SUPPLIERS, list)
    return newSupplier
  },
  deleteSupplier: (id: number): void => {
    const list = DataService.getSuppliers().filter(s => s.id !== id)
    setStoredItem(STORAGE_KEYS.SUPPLIERS, list)
  },

  // Products
  getProducts: (): Product[] => getStoredItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS),
  saveProduct: (product: Partial<Product>): Product => {
    const list = DataService.getProducts()
    if (product.id) {
      const idx = list.findIndex(p => p.id === product.id)
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...product }
        setStoredItem(STORAGE_KEYS.PRODUCTS, list)
        return list[idx]
      }
    }
    const newProduct: Product = {
      id: list.length > 0 ? Math.max(...list.map(p => p.id)) + 1 : 1,
      name: product.name || '',
      category: product.category || 'General',
      unit: product.unit || 'pcs',
      price: Number(product.price) || 0,
      gst_rate: Number(product.gst_rate) || 18,
      hsn_code: product.hsn_code || '4911',
      description: product.description || ''
    }
    list.unshift(newProduct)
    setStoredItem(STORAGE_KEYS.PRODUCTS, list)
    return newProduct
  },
  deleteProduct: (id: number): void => {
    const list = DataService.getProducts().filter(p => p.id !== id)
    setStoredItem(STORAGE_KEYS.PRODUCTS, list)
  },

  // Invoices
  getInvoices: (): Invoice[] => getStoredItem<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES),
  saveInvoice: (invoice: Partial<Invoice>): Invoice => {
    const list = DataService.getInvoices()
    if (invoice.id) {
      const idx = list.findIndex(i => i.id === invoice.id)
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...invoice } as Invoice
        setStoredItem(STORAGE_KEYS.INVOICES, list)
        return list[idx]
      }
    }
    const targetType = invoice.type || 'TAX_INVOICE'
    const targetDate = invoice.date || new Date().toISOString().split('T')[0]
    const generatedNum = getNextInvoiceNumber(targetType, targetDate)
    const newInvoice: Invoice = {
      id: list.length > 0 ? Math.max(...list.map(i => i.id)) + 1 : 1,
      invoice_number: invoice.invoice_number || generatedNum,
      type: targetType,
      date: targetDate,
      customer_name: invoice.customer_name || 'Walk-in Customer',
      customer_mobile: invoice.customer_mobile || '',
      customer_gstin: invoice.customer_gstin || '',
      customer_address: invoice.customer_address || '',
      eway_bill_no: invoice.eway_bill_no || '',
      valid_for: invoice.valid_for || '30 Days',
      credit_period: invoice.credit_period || '7 Days',
      sub_total: invoice.sub_total || 0,
      cgst: invoice.cgst || 0,
      sgst: invoice.sgst || 0,
      round_off: invoice.round_off || 0,
      grand_total: invoice.grand_total || 0,
      paid_amount: invoice.paid_amount || 0,
      balance_amount: (invoice.grand_total || 0) - (invoice.paid_amount || 0),
      status: (invoice.paid_amount || 0) >= (invoice.grand_total || 0) ? 'PAID' : (invoice.paid_amount || 0) > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
      payment_mode: invoice.payment_mode || 'CASH',
      items: invoice.items || [],
      terms: invoice.terms || 'Goods once sold will not be accepted. Subject to Ahmedabad Jurisdiction.',
      created_at: new Date().toISOString().split('T')[0]
    }
    list.unshift(newInvoice)
    setStoredItem(STORAGE_KEYS.INVOICES, list)
    DataService.addActivityLog('admin', 'Invoice Created', 'Invoice Management', `Created ${newInvoice.type} ${newInvoice.invoice_number}`)
    return newInvoice
  },
  deleteInvoice: (id: number): void => {
    const list = DataService.getInvoices().filter(i => i.id !== id)
    setStoredItem(STORAGE_KEYS.INVOICES, list)
  },

  // Purchases
  getPurchases: (): Purchase[] => getStoredItem<Purchase[]>(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES),
  savePurchase: (purchase: Partial<Purchase>): Purchase => {
    const list = DataService.getPurchases()
    if (purchase.id) {
      const idx = list.findIndex(p => p.id === purchase.id)
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...purchase } as Purchase
        setStoredItem(STORAGE_KEYS.PURCHASES, list)
        return list[idx]
      }
    }
    const newPurchase: Purchase = {
      id: list.length > 0 ? Math.max(...list.map(p => p.id)) + 1 : 1,
      purchase_number: purchase.purchase_number || `PUR-2627-${String(list.length + 15).padStart(3, '0')}`,
      supplier_name: purchase.supplier_name || 'Vendor',
      supplier_mobile: purchase.supplier_mobile || '',
      supplier_gstin: purchase.supplier_gstin || '',
      date: purchase.date || new Date().toISOString().split('T')[0],
      total_amount: purchase.total_amount || 0,
      paid_amount: purchase.paid_amount || 0,
      balance_amount: (purchase.total_amount || 0) - (purchase.paid_amount || 0),
      status: (purchase.paid_amount || 0) >= (purchase.total_amount || 0) ? 'PAID' : (purchase.paid_amount || 0) > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
      items: purchase.items || [],
      notes: purchase.notes || '',
      created_at: new Date().toISOString().split('T')[0]
    }
    list.unshift(newPurchase)
    setStoredItem(STORAGE_KEYS.PURCHASES, list)
    return newPurchase
  },
  deletePurchase: (id: number): void => {
    const list = DataService.getPurchases().filter(p => p.id !== id)
    setStoredItem(STORAGE_KEYS.PURCHASES, list)
  },
  recordPurchasePayment: (purchaseId: number, addPaidAmount: number): Purchase | null => {
    const list = DataService.getPurchases()
    const idx = list.findIndex(p => p.id === purchaseId)
    if (idx !== -1) {
      const pur = list[idx]
      const newPaid = (Number(pur.paid_amount) || 0) + Number(addPaidAmount)
      const newBalance = Math.max(0, Number(pur.total_amount) - newPaid)
      const newStatus = newPaid >= Number(pur.total_amount) ? 'PAID' : newPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID'

      list[idx] = {
        ...pur,
        paid_amount: newPaid,
        balance_amount: newBalance,
        status: newStatus
      }
      setStoredItem(STORAGE_KEYS.PURCHASES, list)
      return list[idx]
    }
    return null
  },

  // Payments
  getPayments: (): PaymentRecord[] => getStoredItem<PaymentRecord[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS),
  recordPayment: (payment: Partial<PaymentRecord>): PaymentRecord => {
    const list = DataService.getPayments()
    const newPayment: PaymentRecord = {
      id: list.length > 0 ? Math.max(...list.map(p => p.id)) + 1 : 1,
      invoice_id: payment.invoice_id || 0,
      invoice_number: payment.invoice_number || '',
      invoice_type: payment.invoice_type || 'TAX_INVOICE',
      customer_name: payment.customer_name || '',
      date: payment.date || new Date().toISOString().split('T')[0],
      amount: Number(payment.amount) || 0,
      payment_type: payment.payment_type || 'CASH',
      notes: payment.notes || '',
      created_at: new Date().toISOString().split('T')[0]
    }
    list.unshift(newPayment)
    setStoredItem(STORAGE_KEYS.PAYMENTS, list)

    // Update corresponding invoice payment status
    if (payment.invoice_id) {
      const invoices = DataService.getInvoices()
      const inv = invoices.find(i => i.id === payment.invoice_id)
      if (inv) {
        inv.paid_amount += newPayment.amount
        inv.balance_amount = Math.max(0, inv.grand_total - inv.paid_amount)
        inv.status = inv.balance_amount === 0 ? 'PAID' : 'PARTIALLY_PAID'
        setStoredItem(STORAGE_KEYS.INVOICES, invoices)
      }
    }
    DataService.addActivityLog('admin', 'Payment Recorded', 'Payment Module', `Recorded payment ₹${newPayment.amount} for ${newPayment.invoice_number}`)
    return newPayment
  },

  // Tasks
  getTasks: (): TaskItem[] => getStoredItem<TaskItem[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS),
  saveTask: (task: Partial<TaskItem>): TaskItem => {
    const list = DataService.getTasks()
    if (task.id) {
      const idx = list.findIndex(t => t.id === task.id)
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...task } as TaskItem
        setStoredItem(STORAGE_KEYS.TASKS, list)
        return list[idx]
      }
    }
    const newTask: TaskItem = {
      id: list.length > 0 ? Math.max(...list.map(t => t.id)) + 1 : 1,
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'MEDIUM',
      status: task.status || 'PENDING',
      assigned_to: task.assigned_to || 'Unassigned',
      start_date: task.start_date || new Date().toISOString().split('T')[0],
      due_date: task.due_date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString().split('T')[0]
    }
    list.unshift(newTask)
    setStoredItem(STORAGE_KEYS.TASKS, list)
    return newTask
  },
  deleteTask: (id: number): void => {
    const list = DataService.getTasks().filter(t => t.id !== id)
    setStoredItem(STORAGE_KEYS.TASKS, list)
  },

  // Users
  getUsers: (): SystemUser[] => getStoredItem<SystemUser[]>(STORAGE_KEYS.USERS, INITIAL_USERS),
  saveUser: (user: Partial<SystemUser>): SystemUser => {
    const list = DataService.getUsers()
    if (user.id) {
      const idx = list.findIndex(u => u.id === user.id)
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...user } as SystemUser
        setStoredItem(STORAGE_KEYS.USERS, list)
        return list[idx]
      }
    }
    const newUser: SystemUser = {
      id: list.length > 0 ? Math.max(...list.map(u => u.id)) + 1 : 1,
      full_name: user.full_name || '',
      username: user.username || '',
      role: user.role || 'Operator',
      status: user.status || 'ACTIVE',
      last_login: 'Never'
    }
    list.unshift(newUser)
    setStoredItem(STORAGE_KEYS.USERS, list)
    return newUser
  },

  // Logs
  getActivityLogs: (): ActivityLogItem[] => getStoredItem<ActivityLogItem[]>(STORAGE_KEYS.LOGS, INITIAL_LOGS),
  addActivityLog: (username: string, action: string, module: string, detail: string): void => {
    const list = DataService.getActivityLogs()
    const newLog: ActivityLogItem = {
      id: list.length > 0 ? Math.max(...list.map(l => l.id)) + 1 : 1,
      username,
      action,
      module,
      detail,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    }
    list.unshift(newLog)
    setStoredItem(STORAGE_KEYS.LOGS, list)
  },

  // ── Backup & Drive Save Functions ──────────────────────────────────
  exportAllData: () => {
    const invoices = DataService.getInvoices()
    const customers = DataService.getCustomers()
    const suppliers = DataService.getSuppliers()
    const products = DataService.getProducts()
    const purchases = DataService.getPurchases()
    const payments = DataService.getPayments()
    const tasks = DataService.getTasks()
    const users = DataService.getUsers()
    const logs = DataService.getActivityLogs()

    const totalSales = invoices.reduce((sum, i) => sum + (i.grand_total || 0), 0)
    const totalOutstanding = invoices.reduce((sum, i) => sum + (i.balance_amount || 0), 0)

    return {
      appName: 'Viral Print Media Management Software',
      systemVersion: '1.0.0',
      exportDate: new Date().toISOString(),
      financialYear: getIndianFinancialYear(),
      metrics: {
        totalInvoices: invoices.length,
        totalSales,
        totalOutstanding,
        totalCustomers: customers.length,
        totalSuppliers: suppliers.length,
        totalProducts: products.length,
        totalPurchases: purchases.length,
        totalPayments: payments.length,
        totalTasks: tasks.length
      },
      data: {
        invoices,
        customers,
        suppliers,
        products,
        purchases,
        payments,
        tasks,
        users,
        activity_logs: logs
      }
    }
  },

  saveBackupToFileDrive: async (customFilename?: string): Promise<{ success: boolean; filename: string; method: 'drive_picker' | 'download' }> => {
    const res = await DataService.exportAllDataToExcel(customFilename)
    return { success: true, filename: res.filename, method: 'download' }
  },


  exportAllDataToExcel: async (customFilename?: string): Promise<{ success: boolean; filename: string; method: 'drive_picker' | 'download' }> => {
    const invoices = DataService.getInvoices()
    const customers = DataService.getCustomers()
    const suppliers = DataService.getSuppliers()
    const products = DataService.getProducts()
    const purchases = DataService.getPurchases()
    const payments = DataService.getPayments()

    const wb = XLSX.utils.book_new()

    // Sheet 1: Invoices & Bills Overview
    const invoiceRows = invoices.map(inv => ({
      'Invoice Number': inv.invoice_number,
      'Type': inv.type,
      'Date': inv.date,
      'Customer Name': inv.customer_name,
      'Customer Mobile': inv.customer_mobile || '',
      'Customer GSTIN': inv.customer_gstin || '',
      'Billing Address': inv.customer_address || '',
      'E-Way Bill No': inv.eway_bill_no || '',
      'Sub Total (₹)': inv.sub_total || 0,
      'CGST (₹)': inv.cgst || 0,
      'SGST (₹)': inv.sgst || 0,
      'Round Off (₹)': inv.round_off || 0,
      'Grand Total (₹)': inv.grand_total || 0,
      'Paid Amount (₹)': inv.paid_amount || 0,
      'Balance (₹)': inv.balance_amount || 0,
      'Status': inv.status,
      'Payment Mode': inv.payment_mode || 'CASH'
    }))
    const wsInvoices = XLSX.utils.json_to_sheet(invoiceRows)
    XLSX.utils.book_append_sheet(wb, wsInvoices, 'Invoices & Bills')

    // Sheet 2: Item Level Breakdown
    const itemRows: any[] = []
    invoices.forEach(inv => {
      (inv.items || []).forEach(it => {
        const qty = Number(it.qty) || 0
        const rate = Number(it.rate) || 0
        const base = qty * rate
        const taxPct = Number(it.tax_percent) || 0
        const taxAmt = (base * taxPct) / 100
        itemRows.push({
          'Invoice Number': inv.invoice_number,
          'Bill Type': inv.type,
          'Date': inv.date,
          'Customer Name': inv.customer_name,
          'Item Description': it.description,
          'HSN Code': it.hsn || '',
          'Quantity': qty,
          'Rate (₹)': rate,
          'Taxable Value (₹)': base,
          'GST %': taxPct,
          'GST Amount (₹)': taxAmt,
          'Total Amount (₹)': base + taxAmt
        })
      })
    })
    const wsItems = XLSX.utils.json_to_sheet(itemRows)
    XLSX.utils.book_append_sheet(wb, wsItems, 'Bill Items Breakdown')

    // Sheet 3: Customer Directory & Ledgers
    const customerRows = customers.map(c => ({
      'Customer Name': c.name,
      'Mobile': c.mobile || '',
      'Email': c.email || '',
      'GSTIN': c.gst_no || '',
      'Billing Address': c.billing_address || '',
      'Outstanding Balance (₹)': c.outstanding_balance || 0,
      'Created Date': c.created_at || ''
    }))
    const wsCustomers = XLSX.utils.json_to_sheet(customerRows)
    XLSX.utils.book_append_sheet(wb, wsCustomers, 'Customer Directory')

    // Sheet 4: Payment History
    const paymentRows = payments.map(p => ({
      'Payment ID': p.id,
      'Invoice Number': p.invoice_number,
      'Bill Type': p.invoice_type,
      'Customer Name': p.customer_name,
      'Date': p.date,
      'Amount (₹)': p.amount,
      'Payment Mode': p.payment_type,
      'Notes': p.notes || ''
    }))
    const wsPayments = XLSX.utils.json_to_sheet(paymentRows)
    XLSX.utils.book_append_sheet(wb, wsPayments, 'Payment History')

    // Sheet 5: Products & Rates Catalog
    const productRows = products.map(p => ({
      'Product Name': p.name,
      'Category': p.category || '',
      'Unit': p.unit || 'pcs',
      'Price (₹)': p.price,
      'GST Rate (%)': p.gst_rate,
      'HSN Code': p.hsn_code || '',
      'Description': p.description || ''
    }))
    const wsProducts = XLSX.utils.json_to_sheet(productRows)
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Products & Rates')

    // Sheet 6: Stock Purchases
    const purchaseRows = purchases.map(p => ({
      'Purchase Number': p.purchase_number,
      'Supplier Name': p.supplier_name,
      'Supplier Mobile': p.supplier_mobile || '',
      'Date': p.date,
      'Total Amount (₹)': p.total_amount || 0,
      'Paid Amount (₹)': p.paid_amount || 0,
      'Balance (₹)': p.balance_amount || 0,
      'Status': p.status,
      'Notes': p.notes || ''
    }))
    const wsPurchases = XLSX.utils.json_to_sheet(purchaseRows)
    XLSX.utils.book_append_sheet(wb, wsPurchases, 'Stock Purchases')

    // Sheet 7: Suppliers & Vendors Directory
    const supplierRows = suppliers.map(s => ({
      'Supplier Name': s.name,
      'Mobile': s.mobile || '',
      'Email': s.email || '',
      'GSTIN': s.gst_no || '',
      'Address': s.address || '',
      'Created Date': s.created_at || ''
    }))
    const wsSuppliers = XLSX.utils.json_to_sheet(supplierRows)
    XLSX.utils.book_append_sheet(wb, wsSuppliers, 'Suppliers & Vendors')

    const today = new Date().toISOString().split('T')[0]
    const filename = customFilename || `VPM_ALL_BILLS_EXCEL_BACKUP_${today}.xlsx`

    // Option A: Save via showSaveFilePicker if available
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: 'Excel Spreadsheet (*.xlsx)',
              accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
            }
          ]
        })
        const writable = await handle.createWritable()
        await writable.write(excelBuffer)
        await writable.close()
        DataService.addActivityLog('admin', 'Excel Backup Saved to Drive', 'Backup Module', `Excel backup saved to drive: ${handle.name}`)
        return { success: true, filename: handle.name, method: 'drive_picker' }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          throw new Error('Excel save cancelled.')
        }
        console.warn('[DataService] Excel file picker fallback triggered:', err)
      }
    }

    // Option B: Fallback download via XLSX.writeFile
    XLSX.writeFile(wb, filename)
    DataService.addActivityLog('admin', 'Excel Backup Downloaded', 'Backup Module', `Excel backup downloaded: ${filename}`)
    return { success: true, filename, method: 'download' }
  },

  importBackupData: (backupObj: any): { success: boolean; message: string; counts: Record<string, number> } => {
    if (!backupObj || typeof backupObj !== 'object') {
      throw new Error('Invalid backup file payload.')
    }

    const payload = backupObj.data || backupObj

    const counts: Record<string, number> = {}

    if (Array.isArray(payload.invoices)) {
      setStoredItem(STORAGE_KEYS.INVOICES, payload.invoices)
      counts.invoices = payload.invoices.length
    }
    if (Array.isArray(payload.customers)) {
      setStoredItem(STORAGE_KEYS.CUSTOMERS, payload.customers)
      counts.customers = payload.customers.length
    }
    if (Array.isArray(payload.suppliers)) {
      setStoredItem(STORAGE_KEYS.SUPPLIERS, payload.suppliers)
      counts.suppliers = payload.suppliers.length
    }
    if (Array.isArray(payload.products)) {
      setStoredItem(STORAGE_KEYS.PRODUCTS, payload.products)
      counts.products = payload.products.length
    }
    if (Array.isArray(payload.purchases)) {
      setStoredItem(STORAGE_KEYS.PURCHASES, payload.purchases)
      counts.purchases = payload.purchases.length
    }
    if (Array.isArray(payload.payments)) {
      setStoredItem(STORAGE_KEYS.PAYMENTS, payload.payments)
      counts.payments = payload.payments.length
    }
    if (Array.isArray(payload.tasks)) {
      setStoredItem(STORAGE_KEYS.TASKS, payload.tasks)
      counts.tasks = payload.tasks.length
    }
    if (Array.isArray(payload.users)) {
      setStoredItem(STORAGE_KEYS.USERS, payload.users)
      counts.users = payload.users.length
    }
    if (Array.isArray(payload.activity_logs)) {
      setStoredItem(STORAGE_KEYS.LOGS, payload.activity_logs)
      counts.activity_logs = payload.activity_logs.length
    }

    DataService.addActivityLog('admin', 'Database Restored', 'Backup Module', 'Restored complete system database from backup file.')

    return {
      success: true,
      message: 'Backup successfully restored!',
      counts
    }
  },

  importExcelBackupData: (workbook: XLSX.WorkBook): { success: boolean; message: string; counts: Record<string, number> } => {
    const counts: Record<string, number> = {}

    // Sheet 1: Invoices & Bills
    const invoiceSheet = workbook.Sheets['Invoices & Bills'] || workbook.Sheets[workbook.SheetNames[0]]
    if (invoiceSheet) {
      const rawRows: any[] = XLSX.utils.sheet_to_json(invoiceSheet)
      const invoices: Invoice[] = rawRows.map((r, idx) => ({
        id: idx + 1,
        invoice_number: String(r['Invoice Number'] || r['InvoiceNo'] || `VPM/26-27/${String(idx + 1).padStart(4, '0')}`),
        type: r['Type'] || 'TAX_INVOICE',
        date: String(r['Date'] || new Date().toISOString().split('T')[0]),
        customer_name: String(r['Customer Name'] || 'Walk-in Customer'),
        customer_mobile: String(r['Customer Mobile'] || ''),
        customer_gstin: String(r['Customer GSTIN'] || ''),
        customer_address: String(r['Billing Address'] || ''),
        eway_bill_no: String(r['E-Way Bill No'] || ''),
        sub_total: Number(r['Sub Total (₹)']) || 0,
        cgst: Number(r['CGST (₹)']) || 0,
        sgst: Number(r['SGST (₹)']) || 0,
        round_off: Number(r['Round Off (₹)']) || 0,
        grand_total: Number(r['Grand Total (₹)']) || 0,
        paid_amount: Number(r['Paid Amount (₹)']) || 0,
        balance_amount: Number(r['Balance (₹)']) || 0,
        status: r['Status'] || 'PAID',
        payment_mode: r['Payment Mode'] || 'CASH',
        items: [
          {
            description: 'Printing Services',
            hsn: '4911',
            qty: 1,
            rate: Number(r['Sub Total (₹)']) || 0,
            tax_percent: 18,
            amount: Number(r['Sub Total (₹)']) || 0
          }
        ],
        created_at: String(r['Date'] || new Date().toISOString().split('T')[0])
      }))
      if (invoices.length > 0) {
        setStoredItem(STORAGE_KEYS.INVOICES, invoices)
        counts.invoices = invoices.length
      }
    }

    // Sheet 3: Customer Directory
    const custSheet = workbook.Sheets['Customer Directory']
    if (custSheet) {
      const rawCusts: any[] = XLSX.utils.sheet_to_json(custSheet)
      const customers: Customer[] = rawCusts.map((c, idx) => ({
        id: idx + 1,
        name: String(c['Customer Name'] || `Customer ${idx + 1}`),
        mobile: String(c['Mobile'] || ''),
        email: String(c['Email'] || ''),
        gst_no: String(c['GSTIN'] || ''),
        billing_address: String(c['Billing Address'] || ''),
        shipping_address: String(c['Billing Address'] || ''),
        outstanding_balance: Number(c['Outstanding Balance (₹)']) || 0,
        created_at: String(c['Created Date'] || new Date().toISOString().split('T')[0])
      }))
      if (customers.length > 0) {
        setStoredItem(STORAGE_KEYS.CUSTOMERS, customers)
        counts.customers = customers.length
      }
    }

    // Sheet 5: Products & Rates
    const prodSheet = workbook.Sheets['Products & Rates']
    if (prodSheet) {
      const rawProds: any[] = XLSX.utils.sheet_to_json(prodSheet)
      const products: Product[] = rawProds.map((p, idx) => ({
        id: idx + 1,
        name: String(p['Product Name'] || `Product ${idx + 1}`),
        category: String(p['Category'] || 'General'),
        unit: String(p['Unit'] || 'pcs'),
        price: Number(p['Price (₹)']) || 0,
        gst_rate: Number(p['GST Rate (%)']) || 18,
        hsn_code: String(p['HSN Code'] || '4911'),
        description: String(p['Description'] || '')
      }))
      if (products.length > 0) {
        setStoredItem(STORAGE_KEYS.PRODUCTS, products)
        counts.products = products.length
      }
    }

    DataService.addActivityLog('admin', 'Excel Database Restored', 'Backup Module', 'Restored database from Excel backup workbook.')

    return {
      success: true,
      message: 'Excel backup successfully restored!',
      counts
    }
  },


  exportBillsCSV: (): void => {
    const invoices = DataService.getInvoices()
    const headers = [
      'Invoice Number',
      'Bill Type',
      'Date',
      'Customer Name',
      'Customer Mobile',
      'Customer GSTIN',
      'Customer Address',
      'E-Way Bill No',
      'Sub Total (₹)',
      'CGST (₹)',
      'SGST (₹)',
      'Grand Total (₹)',
      'Paid Amount (₹)',
      'Balance Amount (₹)',
      'Payment Status',
      'Payment Mode'
    ]

    const rows = invoices.map(inv => [
      `"${inv.invoice_number}"`,
      `"${inv.type}"`,
      `"${inv.date}"`,
      `"${inv.customer_name.replace(/"/g, '""')}"`,
      `"${inv.customer_mobile}"`,
      `"${inv.customer_gstin}"`,
      `"${(inv.customer_address || '').replace(/"/g, '""')}"`,
      `"${inv.eway_bill_no || ''}"`,
      inv.sub_total || 0,
      inv.cgst || 0,
      inv.sgst || 0,
      inv.grand_total || 0,
      inv.paid_amount || 0,
      inv.balance_amount || 0,
      `"${inv.status}"`,
      `"${inv.payment_mode || 'CASH'}"`
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `VPM_BILL_DATA_EXPORT_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    DataService.addActivityLog('admin', 'Bills CSV Exported', 'Backup Module', 'Exported all bill data as CSV report.')
  },

  getDailyTransactions(): DailyTransaction[] {
    try {
      const raw = localStorage.getItem('vpm_daily_transactions')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  },

  saveDailyTransaction(tx: Partial<DailyTransaction>): DailyTransaction {
    const list = this.getDailyTransactions()
    let savedTx: DailyTransaction
    if (tx.id) {
      const idx = list.findIndex(t => t.id === tx.id)
      if (idx !== -1) {
        savedTx = { ...list[idx], ...tx } as DailyTransaction
        list[idx] = savedTx
      } else {
        savedTx = { id: Date.now(), ...tx } as DailyTransaction
        list.push(savedTx)
      }
    } else {
      savedTx = {
        id: Date.now(),
        type: tx.type || 'EXPENSE',
        category: tx.category || 'General',
        amount: tx.amount || 0,
        payment_mode: tx.payment_mode || 'CASH',
        date: tx.date || new Date().toISOString().split('T')[0],
        time: tx.time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        notes: tx.notes || '',
        created_at: new Date().toISOString(),
        ...tx
      } as DailyTransaction
      list.push(savedTx)
    }
    localStorage.setItem('vpm_daily_transactions', JSON.stringify(list))
    return savedTx
  },

  deleteDailyTransaction(id: number): void {
    const list = this.getDailyTransactions().filter(t => t.id !== id)
    localStorage.setItem('vpm_daily_transactions', JSON.stringify(list))
  }
}

