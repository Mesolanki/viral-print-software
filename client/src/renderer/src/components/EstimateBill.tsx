import React, { useState, useRef, useCallback, useEffect } from 'react'
import * as XLSX from 'xlsx'
import html2pdf from 'html2pdf.js'
import {
  Plus,
  Trash2,
  Printer,
  RefreshCw,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Search,
  CheckCircle2,
  Save,
  Package,
  PackagePlus,
  ExternalLink,
  Copy,
  FileCheck,
  X,
  Boxes,
  FileText,
  UserCheck,
  Layers,
  Truck,
  ShieldCheck,
  FileDown,
  HardDrive,
  Download,
  History as HistoryIcon,
  FileSpreadsheet,
  MessageCircle,
  Mail
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { customersApi, productsApi, type CustomerData } from '../api/apiClient'
import { getNextInvoiceNumber, DataService, type Invoice } from '../services/dataService'
import { manojMehtaQrBase64 } from '../assets/manojMehtaQrBase64'
import viralLogo from '../assets/logo_viral.png'
import './EstimateBill.css'

// ── GST State Dictionary ──────────────────────────────────────
const GST_STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
  '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan',
  '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
  '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram', '16': 'Tripura',
  '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal', '20': 'Jharkhand',
  '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '25': 'Daman & Diu', '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra',
  '28': 'Andhra Pradesh', '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep',
  '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman & Nicobar',
  '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh'
}

export type BillFormatType = 'TAX_INVOICE' | 'QUOTATION' | 'ESTIMATE'

interface BillItem {
  id: number
  description: string
  hsn: string
  unit: string
  qty: string
  rate: string
  gstPct: string
  width?: string
  height?: string
  showSizeCalc?: boolean
}

interface ProductItem {
  id: number
  name: string
  unit: string
  price: number | string
  gst_rate: number | string
  hsn?: string
}

const DEFAULT_PRINTING_PRODUCTS: ProductItem[] = [
  { id: 9001, name: 'Flex Banner Printing (Normal)', unit: 'sqft', price: 12, gst_rate: 18, hsn: '9983' },
  { id: 9002, name: 'Star Flex Banner Printing (HD)', unit: 'sqft', price: 18, gst_rate: 18, hsn: '9983' },
  { id: 9003, name: 'Backlit Board Printing', unit: 'sqft', price: 35, gst_rate: 18, hsn: '9983' },
  { id: 9004, name: 'Vinyl Sticker Printing (Glossy/Matte)', unit: 'sqft', price: 25, gst_rate: 18, hsn: '9983' },
  { id: 9005, name: 'Vinyl with Sunboard Printing (3mm/5mm)', unit: 'sqft', price: 55, gst_rate: 18, hsn: '9983' },
  { id: 9006, name: 'One Way Vision Sticker', unit: 'sqft', price: 35, gst_rate: 18, hsn: '9983' },
  { id: 9007, name: 'Roll Up Standee (6x3 ft Complete)', unit: 'pcs', price: 1200, gst_rate: 18, hsn: '9983' },
  { id: 9008, name: 'Canopy Promotion Tent (4x4 ft)', unit: 'pcs', price: 3500, gst_rate: 18, hsn: '9983' },
  { id: 9009, name: 'Visiting Cards (350 GSM Velvet 1000 Pcs)', unit: 'box', price: 750, gst_rate: 18, hsn: '4911' },
  { id: 9010, name: 'Visiting Cards (Non-Tearable 1000 Pcs)', unit: 'box', price: 1200, gst_rate: 18, hsn: '4911' },
  { id: 9011, name: 'Letterhead Printing (A4 100 GSM 500 Pcs)', unit: 'pcs', price: 1500, gst_rate: 18, hsn: '4911' },
  { id: 9012, name: 'Pamphlet Printing (A4 Glossy 130 GSM 1000 Pcs)', unit: 'pcs', price: 1800, gst_rate: 18, hsn: '4911' },
  { id: 9013, name: 'Brochure Printing (Tri-fold 170 GSM)', unit: 'pcs', price: 8, gst_rate: 18, hsn: '4911' },
  { id: 9014, name: 'Bill Book Printing (Duplicate 50 Sets)', unit: 'book', price: 150, gst_rate: 18, hsn: '4820' },
  { id: 9015, name: 'Estimate Slip Book (Triplicate 50 Sets)', unit: 'book', price: 180, gst_rate: 18, hsn: '4820' },
  { id: 9016, name: 'Rubber Stamp (Self Inking Dater)', unit: 'pcs', price: 250, gst_rate: 18, hsn: '9611' },
  { id: 9017, name: 'Lanyard & PVC ID Card Printing', unit: 'pcs', price: 65, gst_rate: 18, hsn: '3926' },
  { id: 9018, name: 'Custom Photo Mug Printing', unit: 'pcs', price: 150, gst_rate: 18, hsn: '6912' },
  { id: 9019, name: 'Custom Printed T-Shirt', unit: 'pcs', price: 280, gst_rate: 18, hsn: '6109' },
  { id: 9020, name: 'Acrylic 3D LED Letter Board', unit: 'sqft', price: 220, gst_rate: 18, hsn: '9405' },
  { id: 9021, name: 'Neon Sign Board Custom', unit: 'sqft', price: 180, gst_rate: 18, hsn: '9405' },
]

interface CompanyDetails {
  name: string
  address: string
  phone: string
  email: string
  gstNo: string
  panNo: string
  state: string
  stateCode: string
  bankName: string
  accountNo: string
  ifsc: string
  branch: string
}

// ── Number → Words ────────────────────────────────────────────
const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
]
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function numToWords(n: number): string {
  if (n === 0) return 'Zero'
  if (n < 0) return 'Minus ' + numToWords(-n)

  let words = ''
  if (Math.floor(n / 10000000) > 0) {
    words += numToWords(Math.floor(n / 10000000)) + ' Crore '
    n %= 10000000
  }
  if (Math.floor(n / 100000) > 0) {
    words += numToWords(Math.floor(n / 100000)) + ' Lakh '
    n %= 100000
  }
  if (Math.floor(n / 1000) > 0) {
    words += numToWords(Math.floor(n / 1000)) + ' Thousand '
    n %= 1000
  }
  if (Math.floor(n / 100) > 0) {
    words += numToWords(Math.floor(n / 100)) + ' Hundred '
    n %= 100
  }
  if (n > 0) {
    if (n < 20) words += ones[n] + ' '
    else words += tens[Math.floor(n / 10)] + ' ' + ones[n % 10] + ' '
  }
  return words.trim()
}

function amountInWords(amount: number): string {
  const rupees = Math.floor(amount)
  const paise  = Math.round((amount - rupees) * 100)
  let result   = numToWords(rupees) + ' Rupees'
  if (paise > 0) result += ' and ' + numToWords(paise) + ' Paise'
  return result + ' Only'
}

const fmt = (n: number) => n.toFixed(2)

// Exact company defaults matching the PDF
const defaultCompany: CompanyDetails = {
  name: 'VIRAL PRINT MEDIA',
  address: 'GF-10, 13, 14, Satyamev Arcade, Highway Road, Chandkheda, Ahmedabad, Gujarat, 382424.',
  phone: '99799 63632 / 87809 87488',
  email: 'viralprintmedia@gmail.com',
  gstNo: '24BAAPM9783K1Z7',
  panNo: 'BAAPM9783K',
  state: 'GUJARAT',
  stateCode: '24',
  bankName: 'UCO BANK',
  accountNo: '28810210000939',
  ifsc: 'UCBA0002881',
  branch: 'Main Branch',
}

const UNITS = ['pcs', 'roll', 'sqft', 'sqmtr', 'meter', 'feet', 'inch', 'kg', 'litre', 'sheet', 'packet', 'ream', 'box', 'set', 'nos', 'bundle', 'job', 'carton', 'hr', 'Other']
const GST_RATES = ['0', '5', '12', '18', '28']

let _itemId = 1
const newItem = (): BillItem => ({
  id: _itemId++,
  description: '',
  hsn: '9983',
  unit: 'pcs',
  qty: '1',
  rate: '',
  gstPct: '18',
})

interface Props {
  theme: 'dark' | 'light'
  formatType?: BillFormatType
  editingInvoice?: Invoice | null
  onClearEditing?: () => void
}

const EstimateBill: React.FC<Props> = ({ theme, formatType = 'TAX_INVOICE', editingInvoice = null, onClearEditing }) => {
  const { user } = useAuth()
  const billRef = useRef<HTMLDivElement>(null)

  const isDark = theme === 'dark'
  const cls = isDark ? 'theme-dark' : 'theme-light'

  // ── Customizable Footer, UPI, Terms & Signatory Settings ──
  const [isFooterSettingsOpen, setIsFooterSettingsOpen] = useState(false)

  const [bankName, setBankName]             = useState(() => localStorage.getItem('vpm_bank_name') || 'UCO BANK')
  const [accountNo, setAccountNo]           = useState(() => localStorage.getItem('vpm_bank_acc') || '28810210000939')
  const [ifsc, setIfsc]                     = useState(() => localStorage.getItem('vpm_bank_ifsc') || 'UCBA0002881')

  const [upiAccountName, setUpiAccountName] = useState(() => localStorage.getItem('vpm_upi_name') || 'Manoj Mehta')
  const [upiMobile, setUpiMobile]           = useState(() => localStorage.getItem('vpm_upi_mobile') || '+91 98980 15205')
  const [upiId, setUpiId]                   = useState(() => localStorage.getItem('vpm_upi_id') || '9898015205@okbizaxis')
  const [upiApps, setUpiApps]               = useState(() => localStorage.getItem('vpm_upi_apps') || 'GPay • Paytm • PhonePe • BHIM')
  const [qrCodeImg, setQrCodeImg]           = useState(() => localStorage.getItem('vpm_custom_qr') || manojMehtaQrBase64)

  const [termsList, setTermsList]           = useState<string[]>(() => {
    const saved = localStorage.getItem('vpm_terms_list')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      } catch {}
    }
    return [
      'Goods once sold will not be accepted.',
      'Subject to Ahmedabad Jurisdiction.'
    ]
  })

  const [signatoryCompany, setSignatoryCompany] = useState(() => localStorage.getItem('vpm_sig_company') || 'For, VIRAL PRINT MEDIA')
  const [signatoryTitle, setSignatoryTitle]     = useState(() => localStorage.getItem('vpm_sig_title') || 'Authorised Signatory')

  useEffect(() => { localStorage.setItem('vpm_bank_name', bankName) }, [bankName])
  useEffect(() => { localStorage.setItem('vpm_bank_acc', accountNo) }, [accountNo])
  useEffect(() => { localStorage.setItem('vpm_bank_ifsc', ifsc) }, [ifsc])
  useEffect(() => { localStorage.setItem('vpm_upi_name', upiAccountName) }, [upiAccountName])
  useEffect(() => { localStorage.setItem('vpm_upi_mobile', upiMobile) }, [upiMobile])
  useEffect(() => { localStorage.setItem('vpm_upi_id', upiId) }, [upiId])
  useEffect(() => { localStorage.setItem('vpm_upi_apps', upiApps) }, [upiApps])
  useEffect(() => { localStorage.setItem('vpm_terms_list', JSON.stringify(termsList)) }, [termsList])
  useEffect(() => { localStorage.setItem('vpm_sig_company', signatoryCompany) }, [signatoryCompany])
  useEffect(() => { localStorage.setItem('vpm_sig_title', signatoryTitle) }, [signatoryTitle])

  const updateTerm = (index: number, val: string) => {
    setTermsList(prev => {
      const copy = [...prev]
      copy[index] = val
      return copy
    })
  }

  const addTerm = () => {
    setTermsList(prev => [...prev, ''])
  }

  const removeTerm = (index: number) => {
    setTermsList(prev => prev.filter((_, i) => i !== index))
  }

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        if (base64) {
          setQrCodeImg(base64)
          localStorage.setItem('vpm_custom_qr', base64)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const resetQrCode = () => {
    setQrCodeImg(manojMehtaQrBase64)
    localStorage.removeItem('vpm_custom_qr')
  }

  // Company details
  const company: CompanyDetails = {
    ...defaultCompany,
    name: user?.company?.name || defaultCompany.name,
    gstNo: user?.company?.gstNumber || defaultCompany.gstNo,
    address: user?.company?.address || defaultCompany.address,
    phone: user?.company?.phone || defaultCompany.phone,
    bankName: bankName,
    accountNo: accountNo,
    ifsc: ifsc,
  }

  // ── State ──
  const [billType, setBillType] = useState<BillFormatType>(formatType)
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(editingInvoice?.id || null)

  useEffect(() => {
    setBillType(formatType)
  }, [formatType])

  const [billDate, setBillDate]     = useState(() => new Date().toISOString().split('T')[0])
  const [billTime]                  = useState(() => new Date().toLocaleTimeString('en-US', { hour12: true }))
  const [billNo, setBillNo]         = useState(() => getNextInvoiceNumber(formatType))
  const [ewayBillNo, setEwayBillNo] = useState('')
  const [vehicleNo, setVehicleNo]   = useState('')
  const [transporterName, setTransporterName] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [validFor, setValidFor]     = useState('15 Days')
  const [creditPeriod, setCreditPeriod] = useState('30 Days')

  // Save Success Notification state
  const [saveInvoiceMsg, setSaveInvoiceMsg] = useState<string | null>(null)

  // Previous Bill History Modal state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)

  // Load Invoice data helper
  const loadInvoiceData = useCallback((inv: Invoice) => {
    setEditingInvoiceId(inv.id)
    setBillType(inv.type)
    setBillNo(inv.invoice_number)
    if (inv.date) setBillDate(inv.date)
    setCustName(inv.customer_name || '')
    setCustMobile(inv.customer_mobile || '')
    setCustGst(inv.customer_gstin || '')
    setCustAddress(inv.customer_address || '')
    setEwayBillNo(inv.eway_bill_no || '')
    setVehicleNo(inv.vehicle_no || '')
    setTransporterName(inv.transporter_name || '')
    if (inv.distance_km) setDistanceKm(String(inv.distance_km))
    if (inv.valid_for) setValidFor(inv.valid_for)
    if (inv.credit_period) setCreditPeriod(inv.credit_period)

    if (inv.items && inv.items.length > 0) {
      setItems(inv.items.map((it) => ({
        id: _itemId++,
        description: it.description || '',
        hsn: it.hsn || '9983',
        unit: 'pcs',
        qty: String(it.qty || 1),
        rate: String(it.rate || 0),
        gstPct: String(it.tax_percent || 18)
      })))
    }
  }, [])

  useEffect(() => {
    if (editingInvoice) {
      loadInvoiceData(editingInvoice)
    } else {
      setEditingInvoiceId(null)
      setBillType(formatType)
      setBillNo(getNextInvoiceNumber(formatType, billDate))
    }
  }, [editingInvoice, formatType, loadInvoiceData, billDate])

  // E-Way Bill Modal States (NIC Schema v1.0.0421 & Excel Prep Tool Compatible)
  const [isEwayModalOpen, setIsEwayModalOpen]         = useState(false)
  const [ewayFromPincode, setEwayFromPincode]       = useState('382424')
  const [ewayToPincode, setEwayToPincode]           = useState('380054')
  const [ewayTransMode, setEwayTransMode]           = useState('1') // 1: Road, 2: Rail, 3: Air, 4: Ship
  const [ewaySupplyType, setEwaySupplyType]         = useState('O') // O: Outward, I: Inward
  const [ewaySubSupplyType, setEwaySubSupplyType]   = useState('1') // 1: Supply, 2: Export, 7: Job Work, 12: Others
  const [ewayDocType, setEwayDocType]               = useState('INV') // INV: Invoice, CHL: Delivery Challan, BIL: Bill of Supply
  const [ewayVehicleType, setEwayVehicleType]       = useState('R') // R: Regular, O: ODC
  const [ewayTransDocNo, setEwayTransDocNo]         = useState('') // L.R. No.
  const [ewayTransDocDate, setEwayTransDocDate]     = useState('') // L.R. Date
  const [ewayJsonCopied, setEwayJsonCopied]         = useState(false)

  const genNumber = useCallback((type: BillFormatType, dateStr?: string) => {
    return getNextInvoiceNumber(type, dateStr || billDate)
  }, [billDate])

  useEffect(() => {
    setBillNo(getNextInvoiceNumber(billType, billDate))
  }, [billType, billDate])

  // Customer
  const [custName, setCustName]       = useState('')
  const [custOwner, setCustOwner]     = useState('')
  const [custMobile, setCustMobile]   = useState('')
  const [custAddress, setCustAddress] = useState('')
  const [custGst, setCustGst]         = useState('')
  const [custStateInfo, setCustStateInfo] = useState<{ state: string; stateCode: string; pan: string } | null>(null)
  const [gstStatusMsg, setGstStatusMsg]   = useState<string | null>(null)
  const [saveCustSuccess, setSaveCustSuccess] = useState(false)

  // Customer Autocomplete List
  const [customerSuggestions, setCustomerSuggestions] = useState<CustomerData[]>([])
  const [showCustDropdown, setShowCustDropdown]     = useState(false)

  // Item Manager & Catalog Pop-Up Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [activeInlineSearchId, setActiveInlineSearchId] = useState<number | null>(null)
  const [activeModalSearchId, setActiveModalSearchId] = useState<number | null>(null)
  const [activeItemSearchIndex, setActiveItemSearchIndex] = useState<number>(0)
  const [productList, setProductList] = useState<ProductItem[]>(() => {
    const localProds = DataService.getProducts().map(p => ({
      id: p.id,
      name: p.name,
      unit: p.unit || 'pcs',
      price: p.price || 0,
      gst_rate: p.gst_rate || 18,
      hsn: p.hsn_code || '9983'
    }))
    const map = new Map<string, ProductItem>()
    localProds.forEach(p => {
      if (p.name && p.name.trim()) map.set(p.name.trim().toLowerCase(), p)
    })
    DEFAULT_PRINTING_PRODUCTS.forEach(p => {
      const key = p.name.trim().toLowerCase()
      if (!map.has(key)) map.set(key, p)
    })
    return Array.from(map.values())
  })

  // Import Estimate Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [copiedEway, setCopiedEway] = useState(false)

  // Advance Payment (For Simple Estimate Format)
  const [advanceAmt, setAdvanceAmt]   = useState('')

  // Items
  const [items, setItems] = useState<BillItem[]>([newItem()])

  // Preview Zoom
  const [zoom, setZoom] = useState(0.9)

  // Load products list from DataService (user real added data first) & API on mount
  const loadProducts = useCallback(async () => {
    const localProds = DataService.getProducts().map(p => ({
      id: p.id,
      name: p.name,
      unit: p.unit || 'pcs',
      price: p.price !== undefined ? p.price : 0,
      gst_rate: p.gst_rate !== undefined ? p.gst_rate : 18,
      hsn: p.hsn_code || '9983'
    }))

    let apiProds: ProductItem[] = []
    try {
      const res = await productsApi.getAll(1)
      const rawData = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      if (Array.isArray(rawData) && rawData.length > 0) {
        apiProds = rawData.map((p: any) => ({
          id: p.id,
          name: p.name,
          unit: p.unit || 'pcs',
          price: p.price !== undefined ? p.price : 0,
          gst_rate: p.gst_rate !== undefined ? p.gst_rate : 18,
          hsn: p.hsn_code || p.hsn || '9983'
        }))
      }
    } catch {}

    const map = new Map<string, ProductItem>()
    // 1. Add real local user-added products FIRST
    localProds.forEach(p => {
      if (p.name && p.name.trim()) map.set(p.name.trim().toLowerCase(), p)
    })
    // 2. Add API products SECOND
    apiProds.forEach(p => {
      if (p.name && p.name.trim()) map.set(p.name.trim().toLowerCase(), p)
    })
    // 3. Add default catalog items THIRD if not already present
    DEFAULT_PRINTING_PRODUCTS.forEach(p => {
      const key = p.name.trim().toLowerCase()
      if (!map.has(key)) map.set(key, p)
    })
    setProductList(Array.from(map.values()))
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // ── GST Auto-Fetch Function (Company, Owner Name, Phone, Address) ──
  const handleGstChange = async (val: string) => {
    const cleanGst = val.toUpperCase().trim()
    setCustGst(cleanGst)
    setGstStatusMsg(null)

    if (cleanGst.length >= 2) {
      const code = cleanGst.substring(0, 2)
      const stateName = GST_STATE_CODES[code]
      const pan = cleanGst.length >= 12 ? cleanGst.substring(2, 12) : ''

      if (stateName) {
        setCustStateInfo({ state: stateName, stateCode: code, pan })
      } else {
        setCustStateInfo(null)
      }
    } else {
      setCustStateInfo(null)
    }

    if (cleanGst.length >= 5) {
      // 1. Check local offline database first
      const localResult = DataService.lookupGst(cleanGst)
      if (localResult.existingCustomer) {
        const c = localResult.existingCustomer
        setCustName(c.name || '')
        if (c.mobile) setCustMobile(c.mobile)
        if (c.billing_address) setCustAddress(c.billing_address)
        setGstStatusMsg(`✅ Customer Found: ${c.name}`)
        return
      }

      // 2. Try online API lookup
      try {
        const res = await customersApi.lookupGst(cleanGst)
        if (res.data?.data) {
          const { parsed, existingCustomer } = res.data.data

          if (existingCustomer) {
            setCustName(existingCustomer.name || '')
            if (existingCustomer.mobile) setCustMobile(existingCustomer.mobile)
            if (existingCustomer.billing_address) setCustAddress(existingCustomer.billing_address)
            setGstStatusMsg(`✅ Customer Found: ${existingCustomer.name}`)
          } else if (parsed && cleanGst.length === 15) {
            if (parsed.companyName) setCustName(parsed.companyName)
            if (parsed.ownerName) setCustOwner(parsed.ownerName)
            if (parsed.mobile) setCustMobile(parsed.mobile)
            if (parsed.address) setCustAddress(parsed.address)
            setGstStatusMsg(`⚡ Auto-Fetched GST Details: ${parsed.companyName}`)
          }
        }
      } catch {
        // Fallback to parsed local GST structure
        if (cleanGst.length === 15 && localResult.parsed) {
          const p = localResult.parsed
          if (p.companyName && !custName) setCustName(p.companyName)
          if (p.ownerName && !custOwner) setCustOwner(p.ownerName)
          if (p.mobile && !custMobile) setCustMobile(p.mobile)
          if (p.address && !custAddress) setCustAddress(p.address)
          setGstStatusMsg(`⚡ GST State & PAN Verified: ${p.stateName}`)
        }
      }
    }
  }

  // ── Customer Search Autocomplete ─────────────────────────────
  const handleCustNameChange = async (val: string) => {
    setCustName(val)
    if (val.trim().length >= 1) {
      try {
        const res = await customersApi.getAll(val.trim())
        if (res.data?.data && Array.isArray(res.data.data)) {
          setCustomerSuggestions(res.data.data)
          setShowCustDropdown(true)
        }
      } catch {}
    } else {
      setShowCustDropdown(false)
    }
  }

  const selectCustomer = (cust: CustomerData) => {
    setCustName(cust.name || '')
    setCustMobile(cust.mobile || '')
    setCustAddress(cust.billing_address || '')
    if (cust.gst_no) handleGstChange(cust.gst_no)
    setShowCustDropdown(false)
  }

  // ── Save Customer to Local Database ─────────────────────────
  const saveCustomerToDb = async () => {
    if (!custName.trim()) return
    try {
      await customersApi.save({
        name: custName.trim(),
        mobile: custMobile.trim(),
        gst_no: custGst.trim(),
        billing_address: custAddress.trim(),
      })
      setSaveCustSuccess(true)
      setTimeout(() => setSaveCustSuccess(false), 3000)
    } catch {}
  }

  // Quick Catalog Picker Modal State
  const [showCatalogPickerModal, setShowCatalogPickerModal] = useState(false)
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('')

  // ── Add Product from Catalog / Autocomplete ──────────────────
  const selectProductForItemRow = (itemId: number, prod: ProductItem) => {
    const defaultW = (prod as any).default_width ? String((prod as any).default_width) : ''
    const defaultH = (prod as any).default_height ? String((prod as any).default_height) : ''
    const wNum = parseFloat(defaultW) || 0
    const hNum = parseFloat(defaultH) || 0
    const calculatedQty = (wNum > 0 && hNum > 0) ? String(wNum * hNum) : ''
    const cleanName = prod.name.replace(/\s*\(\d+(\.\d+)?ft\s*x\s*\d+(\.\d+)?ft\)/gi, '')
    const finalDesc = (wNum > 0 && hNum > 0) ? `${cleanName} (${wNum}ft x ${hNum}ft)` : cleanName

    setItems(prev => prev.map(it => it.id === itemId ? {
      ...it,
      description: finalDesc,
      hsn: prod.hsn || (prod as any).hsn_code || '9983',
      unit: prod.unit || 'sqft',
      width: defaultW,
      height: defaultH,
      qty: calculatedQty || it.qty || '1',
      rate: String(prod.price !== undefined ? prod.price : '0'),
      gstPct: String(prod.gst_rate !== undefined ? prod.gst_rate : '18'),
      showSizeCalc: true
    } : it))
    setActiveInlineSearchId(null)
    setActiveModalSearchId(null)
    setActiveItemSearchIndex(0)
  }

  const addProductFromCatalogPicker = (prod: ProductItem) => {
    const defaultW = (prod as any).default_width ? String((prod as any).default_width) : ''
    const defaultH = (prod as any).default_height ? String((prod as any).default_height) : ''
    const wNum = parseFloat(defaultW) || 0
    const hNum = parseFloat(defaultH) || 0
    const calculatedQty = (wNum > 0 && hNum > 0) ? String(wNum * hNum) : ''
    const cleanName = prod.name.replace(/\s*\(\d+(\.\d+)?ft\s*x\s*\d+(\.\d+)?ft\)/gi, '')
    const finalDesc = (wNum > 0 && hNum > 0) ? `${cleanName} (${wNum}ft x ${hNum}ft)` : cleanName

    setItems(prev => [
      ...prev,
      {
        id: _itemId++,
        description: finalDesc,
        hsn: prod.hsn || (prod as any).hsn_code || '9983',
        unit: prod.unit || 'sqft',
        width: defaultW,
        height: defaultH,
        qty: calculatedQty || '1',
        rate: String(prod.price !== undefined ? prod.price : '0'),
        gstPct: String(prod.gst_rate !== undefined ? prod.gst_rate : '18'),
        showSizeCalc: true
      }
    ])
    setShowCatalogPickerModal(false)
  }

  const updateItemDimensions = (itemId: number, wStr: string, hStr: string) => {
    const w = parseFloat(wStr) || 0
    const h = parseFloat(hStr) || 0
    const calculatedQty = (w > 0 && h > 0) ? String((w * h).toFixed(2)) : ''
    setItems(prev => prev.map(it => {
      if (it.id !== itemId) return it
      const cleanDesc = (it.description || '').replace(/\s*\(\d+(\.\d+)?ft\s*x\s*\d+(\.\d+)?ft\)/gi, '')
      const newDesc = (w > 0 && h > 0) ? `${cleanDesc} (${w}ft x ${h}ft)` : cleanDesc
      return {
        ...it,
        width: wStr,
        height: hStr,
        qty: calculatedQty || it.qty,
        description: newDesc
      }
    }))
  }


  const getProductMatches = (queryStr: string) => {
    const q = (queryStr || '').trim().toLowerCase()
    if (!q) return productList.slice(0, 8)
    return productList.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.hsn && p.hsn.toLowerCase().includes(q))
    ).slice(0, 10)
  }

  const handleItemKeyDown = (e: React.KeyboardEvent, itemId: number, matches: ProductItem[]) => {
    if (!matches || matches.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveItemSearchIndex(prev => (prev + 1) % matches.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveItemSearchIndex(prev => (prev - 1 + matches.length) % matches.length)
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (activeItemSearchIndex >= 0 && activeItemSearchIndex < matches.length) {
        e.preventDefault()
        selectProductForItemRow(itemId, matches[activeItemSearchIndex])
      }
    } else if (e.key === 'Escape') {
      setActiveInlineSearchId(null)
      setActiveModalSearchId(null)
    }
  }



  // ── Calculations ──
  const calcRow = (item: BillItem) => {
    const qty  = parseFloat(item.qty)  || 0
    const rate = parseFloat(item.rate) || 0
    const gst  = billType === 'ESTIMATE' ? 0 : (parseFloat(item.gstPct) || 0)
    const base = qty * rate
    const gstAmt = (base * gst) / 100
    return { base, gstAmt, total: base + gstAmt, gstPct: gst }
  }

  const subtotal   = items.reduce((s, it) => s + calcRow(it).base, 0)
  const totalGst   = items.reduce((s, it) => s + calcRow(it).gstAmt, 0)
  const cgst       = totalGst / 2
  const sgst       = totalGst / 2
  const rawGrand   = subtotal + totalGst
  const roundedGrand = Math.round(rawGrand)
  const roundOff   = roundedGrand - rawGrand

  const advanceNum = parseFloat(advanceAmt) || 0
  const remainNum  = Math.max(0, roundedGrand - advanceNum)

  const isInterState = custStateInfo ? custStateInfo.stateCode !== '24' : false

  const mapUnitToNicCode = (unitStr: string): string => {
    const u = (unitStr || '').trim().toLowerCase()
    if (u.includes('sqft') || u.includes('sq.ft') || u.includes('feet')) return 'SQF'
    if (u.includes('sqmtr') || u.includes('sq.mtr') || u.includes('sqmt')) return 'SQM'
    if (u.includes('pc') || u.includes('piece')) return 'PCS'
    if (u.includes('box')) return 'BOX'
    if (u.includes('kg')) return 'KGS'
    if (u.includes('meter') || u.includes('mtr')) return 'MTR'
    if (u.includes('nos') || u.includes('no')) return 'NOS'
    if (u.includes('set')) return 'SET'
    if (u.includes('roll')) return 'ROL'
    if (u.includes('bundle')) return 'BND'
    return 'OTH'
  }

  const generateGovtEwayJsonPayload = useCallback(() => {
    const cleanGstFrom = (company.gstNo || '').replace(/[^A-Z0-9]/gi, '')
    const cleanGstTo   = custGst ? custGst.replace(/[^A-Z0-9]/gi, '') : 'URP'

    const stateCodeFrom = parseInt(company.stateCode, 10) || 24
    const stateCodeTo   = custStateInfo ? parseInt(custStateInfo.stateCode, 10) : 24

    const formattedDate = billDate ? billDate.split('-').reverse().join('/') : new Date().toLocaleDateString('en-IN')

    const itemsPayload = items.map(item => {
      const qty  = parseFloat(item.qty) || 0
      const rate = parseFloat(item.rate) || 0
      const base = qty * rate
      const gstRateNum = parseFloat(item.gstPct) || 18
      const halfRate = gstRateNum / 2

      return {
        productName: item.description || 'Printing Services',
        productDesc: item.description || 'Print Items',
        hsnCode: parseInt((item.hsn || '9983').replace(/[^0-9]/g, ''), 10) || 9983,
        quantity: qty,
        qtyUnit: mapUnitToNicCode(item.unit),
        taxableAmount: base,
        cgstRate: isInterState ? 0 : halfRate,
        sgstRate: isInterState ? 0 : halfRate,
        igstRate: isInterState ? gstRateNum : 0,
        cessRate: 0
      }
    })

    return {
      version: "1.0.0421",
      billDtls: [
        {
          userGstin: cleanGstFrom,
          supplyType: ewaySupplyType,
          subSupplyType: ewaySubSupplyType,
          docType: ewayDocType,
          docNo: billNo,
          docDate: formattedDate,
          fromGstin: cleanGstFrom,
          fromTrdName: company.name,
          fromAddr1: company.address,
          fromAddr2: "Chandkheda",
          fromPlace: "Ahmedabad",
          fromPincode: parseInt(ewayFromPincode, 10) || 382424,
          actFromStateCode: stateCodeFrom,
          fromStateCode: stateCodeFrom,
          toGstin: cleanGstTo,
          toTrdName: custName || "Walk-in Customer",
          toAddr1: custAddress || "Ahmedabad",
          toAddr2: "",
          toPlace: "Ahmedabad",
          toPincode: parseInt(ewayToPincode, 10) || 380054,
          actToStateCode: stateCodeTo,
          toStateCode: stateCodeTo,
          totalValue: subtotal,
          cgstValue: isInterState ? 0 : cgst,
          sgstValue: isInterState ? 0 : sgst,
          igstValue: isInterState ? (cgst + sgst) : 0,
          cessValue: 0,
          totInvValue: roundedGrand,
          transMode: ewayTransMode,
          transDistance: distanceKm || "25",
          transporterId: "",
          transporterName: transporterName || "",
          transDocNo: ewayTransDocNo,
          transDocDate: ewayTransDocDate,
          vehicleNo: vehicleNo ? vehicleNo.replace(/[^A-Z0-9]/gi, '').toUpperCase() : "",
          vehicleType: ewayVehicleType,
          itemList: itemsPayload
        }
      ]
    }
  }, [company, custGst, custStateInfo, billDate, items, billNo, ewayFromPincode, ewayToPincode, custName, custAddress, subtotal, isInterState, cgst, sgst, roundedGrand, ewayTransMode, distanceKm, transporterName, vehicleNo, ewaySupplyType, ewaySubSupplyType, ewayDocType, ewayTransDocNo, ewayTransDocDate, ewayVehicleType])

  const downloadGovtEwayJson = () => {
    const payload = generateGovtEwayJsonPayload()
    const jsonStr = JSON.stringify(payload, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `EWAY_BILL_${billNo.replace(/[^A-Z0-9]/gi, '_')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadGovtEwayExcelSheet = () => {
    const payload = generateGovtEwayJsonPayload()
    const b = payload.billDtls[0]

    const rows: any[] = []
    b.itemList.forEach((item, idx) => {
      rows.push({
        'Supply Type': b.supplyType,
        'Sub Supply Type': b.subSupplyType,
        'Doc Type': b.docType,
        'Doc No': b.docNo,
        'Doc Date': b.docDate,
        'From GSTIN': b.fromGstin,
        'From Trade Name': b.fromTrdName,
        'From Address 1': b.fromAddr1,
        'From Place': b.fromPlace,
        'From Pincode': b.fromPincode,
        'From State Code': b.fromStateCode,
        'To GSTIN': b.toGstin,
        'To Trade Name': b.toTrdName,
        'To Address 1': b.toAddr1,
        'To Place': b.toPlace,
        'To Pincode': b.toPincode,
        'To State Code': b.toStateCode,
        'Item Sr No': idx + 1,
        'Product Name': item.productName,
        'Product Description': item.productDesc,
        'HSN Code': item.hsnCode,
        'Quantity': item.quantity,
        'Unit': item.qtyUnit,
        'Taxable Value (Rs)': item.taxableAmount,
        'CGST Rate (%)': item.cgstRate,
        'SGST Rate (%)': item.sgstRate,
        'IGST Rate (%)': item.igstRate,
        'Cess Rate (%)': item.cessRate,
        'Total Invoice Value (Rs)': b.totInvValue,
        'Trans Mode': b.transMode,
        'Distance (Km)': b.transDistance,
        'Transporter Name': b.transporterName,
        'Vehicle No': b.vehicleNo,
        'Vehicle Type': b.vehicleType
      })
    })

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'EWB_Preparation_Sheet')
    XLSX.writeFile(workbook, `EWB_PREP_TOOL_${billNo.replace(/[^A-Z0-9]/gi, '_')}.xlsx`)
  }

  const copyGovtEwayJson = () => {
    const payload = generateGovtEwayJsonPayload()
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
    setEwayJsonCopied(true)
    setTimeout(() => setEwayJsonCopied(false), 2500)
  }

  // ── Item helpers ──
  const updateItem = useCallback((id: number, field: keyof BillItem, val: string) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: val } : it))
  }, [])

  const addBlankRow = () => setItems(prev => [...prev, newItem()])
  const delItem = (id: number) => setItems(prev => prev.filter(it => it.id !== id))

  const resetBill = () => {
    setEditingInvoiceId(null)
    onClearEditing?.()
    setCustName(''); setCustOwner(''); setCustMobile(''); setCustAddress(''); setCustGst('')
    setCustStateInfo(null); setGstStatusMsg(null)
    setItems([newItem()])
    setAdvanceAmt(''); setEwayBillNo('')
    setBillNo(genNumber(billType))
  }

  // ── E-Way Portal & Details Helper ────────────────────────────
  const openOfficialEwayPortal = () => {
    window.open('https://ewaybillgst.gov.in', '_blank')
  }

  const copyEwayDetails = () => {
    const text = `E-WAY BILL DETAILS:
Consignor GSTIN: ${company.gstNo} (${company.name})
Consignee GSTIN: ${custGst || 'URP'} (${custName || 'Customer'})
Invoice No: ${billNo} Date: ${billDate}
Sub Total: ₹${fmt(subtotal)} GST: ₹${fmt(totalGst)} Total Value: ₹${fmt(roundedGrand)}
Main HSN: 9983 (Printing / Advertising)`

    navigator.clipboard.writeText(text)
    setCopiedEway(true)
    setTimeout(() => setCopiedEway(false), 3000)
  }

  // ── Auto-Import Sample Estimate ──────────────────────────────
  const importSampleEstimate = (sampleName: string) => {
    setCustName(sampleName)
    setCustMobile('9876543210')
    setCustAddress('Shop 12, Main Market, Ahmedabad, Gujarat')
    handleGstChange('24AAACV1234A1Z5')
    setItems([
      { id: _itemId++, description: 'Vinyl Banner Print (10x4 sqft)', hsn: '9983', unit: 'sqft', qty: '40', rate: '25', gstPct: '18' },
      { id: _itemId++, description: 'Flex Board Frame Fitting', hsn: '9983', unit: 'pcs', qty: '1', rate: '1500', gstPct: '18' },
      { id: _itemId++, description: 'Visiting Cards (Gloss Laminate)', hsn: '9983', unit: 'set', qty: '5', rate: '350', gstPct: '18' }
    ])
    setIsImportModalOpen(false)
  }

  // ── Save Current Invoice to Database History ─────────────────
  const saveCurrentInvoiceToDb = () => {
    // Auto-sync products to catalog
    items.forEach(it => {
      const name = (it.description || '').trim()
      if (name) {
        const localProds = DataService.getProducts()
        const exists = localProds.some(p => p.name.toLowerCase() === name.toLowerCase())
        if (!exists) {
          DataService.saveProduct({
            name,
            hsn_code: it.hsn || '9983',
            unit: it.unit || 'pcs',
            price: parseFloat(it.rate) || 0,
            gst_rate: parseFloat(it.gstPct) || 18,
          })
        }
      }
    })

    const formattedItems = items.map(it => {
      const { base, total } = calcRow(it)
      return {
        description: it.description || 'Printing Services',
        hsn: it.hsn || '9983',
        tax_percent: parseFloat(it.gstPct) || 0,
        qty: parseFloat(it.qty) || 1,
        rate: parseFloat(it.rate) || 0,
        amount: total || base
      }
    })

    const saved = DataService.saveInvoice({
      id: editingInvoiceId || undefined,
      invoice_number: billNo,
      type: billType,
      date: billDate,
      customer_name: custName || 'Walk-in Customer',
      customer_mobile: custMobile,
      customer_gstin: custGst,
      customer_address: custAddress,
      eway_bill_no: ewayBillNo,
      vehicle_no: vehicleNo,
      transporter_name: transporterName,
      distance_km: parseFloat(distanceKm) || 0,
      valid_for: validFor,
      credit_period: creditPeriod,
      sub_total: subtotal,
      cgst: billType === 'ESTIMATE' ? 0 : cgst,
      sgst: billType === 'ESTIMATE' ? 0 : sgst,
      round_off: roundOff,
      grand_total: roundedGrand,
      paid_amount: billType === 'ESTIMATE' ? advanceNum : roundedGrand,
      items: formattedItems
    })

    setEditingInvoiceId(saved.id)
    setSaveInvoiceMsg(`✅ Bill ${saved.invoice_number} saved to History!`)
    setTimeout(() => setSaveInvoiceMsg(null), 3000)
    return saved
  }

  // ── Print & Save Actions ──
  const handlePrint = useCallback(async () => {
    if (custName.trim()) {
      saveCustomerToDb()
    }
    saveCurrentInvoiceToDb()

    if ((window as any).electron?.ipcRenderer) {
      try {
        await (window as any).electron.ipcRenderer.invoke('print-bill')
        return
      } catch (e) {
        console.warn('IPC print error:', e)
      }
    }
    window.print()
  }, [custName, saveCustomerToDb, saveCurrentInvoiceToDb])

  const handleDownloadPdf = useCallback(async () => {
    if (custName.trim()) {
      saveCustomerToDb()
    }
    saveCurrentInvoiceToDb()

    const sourceEl = document.getElementById('printable-bill')
    if (!sourceEl) {
      window.print()
      return
    }

    setSaveInvoiceMsg('⏳ Generating & Downloading Invoice PDF...')

    // Create a clean un-scaled offscreen wrapper for 100% accurate A4 PDF rendering
    const tempWrapper = document.createElement('div')
    tempWrapper.style.position = 'absolute'
    tempWrapper.style.left = '-9999px'
    tempWrapper.style.top = '0px'
    tempWrapper.style.width = '794px' // Standard A4 width at 96 DPI
    tempWrapper.style.background = '#ffffff'
    tempWrapper.style.zIndex = '-99999'

    const clone = sourceEl.cloneNode(true) as HTMLElement
    clone.style.transform = 'none'
    clone.style.margin = '0'
    clone.style.boxShadow = 'none'
    clone.style.width = '794px'

    tempWrapper.appendChild(clone)
    document.body.appendChild(tempWrapper)

    try {
      const cleanCustName = (custName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_')
      const fileName = `ViralPrint_${billType}_${billNo}_${cleanCustName}.pdf`

      const opt = {
        margin:       4,
        filename:     fileName,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      }

      await html2pdf().set(opt).from(clone).save()

      setSaveInvoiceMsg(`✅ Invoice PDF (${fileName}) downloaded!`)
      setTimeout(() => setSaveInvoiceMsg(null), 3500)
    } catch (e: any) {
      console.warn('html2pdf generation error, using fallback:', e)
      window.print()
    } finally {
      if (document.body.contains(tempWrapper)) {
        document.body.removeChild(tempWrapper)
      }
    }
  }, [custName, billType, billNo, saveCustomerToDb, saveCurrentInvoiceToDb])

  // ── Keyboard Shortcuts for Fast Daily Counter Operations ──
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        saveCurrentInvoiceToDb()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        handlePrint()
      }
    }
    window.addEventListener('keydown', handleGlobalShortcuts)
    return () => window.removeEventListener('keydown', handleGlobalShortcuts)
  }, [saveCurrentInvoiceToDb, handlePrint])

  const MIN_ROWS = billType === 'ESTIMATE' ? 8 : 10
  const fillerCount = Math.max(0, MIN_ROWS - items.length)
  const formatTitle = billType === 'TAX_INVOICE' ? 'Tax Invoice' : billType === 'QUOTATION' ? 'Quotation' : 'Estimate Bill'
  const allSavedInvoices = DataService.getInvoices()

  return (
    <div className={`estimate-panel ${cls}`}>

      {/* ═══════════ LEFT: INPUT FORM ═══════════ */}
      <div className="estimate-form-panel">

        {/* Save Status Alert Banner */}
        {saveInvoiceMsg && (
          <div style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', padding: '8px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <CheckCircle2 size={16} /> {saveInvoiceMsg}
          </div>
        )}

        {/* Top Actions: Save Bill, Load History, Import Estimate & Backup Buttons */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            className="eb-btn-secondary"
            onClick={saveCurrentInvoiceToDb}
            style={{ fontSize: '0.76rem', fontWeight: 800, padding: '6px 11px', background: 'linear-gradient(135deg, #736efe, #00D2FF)', color: '#ffffff', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 3px 10px rgba(115,110,254,0.3)' }}
            title="Save Bill to Database History"
          >
            <Save size={13} /> Save Bill
          </button>

          <button
            className="eb-btn-secondary"
            onClick={() => setIsHistoryModalOpen(true)}
            style={{ fontSize: '0.76rem', fontWeight: 800, padding: '6px 11px', background: 'rgba(115,110,254,0.1)', color: '#736efe', borderColor: 'rgba(115,110,254,0.3)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
            title="Open Saved Previous Bills Modal to select and edit any past bill"
          >
            <HistoryIcon size={13} /> Load Previous
          </button>

          <button
            className="eb-btn-secondary"
            onClick={() => DataService.exportAllDataToExcel()}
            style={{ fontSize: '0.76rem', fontWeight: 800, padding: '6px 11px', background: 'rgba(16,185,129,0.12)', color: '#10B981', borderColor: 'rgba(16,185,129,0.3)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
            title="Backup all bill data to Excel (.xlsx)"
          >
            <FileSpreadsheet size={13} /> Excel Backup
          </button>

          <button
            className="eb-btn-secondary"
            onClick={() => DataService.exportAllDataToExcel()}
            style={{ fontSize: '0.76rem', fontWeight: 800, padding: '6px 11px', background: 'rgba(16,185,129,0.12)', color: '#10B981', borderColor: 'rgba(16,185,129,0.25)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
            title="Backup all bill data as Excel workbook (.xlsx) to drive"
          >
            <FileSpreadsheet size={13} /> Excel Backup
          </button>


          <button
            className="eb-btn-secondary"
            onClick={() => setIsImportModalOpen(true)}
            style={{ fontSize: '0.76rem', fontWeight: 700, padding: '6px 11px', background: 'rgba(115,110,254,0.08)', color: '#736efe', borderColor: 'rgba(115,110,254,0.2)' }}
          >
            <FileCheck size={13} /> Import Estimate
          </button>

          {billType === 'TAX_INVOICE' && (
            <>
              <button
                className="eb-btn-secondary"
                onClick={() => setIsEwayModalOpen(true)}
                style={{ fontSize: '0.76rem', fontWeight: 800, padding: '6px 11px', background: 'linear-gradient(135deg, #10B981, #059669)', color: '#ffffff', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 3px 10px rgba(16,185,129,0.3)' }}
                title="Generate & Download Official Govt GST E-Way Bill JSON Payload"
              >
                <Truck size={13} /> Govt E-Way Bill
              </button>

              <button
                className="eb-btn-secondary"
                onClick={openOfficialEwayPortal}
                style={{ fontSize: '0.76rem', fontWeight: 700, padding: '6px 11px', background: 'rgba(16,185,129,0.08)', color: '#10B981', borderColor: 'rgba(16,185,129,0.2)' }}
                title="Open Official GST E-Way Bill Portal (ewaybillgst.gov.in)"
              >
                <ExternalLink size={13} /> ewaybillgst.gov.in
              </button>
            </>
          )}
        </div>

        {/* Document Header Info */}
        <div className="eb-card">
          <div className="eb-card-header">
            <Sparkles size={14} /> {formatTitle} Details
          </div>
          <div className="eb-card-body">
            <div className="eb-form-row">
              <div className="eb-field">
                <label>{billType === 'TAX_INVOICE' ? 'Invoice No.' : billType === 'QUOTATION' ? 'Quotation No.' : 'Estimate No.'}</label>
                <input value={billNo} onChange={e => setBillNo(e.target.value)} />
              </div>
              <div className="eb-field">
                <label>Date</label>
                <input type="date" value={billDate} onChange={e => setBillDate(e.target.value)} />
              </div>
            </div>

            {billType === 'TAX_INVOICE' && (
              <>
                <div className="eb-form-row">
                  <div className="eb-field" style={{ flex: 1 }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>E-Way Bill No. (12-Digit)</span>
                      <button
                        onClick={copyEwayDetails}
                        style={{ background: 'none', border: 'none', color: copiedEway ? '#10B981' : '#736efe', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}
                      >
                        <Copy size={11} /> {copiedEway ? 'Copied GST Data!' : 'Copy E-Way Data'}
                      </button>
                    </label>
                    <input
                      placeholder="12-digit E-Way Bill No."
                      value={ewayBillNo}
                      onChange={e => setEwayBillNo(e.target.value)}
                      maxLength={12}
                      style={{ fontWeight: 700, letterSpacing: '0.5px' }}
                    />
                  </div>
                  <div className="eb-field" style={{ flex: 1 }}>
                    <label>Vehicle No. (Transport)</label>
                    <input
                      placeholder="e.g. GJ-01-AB-1234"
                      value={vehicleNo}
                      onChange={e => setVehicleNo(e.target.value.toUpperCase())}
                      style={{ textTransform: 'uppercase', fontWeight: 700 }}
                    />
                  </div>
                </div>

                <div className="eb-form-row">
                  <div className="eb-field" style={{ flex: 2 }}>
                    <label>Transporter Name / ID</label>
                    <input
                      placeholder="Transporter company name or GSTIN ID"
                      value={transporterName}
                      onChange={e => setTransporterName(e.target.value)}
                    />
                  </div>
                  <div className="eb-field" style={{ flex: 1 }}>
                    <label>Approx Distance (Km)</label>
                    <input
                      type="number"
                      placeholder="e.g. 25"
                      value={distanceKm}
                      onChange={e => setDistanceKm(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {billType === 'QUOTATION' && (
              <div className="eb-form-row">
                <div className="eb-field">
                  <label>Valid For</label>
                  <input value={validFor} onChange={e => setValidFor(e.target.value)} placeholder="e.g. 15 Days" />
                </div>
                <div className="eb-field">
                  <label>Credit Period</label>
                  <input value={creditPeriod} onChange={e => setCreditPeriod(e.target.value)} placeholder="e.g. 30 Days" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customer Info with GST Auto-Fetch */}
        <div className="eb-card">
          <div className="eb-card-header" style={{ justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Eye size={14} /> Details of Receiver (Billed To)
            </span>
            {custName && (
              <button
                onClick={saveCustomerToDb}
                style={{
                  background: 'none', border: 'none', color: saveCustSuccess ? '#10B981' : '#736efe',
                  cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4
                }}
                title="Save Customer to Database"
              >
                {saveCustSuccess ? <CheckCircle2 size={13} /> : <Save size={13} />}
                {saveCustSuccess ? 'Saved!' : 'Save Customer'}
              </button>
            )}
          </div>
          <div className="eb-card-body">

            {/* GSTIN Field with Auto-Fetch */}
            <div className="eb-form-row" style={{ marginBottom: 12 }}>
              <div className="eb-field" style={{ position: 'relative' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>GSTIN Number (Auto-fetches Company, Owner & Phone)</span>
                  {custStateInfo && (
                    <span style={{ color: '#10B981', fontSize: '0.68rem', fontWeight: 800 }}>
                      State: {custStateInfo.state} ({custStateInfo.stateCode})
                    </span>
                  )}
                </label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    placeholder="Enter 15-digit GSTIN (e.g. 24BAAPM9783K1Z7)"
                    value={custGst}
                    onChange={e => handleGstChange(e.target.value)}
                    maxLength={15}
                    style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}
                  />
                </div>
                {gstStatusMsg && (
                  <div className="eb-gst-status-msg">
                    {gstStatusMsg}
                  </div>
                )}
              </div>
            </div>

            {/* Customer & Owner Name */}
            <div className="eb-form-row">
              <div className="eb-field" style={{ position: 'relative', flex: 1 }}>
                <label>Company / Customer Name</label>
                <div style={{ position: 'relative' }}>
                  <input
                    placeholder="M/s. Customer / Business Name"
                    value={custName}
                    onChange={e => handleCustNameChange(e.target.value)}
                    onFocus={() => custName && customerSuggestions.length > 0 && setShowCustDropdown(true)}
                  />
                  <Search size={14} style={{ position: 'absolute', right: 10, top: 10, color: '#94A3B8', pointerEvents: 'none' }} />
                </div>

                {/* Autocomplete Suggestions Dropdown */}
                {showCustDropdown && customerSuggestions.length > 0 && (
                  <div className="eb-cust-dropdown">
                    {customerSuggestions.map(c => (
                      <div
                        key={c.id}
                        onClick={() => selectCustomer(c)}
                        className="eb-cust-dropdown-item"
                        onMouseDown={e => e.preventDefault()}
                      >
                        <div>
                          <strong className="eb-cust-name">{c.name}</strong>
                          {c.mobile && <span className="eb-cust-mobile">📞 {c.mobile}</span>}
                        </div>
                        {c.gst_no && (
                          <span className="eb-cust-gst-badge">
                            {c.gst_no}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="eb-field" style={{ flex: 1 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <UserCheck size={12} /> Contact / Owner Name
                </label>
                <input
                  placeholder="Proprietor / Owner Name"
                  value={custOwner}
                  onChange={e => setCustOwner(e.target.value)}
                />
              </div>
            </div>

            <div className="eb-form-row">
              <div className="eb-field" style={{ flex: 2 }}>
                <label>Billing Address</label>
                <input
                  placeholder="Customer complete address"
                  value={custAddress}
                  onChange={e => setCustAddress(e.target.value)}
                />
              </div>
              <div className="eb-field" style={{ flex: 1 }}>
                <label>Mobile No. (10 Digits)</label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit Mobile No."
                  value={custMobile}
                  onChange={e => setCustMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Particulars / Goods Description Box with Inline Editing & POP-UP Trigger */}
        <div className="eb-card">
          <div className="eb-card-header" style={{ justifyContent: 'space-between' }}>
            <span className="eb-header-title">
              <Layers size={14} /> Particulars / Goods Description ({items.length} {items.length === 1 ? 'Item' : 'Items'})
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setShowCatalogPickerModal(true)}
                className="eb-header-btn"
                style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', boxShadow: 'none', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                title="Pick Product from Catalog"
              >
                <Package size={13} /> Pick Catalog Product
              </button>
              <button
                onClick={addBlankRow}
                className="eb-header-btn"
                style={{ background: 'rgba(115,110,254,0.15)', color: '#736efe', boxShadow: 'none', border: '1px solid rgba(115,110,254,0.3)' }}
                title="Add New Blank Row"
              >
                <Plus size={13} /> Add Row
              </button>
              <button
                onClick={() => setIsItemModalOpen(true)}
                className="eb-header-btn"
                title="Open Item Manager Pop-Up"
              >
                <PackagePlus size={13} /> Full Pop-Up
              </button>
            </div>
          </div>
          <div className="eb-card-body" style={{ padding: 10, overflow: 'visible', position: 'relative' }}>

            {/* Inline Items Table with Product Search Autocomplete */}
            <div className="eb-items-table-wrap" style={{ minHeight: activeInlineSearchId !== null ? 220 : 'auto', overflowY: activeInlineSearchId !== null ? 'visible' : 'auto', overflowX: 'visible', marginBottom: 8, position: 'relative', zIndex: activeInlineSearchId !== null ? 99999 : 1 }}>
              <table className="eb-items-table" style={{ width: '100%', minWidth: 620 }}>
                <thead>
                  <tr>
                    <th style={{ width: 24 }}>#</th>
                    <th style={{ minWidth: 150 }}>Product / Description</th>
                    <th style={{ width: 70 }}>HSN / SAC</th>
                    <th style={{ width: 65 }}>Unit</th>
                    <th style={{ width: 55 }}>Qty</th>
                    <th style={{ width: 75 }}>Rate</th>
                    {billType !== 'ESTIMATE' && <th style={{ width: 65 }}>GST%</th>}
                    <th style={{ width: 75, textAlign: 'right' }}>Total</th>
                    <th style={{ width: 28 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const { total } = calcRow(item)
                    const matches = getProductMatches(item.description)
                    const showDropdown = activeInlineSearchId === item.id && matches.length > 0
                    const openUpward = idx >= 1

                    return (
                      <tr key={item.id} style={{ position: 'relative', zIndex: showDropdown ? 1000 : 1 }}>
                        <td style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>{idx + 1}</td>
                        <td style={{ position: 'relative', zIndex: showDropdown ? 1001 : 1 }}>
                          <input
                            placeholder="Type product name..."
                            value={item.description}
                            onChange={e => {
                              updateItem(item.id, 'description', e.target.value)
                              setActiveInlineSearchId(item.id)
                              setActiveItemSearchIndex(0)
                            }}
                            onFocus={() => {
                              loadProducts()
                              setActiveInlineSearchId(item.id)
                              setActiveItemSearchIndex(0)
                            }}
                            onKeyDown={e => handleItemKeyDown(e, item.id, matches)}
                            onBlur={() => setTimeout(() => setActiveInlineSearchId(null), 250)}
                            style={{ width: '100%', padding: '5px 8px', fontSize: '0.8rem' }}
                          />

                           {/* Autocomplete Dropdown */}
                          {showDropdown && (
                            <div
                              className="eb-product-autocomplete-menu"
                              style={{
                                position: 'absolute',
                                ...(openUpward
                                  ? { bottom: 'calc(100% + 6px)', top: 'auto' }
                                  : { top: 'calc(100% + 4px)', bottom: 'auto' }),
                                left: -38,
                                minWidth: 470,
                                maxWidth: 540,
                                zIndex: 999999
                              }}
                            >
                              <div className="eb-product-autocomplete-header">
                                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <Package size={12} /> Catalog Suggestions
                                </span>
                                <span>
                                  <kbd>↑</kbd><kbd>↓</kbd> Navigate &nbsp;•&nbsp; <kbd>↵ Enter</kbd> Select
                                </span>
                              </div>
                              {matches.map((p, pIdx) => {
                                const isSelected = activeItemSearchIndex === pIdx
                                const hsnVal = p.hsn || (p as any).hsn_code || '9983'
                                return (
                                  <div
                                    key={p.id}
                                    className={`eb-product-autocomplete-item ${isSelected ? 'active' : ''}`}
                                    onMouseDown={e => {
                                      e.preventDefault()
                                      selectProductForItemRow(item.id, p)
                                    }}
                                    onMouseEnter={() => setActiveItemSearchIndex(pIdx)}
                                  >
                                    <div className="eb-product-icon-badge">
                                      <Package size={14} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div className="eb-product-title">
                                        <span className="eb-product-title-text" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                                      </div>
                                      <div className="eb-product-meta">
                                        <span className="eb-product-hsn-tag">HSN: {hsnVal}</span>
                                        {billType !== 'ESTIMATE' && p.gst_rate !== undefined && (
                                          <span className="eb-product-gst-tag">{p.gst_rate}% GST</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="eb-product-price-tag">
                                      ₹{p.price}{p.unit ? <span className="eb-price-unit"> / {p.unit}</span> : ''}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Inline W x H Size Calculator Helper for Print Items */}
                          {item.showSizeCalc && (
                            <div className="d-flex align-items-center gap-1 mt-1 px-1 py-0.5 rounded" style={{ background: 'rgba(115,110,254,0.08)', fontSize: '0.68rem' }}>
                              <span style={{ color: '#736efe', fontWeight: 700 }}>Size (ft):</span>
                              <input
                                type="number" min="0" step="0.1"
                                placeholder="W"
                                value={item.width || ''}
                                onChange={e => updateItemDimensions(item.id, e.target.value, item.height || '')}
                                style={{ width: 42, padding: '2px 4px', fontSize: '0.70rem', textAlign: 'center', borderRadius: 4, border: '1px solid #736efe' }}
                              />
                              <span>×</span>
                              <input
                                type="number" min="0" step="0.1"
                                placeholder="H"
                                value={item.height || ''}
                                onChange={e => updateItemDimensions(item.id, item.width || '', e.target.value)}
                                style={{ width: 42, padding: '2px 4px', fontSize: '0.70rem', textAlign: 'center', borderRadius: 4, border: '1px solid #736efe' }}
                              />
                              <span style={{ color: '#10B981', fontWeight: 700, marginLeft: 2 }}>
                                = {((parseFloat(item.width || '0') || 0) * (parseFloat(item.height || '0') || 0)).toFixed(1)} {item.unit || 'sqft'}
                              </span>
                            </div>
                          )}
                        </td>
                        <td>
                          <input
                            placeholder="9983"
                            value={item.hsn}
                            onChange={e => updateItem(item.id, 'hsn', e.target.value)}
                            style={{ padding: '5px 4px', textAlign: 'center', fontSize: '0.75rem', width: '100%' }}
                          />
                        </td>
                        <td>
                          <input
                            list="vpm-unit-list"
                            placeholder="pcs"
                            value={item.unit}
                            onChange={e => updateItem(item.id, 'unit', e.target.value)}
                            style={{ padding: '5px 4px', textAlign: 'center', fontSize: '0.75rem', width: '100%' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number" min="0" step="0.01"
                            value={item.qty}
                            onChange={e => updateItem(item.id, 'qty', e.target.value)}
                            style={{ padding: '5px 4px', textAlign: 'center' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number" min="0" step="0.01" placeholder="0.00"
                            value={item.rate}
                            onChange={e => updateItem(item.id, 'rate', e.target.value)}
                            style={{ padding: '5px 4px' }}
                          />
                        </td>
                        {billType !== 'ESTIMATE' && (
                          <td>
                            <select
                              value={item.gstPct}
                              onChange={e => updateItem(item.id, 'gstPct', e.target.value)}
                              style={{ padding: '4px 2px', fontSize: '0.75rem' }}
                            >
                              {GST_RATES.map(g => <option key={g}>{g}%</option>)}
                            </select>
                          </td>
                        )}
                        <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.8rem', color: '#1E293B' }}>
                          ₹{fmt(total)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {items.length > 1 && (
                            <button className="eb-del-btn" onClick={() => delItem(item.id)} title="Delete row">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Datalist for unit typing & dropdown suggestions */}
              <datalist id="vpm-unit-list">
                {UNITS.filter(u => u !== 'Other').map(u => <option key={u} value={u} />)}
              </datalist>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={addBlankRow}
                className="eb-add-row-btn"
                style={{ flex: 1, padding: '6px' }}
              >
                <Plus size={13} /> Add Custom Line
              </button>
              <button
                onClick={() => setIsItemModalOpen(true)}
                className="eb-btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 800 }}
              >
                <PackagePlus size={14} /> Full Screen Manager
              </button>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="eb-totals">
            <div className="eb-total-row">
              <span className="lbl">Sub Total</span>
              <span className="val">₹{fmt(subtotal)}</span>
            </div>
            {billType !== 'ESTIMATE' && (
              <>
                <div className="eb-total-row">
                  <span className="lbl">CGST</span>
                  <span className="val">₹{fmt(cgst)}</span>
                </div>
                <div className="eb-total-row">
                  <span className="lbl">SGST</span>
                  <span className="val">₹{fmt(sgst)}</span>
                </div>
              </>
            )}
            <div className="eb-total-row grand">
              <span className="lbl">Grand Total</span>
              <span className="val">₹{fmt(roundedGrand)}</span>
            </div>
          </div>
        </div>

        {/* Advance Payment input for Simple Estimate */}
        {billType === 'ESTIMATE' && (
          <div className="eb-card">
            <div className="eb-card-header"><FileText size={14} /> Payment Terms (Advance / Balance)</div>
            <div className="eb-card-body">
              <div className="eb-form-row">
                <div className="eb-field">
                  <label>Advance Amount Received (₹)</label>
                  <input
                    type="number" min="0" placeholder="0.00"
                    value={advanceAmt}
                    onChange={e => setAdvanceAmt(e.target.value)}
                  />
                </div>
                <div className="eb-field">
                  <label>Remaining Amount (₹)</label>
                  <input
                    readOnly value={fmt(remainNum)}
                    style={{ fontWeight: 800, color: '#EF4444', background: 'rgba(239,68,68,0.06)' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── UPI Payment QR, Terms & Footer Signatory Settings Card ── */}
        <div className="eb-card" style={{ border: '1.5px solid rgba(115,110,254,0.3)', boxShadow: '0 4px 14px rgba(115,110,254,0.08)' }}>
          <div className="eb-card-header" style={{ justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setIsFooterSettingsOpen(!isFooterSettingsOpen)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: '#736efe' }}>
              <ShieldCheck size={16} /> Footer Settings (UPI QR, Terms & Signatory)
            </span>
            <button
              type="button"
              style={{
                background: 'linear-gradient(135deg, rgba(115,110,254,0.15), rgba(0,210,255,0.1))',
                border: '1px solid #736efe', color: '#736efe', padding: '3px 10px', borderRadius: 6,
                cursor: 'pointer', fontSize: '0.72rem', fontWeight: 800
              }}
            >
              {isFooterSettingsOpen ? 'Close Settings ▲' : 'Edit / Customize Footer ▼'}
            </button>
          </div>
          {isFooterSettingsOpen && (
            <div className="eb-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 10 }}>
              {/* UPI & QR Code Settings */}
              <div style={{ background: 'rgba(115,110,254,0.05)', padding: 10, borderRadius: 8, border: '1px solid rgba(115,110,254,0.2)' }}>
                <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#736efe', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MessageCircle size={14} /> UPI Payment Bar Details (Estimate Format)
                </div>
                <div className="eb-form-row" style={{ marginBottom: 6 }}>
                  <div className="eb-field" style={{ flex: 1 }}>
                    <label>Account Holder Name</label>
                    <input value={upiAccountName} onChange={e => setUpiAccountName(e.target.value)} placeholder="e.g. Manoj Mehta" />
                  </div>
                  <div className="eb-field" style={{ flex: 1 }}>
                    <label>Mobile Number</label>
                    <input value={upiMobile} onChange={e => setUpiMobile(e.target.value)} placeholder="e.g. +91 98980 15205" />
                  </div>
                </div>
                <div className="eb-form-row" style={{ marginBottom: 8 }}>
                  <div className="eb-field" style={{ flex: 1 }}>
                    <label>UPI ID</label>
                    <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="e.g. 9898015205@okbizaxis" style={{ fontFamily: 'monospace' }} />
                  </div>
                  <div className="eb-field" style={{ flex: 1 }}>
                    <label>Accepted Apps Text</label>
                    <input value={upiApps} onChange={e => setUpiApps(e.target.value)} placeholder="e.g. GPay • Paytm • PhonePe • BHIM" />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#ffffff', padding: 8, borderRadius: 6, border: '1px dashed rgba(115,110,254,0.3)' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', whiteSpace: 'nowrap' }}>Custom QR Image:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQrUpload}
                    style={{ fontSize: '0.70rem', flex: 1 }}
                  />
                  {qrCodeImg !== manojMehtaQrBase64 && (
                    <button
                      type="button"
                      onClick={resetQrCode}
                      style={{ background: '#EF4444', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: 4, fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Reset Default QR
                    </button>
                  )}
                </div>
              </div>

              {/* Dynamic Terms & Conditions Settings */}
              <div style={{ background: 'rgba(16,185,129,0.05)', padding: 12, borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <FileText size={14} /> Terms &amp; Conditions Lines ({termsList.length})
                  </div>
                  <button
                    type="button"
                    onClick={addTerm}
                    style={{
                      background: 'linear-gradient(135deg, #10B981, #059669)', color: '#ffffff',
                      border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: '0.72rem',
                      fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                      boxShadow: '0 2px 6px rgba(16,185,129,0.25)'
                    }}
                  >
                    <Plus size={13} /> Add Term Line
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {termsList.map((term, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', minWidth: 20 }}>
                        {idx + 1}.
                      </span>
                      <input
                        value={term}
                        onChange={e => updateTerm(idx, e.target.value)}
                        placeholder={`Condition line ${idx + 1}...`}
                        style={{ flex: 1, padding: '5px 10px', fontSize: '0.78rem', borderRadius: 6, border: '1px solid rgba(16,185,129,0.3)' }}
                      />
                      {termsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTerm(idx)}
                          style={{
                            background: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)',
                            padding: '5px 8px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center'
                          }}
                          title="Remove condition line"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Company Signatory Settings */}
              <div style={{ background: 'rgba(2,132,199,0.05)', padding: 10, borderRadius: 8, border: '1px solid rgba(2,132,199,0.2)' }}>
                <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#0284c7', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <UserCheck size={14} /> Authorised Signatory Header &amp; Title
                </div>
                <div className="eb-form-row">
                  <div className="eb-field" style={{ flex: 1 }}>
                    <label>Company Line (e.g. For, VIRAL PRINT MEDIA)</label>
                    <input value={signatoryCompany} onChange={e => setSignatoryCompany(e.target.value)} placeholder="For, VIRAL PRINT MEDIA" />
                  </div>
                  <div className="eb-field" style={{ flex: 1 }}>
                    <label>Signatory Designation Label</label>
                    <input value={signatoryTitle} onChange={e => setSignatoryTitle(e.target.value)} placeholder="Authorised Signatory" />
                  </div>
                </div>
              </div>

              {/* Bank Details Settings */}
              <div style={{ background: 'rgba(245,158,11,0.05)', padding: 10, borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)' }}>
                <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#d97706', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <HardDrive size={14} /> Bank Details (For Tax Invoice &amp; Quotation)
                </div>
                <div className="eb-form-row">
                  <div className="eb-field" style={{ flex: 1 }}>
                    <label>Bank Name</label>
                    <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. UCO BANK" />
                  </div>
                  <div className="eb-field" style={{ flex: 1 }}>
                    <label>Account No.</label>
                    <input value={accountNo} onChange={e => setAccountNo(e.target.value)} placeholder="e.g. 28810210000939" />
                  </div>
                  <div className="eb-field" style={{ flex: 1 }}>
                    <label>IFSC Code</label>
                    <input value={ifsc} onChange={e => setIfsc(e.target.value)} placeholder="e.g. UCBA0002881" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons (Print, Save PDF, WhatsApp Share, Email Share, Reset) */}
        <div className="eb-actions">
          <button className="eb-btn-action eb-btn-print" onClick={handlePrint} title="Print Bill directly to printer or save as PDF">
            <Printer size={15} />
            <span>Print Bill</span>
          </button>
          <button className="eb-btn-action eb-btn-download" onClick={handleDownloadPdf} title="Download & Save Bill as PDF Document">
            <Download size={15} />
            <span>Download PDF</span>
          </button>
          <button
            className="eb-btn-action eb-btn-whatsapp"
            onClick={async () => {
              // 1. Auto-download PDF invoice document
              await handleDownloadPdf()

              // 2. Prepare WhatsApp Target Mobile & Message
              let targetMob = custMobile ? custMobile.replace(/\D/g, '') : ''
              if (!targetMob || targetMob.length < 10) {
                const input = window.prompt('Enter customer 10-digit mobile number to send WhatsApp bill:', targetMob || '')
                if (!input) return
                targetMob = input.replace(/\D/g, '')
              }
              if (targetMob.length === 10) {
                targetMob = '91' + targetMob
              }

              const itemDetails = items.map((it, i) => {
                const { total } = calcRow(it)
                return `${i + 1}. *${it.description || 'Printing Services'}*\n   Qty: ${it.qty || 1} ${it.unit || 'pcs'} @ ₹${it.rate} = ₹${fmt(total)}`
              }).join('\n')

              const text = `📄 *VIRAL PRINT MEDIA* - *${formatTitle.toUpperCase()}*\n` +
                `-----------------------------------------\n` +
                `*Bill No:* ${billNo}\n` +
                `*Date:* ${billDate}\n` +
                `*Customer:* ${custName || 'Valued Customer'}\n` +
                `-----------------------------------------\n` +
                `*ITEM DETAILS:*\n${itemDetails}\n` +
                `-----------------------------------------\n` +
                `*Total Amount:* ₹${fmt(roundedGrand)}\n` +
                (billType === 'ESTIMATE' ? `*Advance Paid:* ₹${fmt(advanceNum)}\n*Balance Due:* ₹${fmt(remainNum)}\n` : '') +
                `-----------------------------------------\n` +
                `📎 *Invoice PDF generated & downloaded to your device.* Please attach the downloaded PDF invoice file here.\n` +
                `-----------------------------------------\n` +
                (billType === 'ESTIMATE' ? `*PAY VIA GOOGLE PAY / BHIM UPI:*\n*UPI ID:* 9898015205@okbizaxis\n*Name:* Manoj Mehta (+91 98980 15205)\n-----------------------------------------\n` : '') +
                `Thank you for doing business with Viral Print Media!\n` +
                `📍 Chandkheda, Ahmedabad`

              window.open(`https://wa.me/${targetMob}?text=${encodeURIComponent(text)}`, '_blank')
            }}
            title="Download PDF Invoice & Send Details via WhatsApp"
          >
            <MessageCircle size={15} />
            <span>Send on WhatsApp</span>
          </button>
          <button
            className="eb-btn-action eb-btn-email"
            onClick={async () => {
              // 1. Auto-download PDF invoice document
              await handleDownloadPdf()

              // 2. Prepare Email Subject & Body
              const subject = `${formatTitle} #${billNo} - Viral Print Media`
              const body = `Dear ${custName || 'Valued Customer'},\n\nPlease find attached the ${formatTitle} PDF document for Invoice #${billNo}.\n\nInvoice Summary:\nBill No: ${billNo}\nDate: ${billDate}\nGrand Total: ₹${fmt(roundedGrand)}\n\n📎 Note: Your Invoice PDF document has been automatically generated and downloaded. Please attach the downloaded PDF file to this email.\n\nThank you for choosing Viral Print Media!\n\nViral Print Media\n📍 Chandkheda, Ahmedabad\n📞 +91 99799 63632`
              window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
            }}
            title="Download PDF Invoice & Send Summary via Email"
          >
            <Mail size={15} />
            <span>Email</span>
          </button>
          <button className="eb-btn-action eb-btn-reset" onClick={resetBill} title="Reset Form">
            <RefreshCw size={14} />
            <span>Reset</span>
          </button>
        </div>

      </div>

      {/* ═══════════ RIGHT: LIVE PREVIEW SCREEN ═══════════ */}
      <div className="estimate-preview-panel">

        {/* Preview Toolbar */}
        <div className="eb-preview-toolbar">
          <div className="eb-preview-title">
            <Eye size={15} /> Live Print Preview ({formatTitle})
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={handlePrint}
              style={{
                background: 'linear-gradient(135deg, #736efe, #00D2FF)', color: '#fff',
                border: 'none', padding: '5px 12px', borderRadius: 6, fontWeight: 800,
                fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
              }}
              title="Print / Save PDF"
            >
              <Printer size={13} /> Print / Save PDF
            </button>
            <div className="eb-zoom-controls">
              <button className="eb-zoom-btn" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} title="Zoom Out">
                <ZoomOut size={13} />
              </button>
              <span className="eb-zoom-pct">
                {Math.round(zoom * 100)}%
              </span>
              <button className="eb-zoom-btn" onClick={() => setZoom(z => Math.min(1.3, z + 0.1))} title="Zoom In">
                <ZoomIn size={13} />
              </button>
              <button className="eb-zoom-btn" onClick={() => setZoom(0.9)} title="Reset Zoom">
                <RotateCcw size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Preview Canvas Container */}
        <div className="eb-preview-scroll">
          <div className="bill-paper-container" style={{ transform: `scale(${zoom})` }}>
            <div className="bill-paper" ref={billRef} id="printable-bill">

              {/* Master Outer Grid Box matching PDF */}
              <div className="pdf-grid-box">

                {/* ── TOP BANNER HEADER ── */}
                <div className="pdf-top-banner">
                  {billType === 'TAX_INVOICE' ? 'TAX INVOICE' : billType === 'QUOTATION' ? 'QUOTATION' : 'ESTIMATE'}
                </div>

                {/* ── FORMAT 1 & 2: TAX INVOICE & QUOTATION LAYOUT ── */}
                {billType !== 'ESTIMATE' ? (
                  <>
                    {/* Company Header Info (Left) | Invoice Meta & Billed To (Right) */}
                    <div className="pdf-header-row">

                      {/* Left: Company Details */}
                      <div className="pdf-company-col">
                        {/* Company Logo */}
                        <img
                          src={viralLogo}
                          alt="Viral Print Media"
                          style={{ height: 52, maxWidth: 160, objectFit: 'contain', display: 'block', marginBottom: 6 }}
                        />
                        <div className="pdf-company-title">{company.name}</div>
                        <div className="pdf-company-line">
                          📍 {company.address}
                        </div>
                        <div className="pdf-company-line">
                          📞 {company.phone}
                        </div>
                        <div className="pdf-company-line">
                          ✉ {company.email}
                        </div>
                        <div className="pdf-company-gst-row">
                          <span>GSTIN : <strong>{company.gstNo}</strong></span>
                          <span>PAN : <strong>{company.panNo}</strong></span>
                        </div>
                        <div className="pdf-company-gst-row" style={{ marginTop: 2 }}>
                          <span>STATE : <strong>{company.state}</strong></span>
                          <span>STATE CODE : <strong>{company.stateCode}</strong></span>
                        </div>
                      </div>

                      {/* Right: Meta Info & Billed To */}
                      <div className="pdf-meta-col">
                        <div className="pdf-meta-top-grid">
                          <div className="pdf-meta-cell">
                            {billType === 'TAX_INVOICE' ? 'INVOICE NO.' : billType === 'QUOTATION' ? 'QUOTATION NO.' : 'ESTIMATE NO.'}<br />
                            <span style={{ fontSize: 11, color: '#000' }}>{billNo}</span>
                          </div>
                          <div className="pdf-meta-cell">
                            {billType === 'TAX_INVOICE' ? 'INVOICE DATE :' : billType === 'QUOTATION' ? 'QUOTATION DATE :' : 'ESTIMATE DATE :'}<br />
                            <span style={{ fontSize: 11, color: '#000' }}>
                              {billDate ? new Date(billDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : ''} ({billTime})
                            </span>
                          </div>
                        </div>

                        {billType === 'TAX_INVOICE' ? (
                          <div className="pdf-meta-top-grid" style={{ borderBottom: '1.5px solid #000' }}>
                            <div className="pdf-meta-cell">
                              E-WAY BILL NO.<br />
                              <span style={{ fontSize: 10, color: '#000', fontWeight: 700 }}>{ewayBillNo || '—'}</span>
                            </div>
                            <div className="pdf-meta-cell">
                              VEHICLE NO.<br />
                              <span style={{ fontSize: 10, color: '#000', fontWeight: 700 }}>{vehicleNo || '—'}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="pdf-meta-top-grid" style={{ borderBottom: '1.5px solid #000' }}>
                            <div className="pdf-meta-cell">
                              VALID FOR :<br />
                              <span style={{ fontSize: 10, color: '#000' }}>{validFor}</span>
                            </div>
                            <div className="pdf-meta-cell">
                              CREDIT PERIOD :<br />
                              <span style={{ fontSize: 10, color: '#000' }}>{creditPeriod}</span>
                            </div>
                          </div>
                        )}

                        {/* Details of Receiver (Billed to) */}
                        <div className="pdf-customer-box">
                          <div className="pdf-customer-title">
                            {billType === 'TAX_INVOICE' ? 'Details of Receiver (Billed to)' : billType === 'QUOTATION' ? 'Details of Receiver (Quoted to)' : 'Details of Receiver (Estimate to)'}
                          </div>
                          <div className="pdf-customer-name">
                            {custName || 'COMPANY NAME'}
                          </div>
                          {custOwner && (
                            <div className="pdf-customer-line" style={{ fontWeight: 700 }}>
                              Attn / Owner: {custOwner}
                            </div>
                          )}
                          <div className="pdf-customer-line">
                            ADDRESS : {custAddress || '_____________________________________________'}
                          </div>
                          <div className="pdf-customer-flex">
                            <span>Mo. : <strong>{custMobile || '__________'}</strong></span>
                            <span>GSTIN : <strong>{custGst || '__________'}</strong></span>
                          </div>
                          {custStateInfo && (
                            <div className="pdf-customer-flex" style={{ marginTop: 2 }}>
                              <span>State : <strong>{custStateInfo.state}</strong></span>
                              <span>State Code : <strong>{custStateInfo.stateCode}</strong></span>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* ── ITEMS TABLE FOR TAX INVOICE & QUOTATION ── */}
                    <table className="pdf-table">
                      <thead>
                        <tr>
                          <th style={{ width: 36 }}>Sr. No.</th>
                          <th style={{ textAlign: 'left' }}>DESCRIPTION</th>
                          {billType === 'TAX_INVOICE' && <th style={{ width: 65 }}>HSN</th>}
                          <th style={{ width: 45 }}>UNIT</th>
                          <th style={{ width: 50 }}>QTY</th>
                          <th style={{ width: 50 }}>TAX%</th>
                          <th style={{ width: 80 }}>RATE</th>
                          <th style={{ width: 95 }}>AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => {
                          const { total, gstPct } = calcRow(item)
                          return (
                            <tr key={item.id}>
                              <td className="center bold">{idx + 1}</td>
                              <td>{item.description || ''}</td>
                              {billType === 'TAX_INVOICE' && <td className="center">{item.hsn || '9983'}</td>}
                              <td className="center">{item.unit || 'pcs'}</td>
                              <td className="center">{item.qty}</td>
                              <td className="center">{gstPct}%</td>
                              <td className="right">{item.rate ? fmt(parseFloat(item.rate)) : ''}</td>
                              <td className="right bold">{total > 0 ? fmt(total) : ''}</td>
                            </tr>
                          )
                        })}

                        {/* Blank filler lines extending table to bottom */}
                        {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                          <tr key={`blank-${i}`} className="pdf-blank-row">
                            <td className="center"></td>
                            <td>&nbsp;</td>
                            {billType === 'TAX_INVOICE' && <td></td>}
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                          </tr>
                        ))}

                      </tbody>
                    </table>

                    {/* ── BOTTOM BANK & TOTALS ROW ── */}
                    <div className="pdf-bank-totals-row">
                      <div className="pdf-bank-col">
                        <div className="pdf-bank-header">
                          Company’s Bank Details :
                        </div>
                        <div className="pdf-bank-details-row">
                          <span>Bank Name : <strong>{company.bankName}</strong></span>
                          <span>IFSC : <strong>{company.ifsc}</strong></span>
                          <span>A/c. No. <strong>{company.accountNo}</strong></span>
                        </div>

                        {billType === 'TAX_INVOICE' && (
                          <div className="pdf-hsn-summary-box">
                            <div className="pdf-hsn-title">HSN SUMMARY :</div>
                            <table className="pdf-hsn-table">
                              <thead>
                                <tr>
                                  <th>HSN CODE</th>
                                  <th>SLAB</th>
                                  <th>TAXABLE VALUE</th>
                                  <th>RATE</th>
                                  <th>AMOUNT</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>9983</td>
                                  <td>18%</td>
                                  <td>₹{fmt(subtotal)}</td>
                                  <td>18%</td>
                                  <td>₹{fmt(totalGst)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Right Totals Box */}
                      <div className="pdf-totals-col">
                        <div className="pdf-total-item-row">
                          <div className="pdf-total-lbl">Sub Total</div>
                          <div className="pdf-total-val">{fmt(subtotal)}</div>
                        </div>
                        <div className="pdf-total-item-row">
                          <div className="pdf-total-lbl">CGST (9%)</div>
                          <div className="pdf-total-val">{fmt(cgst)}</div>
                        </div>
                        <div className="pdf-total-item-row">
                          <div className="pdf-total-lbl">SGST (9%)</div>
                          <div className="pdf-total-val">{fmt(sgst)}</div>
                        </div>
                        <div className="pdf-total-item-row">
                          <div className="pdf-total-lbl">Round Off</div>
                          <div className="pdf-total-val">{fmt(roundOff)}</div>
                        </div>
                      </div>
                    </div>

                    {/* ── VALUE IN WORDS & GRAND TOTAL ── */}
                    <div className="pdf-words-row">
                      <div className="pdf-words-col">
                        <div className="pdf-words-lbl">Value (In Words)</div>
                        <div className="pdf-words-text">
                          {roundedGrand > 0 ? amountInWords(roundedGrand) : 'Zero Rupees Only'}
                        </div>
                      </div>
                      <div className="pdf-grand-total-col">
                        <div className="pdf-grand-lbl">Grand Total</div>
                        <div className="pdf-grand-val">₹{fmt(roundedGrand)}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* ── FORMAT 3: SIMPLE ESTIMATE SLIP (Matches Page 3 of PDF) ── */
                  <>
                    <div className="pdf-header-row">
                      <div className="pdf-company-col" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {/* Company Logo */}
                        <img
                          src={viralLogo}
                          alt="Viral Print Media"
                          style={{ height: 62, maxWidth: 90, objectFit: 'contain', flexShrink: 0 }}
                        />
                        <div>
                          <div className="pdf-company-title" style={{ fontSize: 16 }}>{company.name}</div>
                          <div className="pdf-company-line">📍 {company.address}</div>
                          <div className="pdf-company-line">📞 {company.phone} &nbsp;|&nbsp; ✉ {company.email}</div>
                        </div>
                      </div>

                      <div className="pdf-meta-col" style={{ width: 320 }}>
                        <div className="pdf-meta-top-grid">
                          <div className="pdf-meta-cell">
                            ESTIMATE NO.<br />
                            <span style={{ fontSize: 11, color: '#000' }}>{billNo}</span>
                          </div>
                          <div className="pdf-meta-cell">
                            ESTIMATE DATE :<br />
                            <span style={{ fontSize: 11, color: '#000' }}>
                              {billDate ? new Date(billDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : ''}
                            </span>
                          </div>
                        </div>

                        <div className="pdf-customer-box">
                          <div className="pdf-customer-title">Details of Receiver (Estimate to)</div>
                          <div className="pdf-customer-name">{custName || 'COMPANY NAME'}</div>
                          {custOwner && <div className="pdf-customer-line">Owner / Attn: {custOwner}</div>}
                          <div className="pdf-customer-line">ADDRESS : {custAddress || '___________________________'}</div>
                          <div className="pdf-customer-line">Mo. : <strong>{custMobile || '__________'}</strong></div>
                        </div>
                      </div>
                    </div>

                    {/* Table for Simple Estimate */}
                    <table className="pdf-table">
                      <thead>
                        <tr>
                          <th style={{ width: 45 }}>Sr. No.</th>
                          <th style={{ textAlign: 'left' }}>DESCRIPTION</th>
                          <th style={{ width: 60 }}>UNIT</th>
                          <th style={{ width: 60 }}>QTY</th>
                          <th style={{ width: 95 }}>RATE</th>
                          <th style={{ width: 110 }}>AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => {
                          const { total } = calcRow(item)
                          return (
                            <tr key={item.id}>
                              <td className="center bold">{idx + 1}</td>
                              <td>{item.description || ''}</td>
                              <td className="center">{item.unit || 'pcs'}</td>
                              <td className="center">{item.qty}</td>
                              <td className="right">{item.rate ? fmt(parseFloat(item.rate)) : ''}</td>
                              <td className="right bold">{total > 0 ? fmt(total) : ''}</td>
                            </tr>
                          )
                        })}

                        {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                          <tr key={`blank-est-${i}`} className="pdf-blank-row">
                            <td className="center"></td>
                            <td>&nbsp;</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                          </tr>
                        ))}

                      </tbody>
                    </table>

                    {/* Bottom Summary Bar for Simple Estimate (PDF Page 3) */}
                    <div className="pdf-simple-summary-bar">
                      <div className="pdf-simple-summary-cell">
                        Total : <strong>₹{fmt(subtotal)}</strong>
                      </div>
                      <div className="pdf-simple-summary-cell">
                        Advance : <strong>₹{fmt(advanceNum)}</strong>
                      </div>
                      <div className="pdf-simple-summary-cell" style={{ color: '#EF4444' }}>
                        Remain Amount: <strong>₹{fmt(remainNum)}</strong>
                      </div>
                    </div>

                    {/* ── DEDICATED UPI PAYMENT & QR CODE BAR FOR ESTIMATE BILL ── */}
                    {billType === 'ESTIMATE' && (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', borderBottom: '1.5px solid #000000', background: '#FAFAFA'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <img
                            src={qrCodeImg}
                            alt="Scan to Pay QR Code"
                            style={{ width: 80, height: 80, objectFit: 'contain', border: '1.5px solid #000', padding: 2, background: '#fff', borderRadius: 4 }}
                          />
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 11, color: '#000' }}>SCAN TO PAY VIA GOOGLE PAY / BHIM UPI</div>
                            <div style={{ fontSize: 10, color: '#000', marginTop: 2 }}>Account Name: <strong>{upiAccountName}</strong></div>
                            <div style={{ fontSize: 10, color: '#000' }}>Mobile No: <strong>{upiMobile}</strong></div>
                            <div style={{ fontSize: 10, color: '#000', fontWeight: 800, fontFamily: 'monospace', marginTop: 2 }}>
                              UPI ID: {upiId}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: 9.5, color: '#000' }}>
                          Accepted Apps:<br />
                          <span style={{ fontWeight: 800, fontSize: 10.5 }}>{upiApps}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ── TERMS & CONDITIONS + SIGNATURE FOOTER ── */}
                <div className="pdf-terms-sig-row">
                  <div className="pdf-terms-col">
                    <div className="pdf-terms-title">TERMS &amp; CONDITIONS :</div>
                    <ul className="pdf-terms-list">
                      {termsList.filter(t => t.trim().length > 0).map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pdf-sig-col">
                    <div>{signatoryCompany}</div>
                    <div style={{ height: 35 }}></div>
                    <div style={{ textDecoration: 'overline', paddingTop: 2 }}>{signatoryTitle}</div>
                  </div>
                </div>

              </div>{/* End pdf-grid-box */}

            </div>{/* End bill-paper */}
          </div>{/* End bill-paper-container */}
        </div>{/* End eb-preview-scroll */}

      </div>{/* End estimate-preview-panel */}


      {/* ═══════════ MASTER POP-UP MODAL: PARTICULARS & GOODS DESCRIPTION MANAGER ═══════════ */}
      {isItemModalOpen && (
        <div className="vpm-modal-backdrop" onClick={() => setIsItemModalOpen(false)}>
          <div className="vpm-modal-card vpm-modal-wide" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="vpm-modal-header">
              <div className="vpm-modal-title">
                <Boxes size={20} style={{ color: '#736efe' }} /> Particulars & Goods Description Manager
              </div>
              <button className="vpm-modal-close-btn" onClick={() => setIsItemModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="vpm-modal-body">

              {/* Current Bill Items Table */}
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E293B', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Layers size={16} style={{ color: '#736efe' }} /> Current Items in Bill ({items.length})
                </span>
                <button
                  onClick={addBlankRow}
                  style={{
                    background: 'linear-gradient(135deg, rgba(115,110,254,0.1), rgba(0,210,255,0.08))',
                    border: '1.5px solid #736efe', color: '#736efe',
                    padding: '6px 12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem',
                    display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 2px 6px rgba(115,110,254,0.15)'
                  }}
                >
                  <Plus size={14} /> Add Custom Line
                </button>
              </div>

              <div className="eb-items-table-wrap" style={{ minHeight: activeModalSearchId !== null ? 240 : 'auto', maxHeight: 380, overflowY: activeModalSearchId !== null ? 'visible' : 'auto', overflowX: 'visible', position: 'relative', zIndex: activeModalSearchId !== null ? 99999 : 1 }}>
                <table className="eb-items-table" style={{ width: '100%', minWidth: 700 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 30 }}>#</th>
                      <th style={{ minWidth: 220 }}>Description & Product Search</th>
                      <th style={{ width: 80 }}>HSN / SAC</th>
                      <th style={{ width: 80 }}>Unit</th>
                      <th style={{ width: 70 }}>Qty</th>
                      <th style={{ width: 100 }}>Rate (₹)</th>
                      {billType !== 'ESTIMATE' && <th style={{ width: 75 }}>GST%</th>}
                      <th style={{ width: 110, textAlign: 'right' }}>Amount</th>
                      <th style={{ width: 35 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const { total } = calcRow(item)
                      const matches = getProductMatches(item.description)
                      const showDropdown = activeModalSearchId === item.id && matches.length > 0
                      const openUpward = idx >= 2

                      return (
                        <tr key={item.id} style={{ position: 'relative', zIndex: showDropdown ? 1000 : 1 }}>
                          <td style={{ textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, color: '#94A3B8' }}>{idx + 1}</td>
                          <td style={{ position: 'relative', zIndex: showDropdown ? 1001 : 1 }}>
                            <input
                              placeholder="Type item description or search product..."
                              value={item.description}
                              onChange={e => {
                                updateItem(item.id, 'description', e.target.value)
                                setActiveModalSearchId(item.id)
                                setActiveItemSearchIndex(0)
                              }}
                              onFocus={() => {
                                loadProducts()
                                setActiveModalSearchId(item.id)
                                setActiveItemSearchIndex(0)
                              }}
                              onKeyDown={e => handleItemKeyDown(e, item.id, matches)}
                              onBlur={() => setTimeout(() => setActiveModalSearchId(null), 250)}
                              style={{ width: '100%', padding: '7px 10px', fontSize: '0.85rem' }}
                            />

                            {/* Item Row Product Search Autocomplete Menu */}
                            {showDropdown && (
                              <div
                                className="eb-product-autocomplete-menu"
                                style={{
                                  position: 'absolute',
                                  ...(openUpward
                                    ? { bottom: 'calc(100% + 6px)', top: 'auto' }
                                    : { top: 'calc(100% + 4px)', bottom: 'auto' }),
                                  left: 0,
                                  minWidth: 460,
                                  maxWidth: 530,
                                  zIndex: 9999999
                                }}
                              >
                                <div className="eb-product-autocomplete-header">
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <Package size={12} /> Catalog Suggestions
                                  </span>
                                  <span>
                                    <kbd>↑</kbd><kbd>↓</kbd> Navigate &nbsp;•&nbsp; <kbd>↵ Enter</kbd> Select
                                  </span>
                                </div>
                                {matches.map((p, pIdx) => {
                                  const isSelected = activeItemSearchIndex === pIdx
                                  const hsnVal = p.hsn || (p as any).hsn_code || '9983'
                                  return (
                                    <div
                                      key={p.id}
                                      className={`eb-product-autocomplete-item ${isSelected ? 'active' : ''}`}
                                      onMouseDown={e => {
                                        e.preventDefault()
                                        selectProductForItemRow(item.id, p)
                                      }}
                                      onMouseEnter={() => setActiveItemSearchIndex(pIdx)}
                                    >
                                      <div className="eb-product-icon-badge">
                                        <Package size={14} />
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="eb-product-title">
                                          <span className="eb-product-title-text" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                                        </div>
                                        <div className="eb-product-meta">
                                          <span className="eb-product-hsn-tag">HSN: {hsnVal}</span>
                                          {billType !== 'ESTIMATE' && p.gst_rate !== undefined && (
                                            <span className="eb-product-gst-tag">{p.gst_rate}% GST</span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="eb-product-price-tag">
                                        ₹{p.price}{p.unit ? <span className="eb-price-unit"> / {p.unit}</span> : ''}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </td>
                          <td>
                            <input
                              placeholder="9983"
                              value={item.hsn}
                              onChange={e => updateItem(item.id, 'hsn', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              list="vpm-unit-list"
                              placeholder="pcs"
                              value={item.unit}
                              onChange={e => updateItem(item.id, 'unit', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number" min="0" step="0.01"
                              value={item.qty}
                              onChange={e => updateItem(item.id, 'qty', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number" min="0" step="0.01" placeholder="0.00"
                              value={item.rate}
                              onChange={e => updateItem(item.id, 'rate', e.target.value)}
                            />
                          </td>
                          {billType !== 'ESTIMATE' && (
                            <td>
                              <select value={item.gstPct} onChange={e => updateItem(item.id, 'gstPct', e.target.value)}>
                                {GST_RATES.map(g => <option key={g}>{g}%</option>)}
                              </select>
                            </td>
                          )}
                          <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.85rem', color: '#1E293B' }}>
                            ₹{fmt(total)}
                          </td>
                          <td>
                            <button className="eb-del-btn" onClick={() => delItem(item.id)} title="Delete row">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Modal Footer / Action Bar */}
            <div style={{
              padding: '14px 20px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Total Bill Amount: </span>
                <strong style={{ fontSize: '1.1rem', color: '#736efe', marginLeft: 6 }}>₹{fmt(roundedGrand)}</strong>
              </div>

              <button
                onClick={() => setIsItemModalOpen(false)}
                style={{
                  padding: '9px 24px', borderRadius: 9, background: 'linear-gradient(135deg,#10B981,#059669)',
                  color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(16,185,129,0.25)'
                }}
              >
                <CheckCircle2 size={16} /> Apply Items to Bill
              </button>
            </div>

          </div>
        </div>
      )}


      {/* ═══════════ MODAL 2: IMPORT PREVIOUS ESTIMATE POP-UP ═══════════ */}
      {isImportModalOpen && (
        <div className="vpm-modal-backdrop" onClick={() => setIsImportModalOpen(false)}>
          <div className="vpm-modal-card" onClick={e => e.stopPropagation()}>
            <div className="vpm-modal-header">
              <div className="vpm-modal-title">
                <FileCheck size={18} style={{ color: '#10B981' }} /> Import Saved Estimate into {formatTitle}
              </div>
              <button className="vpm-modal-close-btn" onClick={() => setIsImportModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="vpm-modal-body">
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: 14 }}>
                Select a previous Estimate or Quotation to automatically import all line items & customer details:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { id: 1, name: 'Siddharth Graphics Pvt Ltd', num: 'VPM-EST-2026-108', amount: '₹3,250.00', date: '05 Aug 2026' },
                  { id: 2, name: 'Shreeji Advertising & Media', num: 'VPM-EST-2026-142', amount: '₹14,500.00', date: '04 Aug 2026' },
                  { id: 3, name: 'Apex Digital Prints', num: 'VPM-EST-2026-199', amount: '₹8,900.00', date: '02 Aug 2026' },
                ].map(est => (
                  <div
                    key={est.id}
                    onClick={() => importSampleEstimate(est.name)}
                    style={{
                      padding: '12px 16px', borderRadius: 10, border: '1.5px solid #E2E8F0',
                      cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#10B981'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1E293B' }}>{est.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{est.num} • {est.date}</div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#10B981' }}>
                      {est.amount}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ MODAL 3: OFFICIAL GOVT E-WAY BILL GENERATOR POP-UP ═══════════ */}
      {isEwayModalOpen && (
        <div className="vpm-modal-backdrop" onClick={() => setIsEwayModalOpen(false)}>
          <div className="vpm-modal-card" style={{ maxWidth: 820, width: '95%' }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="vpm-modal-header" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#fff', borderBottom: '1px solid #334155' }}>
              <div>
                <div className="vpm-modal-title" style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.05rem', fontWeight: 800 }}>
                  <Truck size={22} style={{ color: '#00D2FF' }} /> Official Govt GST E-Way Bill Preparation Tool
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>NIC Schema Version: <strong>v1.0.0421</strong></span>
                  <span style={{ color: '#10B981', fontWeight: 700 }}>✓ Excel Prep Tool Compatible (EWB_Preparation_Tool_08122025)</span>
                </div>
              </div>
              <button className="vpm-modal-close-btn" style={{ color: '#94a3b8' }} onClick={() => setIsEwayModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="vpm-modal-body" style={{ padding: 20, maxHeight: '78vh', overflowY: 'auto' }}>
              
              {/* Mandatory Threshold Banner */}
              <div style={{ padding: '10px 14px', borderRadius: 10, background: roundedGrand >= 50000 ? 'rgba(16,185,129,0.1)' : '#fffbebf0', border: roundedGrand >= 50000 ? '1px solid #10B981' : '1px solid #fde68a', color: roundedGrand >= 50000 ? '#065F46' : '#92400e', fontSize: '0.8rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={18} style={{ color: roundedGrand >= 50000 ? '#10B981' : '#D97706', flexShrink: 0 }} />
                <span>
                  {roundedGrand >= 50000 ? (
                    <strong>Mandatory E-Way Bill Required: Invoice total is ₹{fmt(roundedGrand)} (Exceeds ₹50,000 threshold under GST Law).</strong>
                  ) : (
                    <span>Note: E-Way bills are compulsory for goods exceeding ₹50,000. (Current Invoice Total: ₹{fmt(roundedGrand)}). You can still generate & export for transport dispatch.</span>
                  )}
                </span>
              </div>

              {/* Document Overview Header */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                <div style={{ padding: 10, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>Document / Invoice No.</span>
                  <strong style={{ fontSize: '0.9rem', color: '#1E293B' }}>{billNo}</strong>
                </div>
                <div style={{ padding: 10, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>Supplier GSTIN (From)</span>
                  <strong style={{ fontSize: '0.9rem', color: '#10B981' }}>{company.gstNo}</strong>
                </div>
                <div style={{ padding: 10, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>Recipient GSTIN (To)</span>
                  <strong style={{ fontSize: '0.9rem', color: '#3B82F6' }}>{custGst || 'URP (Unregistered)'}</strong>
                </div>
              </div>

              {/* Supply & Document Classification */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Supply Type</label>
                  <select
                    value={ewaySupplyType}
                    onChange={e => setEwaySupplyType(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  >
                    <option value="O">O - Outward Supply</option>
                    <option value="I">I - Inward Supply</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Sub Supply Type</label>
                  <select
                    value={ewaySubSupplyType}
                    onChange={e => setEwaySubSupplyType(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  >
                    <option value="1">1 - Supply</option>
                    <option value="2">2 - Import</option>
                    <option value="3">3 - Export</option>
                    <option value="7">7 - Job Work</option>
                    <option value="8">8 - SKD/CKD</option>
                    <option value="12">12 - Others</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Document Type</label>
                  <select
                    value={ewayDocType}
                    onChange={e => setEwayDocType(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  >
                    <option value="INV">INV - Tax Invoice</option>
                    <option value="CHL">CHL - Delivery Challan</option>
                    <option value="BIL">BIL - Bill of Supply</option>
                  </select>
                </div>
              </div>

              {/* E-Way Transport & Pincodes Form */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Dispatch Pincode (From)</label>
                  <input
                    value={ewayFromPincode}
                    onChange={e => setEwayFromPincode(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 600 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Destination Pincode (To)</label>
                  <input
                    value={ewayToPincode}
                    onChange={e => setEwayToPincode(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 600 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Transport Mode</label>
                  <select
                    value={ewayTransMode}
                    onChange={e => setEwayTransMode(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  >
                    <option value="1">1 - Road</option>
                    <option value="2">2 - Rail</option>
                    <option value="3">3 - Air</option>
                    <option value="4">4 - Ship</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Vehicle Registration Number</label>
                  <input
                    placeholder="e.g. GJ01AB1234"
                    value={vehicleNo}
                    onChange={e => setVehicleNo(e.target.value.toUpperCase())}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Vehicle Type</label>
                  <select
                    value={ewayVehicleType}
                    onChange={e => setEwayVehicleType(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  >
                    <option value="R">R - Regular Cargo</option>
                    <option value="O">O - Over Dimensional Cargo (ODC)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Approx Transport Distance (in KM)</label>
                  <input
                    placeholder="e.g. 25"
                    value={distanceKm}
                    onChange={e => setDistanceKm(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Transporter Name</label>
                  <input
                    placeholder="e.g. Gujarat Logistics Ltd"
                    value={transporterName}
                    onChange={e => setTransporterName(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>L.R. / Airway / B.L. Doc No.</label>
                  <input
                    placeholder="e.g. LR-98421"
                    value={ewayTransDocNo}
                    onChange={e => setEwayTransDocNo(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>L.R. / Transport Doc Date</label>
                  <input
                    type="date"
                    value={ewayTransDocDate}
                    onChange={e => setEwayTransDocDate(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              {/* Taxable & Invoice Financial Breakdown Card */}
              <div style={{ padding: '12px 16px', background: '#F1F5F9', borderRadius: 10, fontSize: '0.82rem', marginBottom: 18, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Total Taxable Goods Value:</span>
                  <strong>₹{fmt(subtotal)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>CGST (9%) + SGST (9%):</span>
                  <strong>₹{fmt(cgst + sgst)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#0F172A', fontWeight: 800, borderTop: '1px solid #CBD5E1', paddingTop: 6 }}>
                  <span>Total Invoice Value (Inc. Tax):</span>
                  <span style={{ color: '#10B981' }}>₹{fmt(roundedGrand)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  onClick={copyGovtEwayJson}
                  style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#fff', color: ewayJsonCopied ? '#10B981' : '#334155', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Copy size={15} /> {ewayJsonCopied ? 'Copied NIC JSON!' : 'Copy JSON Payload'}
                </button>

                <button
                  onClick={downloadGovtEwayExcelSheet}
                  style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #10B981', background: 'rgba(16,185,129,0.1)', color: '#059669', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  title="Export Excel Sheet in format of EWB_Preparation_Tool_08122025.xlsm"
                >
                  <FileSpreadsheet size={15} /> Export EWB Excel Sheet (.xlsx)
                </button>

                <button
                  onClick={downloadGovtEwayJson}
                  style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
                >
                  <FileDown size={16} /> Download Official Govt JSON (.json)
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ═══════════ MODAL 4: LOAD PREVIOUS BILL / HISTORY MODAL ═══════════ */}
      {isHistoryModalOpen && (
        <div className="vpm-modal-backdrop" onClick={() => setIsHistoryModalOpen(false)}>
          <div className="vpm-modal-card" style={{ maxWidth: 820, width: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="vpm-modal-header" style={{ background: 'linear-gradient(135deg, #736efe, #00D2FF)', color: '#fff' }}>
              <div className="vpm-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
                <HistoryIcon size={20} /> Select & Load Previous Bill into Editor
              </div>
              <button className="vpm-modal-close-btn" style={{ color: '#fff' }} onClick={() => setIsHistoryModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="vpm-modal-body" style={{ padding: 20, maxHeight: '75vh', overflowY: 'auto' }}>
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: 14 }}>
                Click any saved bill below to load its full details, customer information, rates, and line items directly into this editor:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {allSavedInvoices.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8' }}>
                    No previous bills found in storage.
                  </div>
                ) : (
                  allSavedInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => {
                        loadInvoiceData(inv)
                        setIsHistoryModalOpen(false)
                      }}
                      style={{
                        padding: '12px 16px', borderRadius: 10, border: '1.5px solid #E2E8F0',
                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        transition: 'all 0.2s ease', background: '#F8FAFC'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#736efe'
                        e.currentTarget.style.background = 'rgba(115,110,254,0.06)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#E2E8F0'
                        e.currentTarget.style.background = '#F8FAFC'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong style={{ fontSize: '0.9rem', color: '#736efe', fontFamily: 'monospace' }}>{inv.invoice_number}</strong>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 7px', borderRadius: 4, background: '#E2E8F0', color: '#475569' }}>
                            {inv.type}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginTop: 3 }}>
                          Customer: {inv.customer_name} {inv.customer_mobile ? `(${inv.customer_mobile})` : ''}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          Date: {inv.date} • {inv.items?.length || 0} Line Items
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, fontSize: '1rem', color: '#10B981' }}>
                          ₹{fmt(inv.grand_total || 0)}
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#736efe', marginTop: 4 }}>
                          Click to Edit ✏️
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ MODAL 5: CATALOG QUICK PRODUCT PICKER MODAL ═══════════ */}
      {showCatalogPickerModal && (
        <div className="vpm-modal-backdrop" onClick={() => setShowCatalogPickerModal(false)}>
          <div className="vpm-modal-card" style={{ maxWidth: 760, width: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="vpm-modal-header" style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff' }}>
              <div className="vpm-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
                <Package size={20} /> Select Product from Catalog
              </div>
              <button className="vpm-modal-close-btn" style={{ color: '#fff' }} onClick={() => setShowCatalogPickerModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="vpm-modal-body" style={{ padding: 20 }}>
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search catalog products by name, HSN, unit, rate..."
                  value={catalogSearchQuery}
                  onChange={e => setCatalogSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: '0.86rem' }}
                />
              </div>

              <div style={{ maxHeight: 380, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {productList.filter(p => !catalogSearchQuery.trim() || p.name.toLowerCase().includes(catalogSearchQuery.toLowerCase()) || (p.hsn && p.hsn.includes(catalogSearchQuery))).map(prod => (
                  <div
                    key={prod.id}
                    onClick={() => addProductFromCatalogPicker(prod)}
                    style={{
                      padding: '12px 14px', borderRadius: 12, border: '1.5px solid #E2E8F0', background: '#F8FAFC',
                      cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#10B981'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1E293B', marginBottom: 4 }}>
                        {prod.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B', display: 'flex', gap: 8 }}>
                        <span>HSN: {prod.hsn || '9983'}</span>
                        <span>Unit: {prod.unit || 'pcs'}</span>
                      </div>
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#10B981' }}>
                        ₹{prod.price}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#736efe', background: 'rgba(115,110,254,0.1)', padding: '2px 8px', borderRadius: 6 }}>
                        + Add to Bill
                      </span>
                    </div>
                  </div>
                ))}
               </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default EstimateBill
