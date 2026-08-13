import React, { useState, useRef, useCallback, useEffect } from 'react'
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
  Receipt,
  Tag,
  MessageCircle,
  Mail
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { customersApi, productsApi, type CustomerData } from '../api/apiClient'
import { getNextInvoiceNumber, DataService, type Invoice } from '../services/dataService'
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
}

interface ProductItem {
  id: number
  name: string
  unit: string
  price: number | string
  gst_rate: number | string
  hsn?: string
}

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

const UNITS = ['pcs', 'sqft', 'meter', 'kg', 'litre', 'sheet', 'roll', 'set', 'nos', 'hr']
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

  // Company details
  const company: CompanyDetails = {
    ...defaultCompany,
    name: user?.company?.name || defaultCompany.name,
    gstNo: user?.company?.gstNumber || defaultCompany.gstNo,
    address: user?.company?.address || defaultCompany.address,
    phone: user?.company?.phone || defaultCompany.phone,
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

  // E-Way Bill Modal States
  const [isEwayModalOpen, setIsEwayModalOpen] = useState(false)
  const [ewayFromPincode, setEwayFromPincode] = useState('382424')
  const [ewayToPincode, setEwayToPincode]     = useState('380054')
  const [ewayTransMode]                       = useState('1')
  const [ewayJsonCopied, setEwayJsonCopied]   = useState(false)

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
  const [activeItemSearchId, setActiveItemSearchId] = useState<number | null>(null)
  const [activeItemSearchIndex, setActiveItemSearchIndex] = useState<number>(0)
  const [productList, setProductList] = useState<ProductItem[]>(() => {
    const localProds = DataService.getProducts()
    return localProds.map(p => ({
      id: p.id,
      name: p.name,
      unit: p.unit || 'pcs',
      price: p.price || 0,
      gst_rate: p.gst_rate || 18,
      hsn: p.hsn_code || '9983'
    }))
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

  // Load products list from API on mount
  useEffect(() => {
    productsApi.getAll().then(res => {
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setProductList(res.data.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          unit: p.unit || 'pcs',
          price: p.price !== undefined ? p.price : 0,
          gst_rate: p.gst_rate !== undefined ? p.gst_rate : 18,
          hsn: p.hsn_code || p.hsn || '9983'
        })))
      }
    }).catch(() => {})
  }, [])

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

  // ── Add Product from Catalog / Autocomplete ──────────────────
  const selectProductForItemRow = (itemId: number, prod: ProductItem) => {
    setItems(prev => prev.map(it => it.id === itemId ? {
      ...it,
      description: prod.name,
      hsn: prod.hsn || '9983',
      unit: prod.unit || 'pcs',
      rate: String(prod.price !== undefined ? prod.price : '0'),
      gstPct: String(prod.gst_rate !== undefined ? prod.gst_rate : '18'),
    } : it))
    setActiveItemSearchId(null)
    setActiveItemSearchIndex(0)
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
      setActiveItemSearchId(null)
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

  const generateGovtEwayJsonPayload = useCallback(() => {
    const cleanGstFrom = company.gstNo.replace(/[^A-Z0-9]/gi, '')
    const cleanGstTo   = custGst ? custGst.replace(/[^A-Z0-9]/gi, '') : 'URP'

    const stateCodeFrom = parseInt(company.stateCode, 10) || 24
    const stateCodeTo   = custStateInfo ? parseInt(custStateInfo.stateCode, 10) : 24

    const formattedDate = billDate ? billDate.split('-').reverse().join('/') : new Date().toLocaleDateString('en-IN')

    const itemsPayload = items.map(item => {
      const qty  = parseFloat(item.qty) || 0
      const rate = parseFloat(item.rate) || 0
      const base = qty * rate
      return {
        productName: item.description || 'Printing Services',
        productDesc: item.description || 'Print Items',
        hsnCode: parseInt((item.hsn || '9983').replace(/[^0-9]/g, ''), 10) || 9983,
        quantity: qty,
        qtyUnit: item.unit ? item.unit.toUpperCase() : 'SQF',
        taxableAmount: base,
        cgstRate: isInterState ? 0 : 9,
        sgstRate: isInterState ? 0 : 9,
        igstRate: isInterState ? 18 : 0,
        cessRate: 0
      }
    })

    return {
      version: "1.0.0421",
      billDtls: [
        {
          userGstin: cleanGstFrom,
          supplyType: "O",
          subSupplyType: "1",
          docType: "INV",
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
          transDocNo: "",
          transDocDate: "",
          vehicleNo: vehicleNo ? vehicleNo.replace(/[^A-Z0-9]/gi, '') : "",
          vehicleType: "R",
          itemList: itemsPayload
        }
      ]
    }
  }, [company, custGst, custStateInfo, billDate, items, billNo, ewayFromPincode, ewayToPincode, custName, custAddress, subtotal, isInterState, cgst, sgst, roundedGrand, ewayTransMode, distanceKm, transporterName, vehicleNo])

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

  // ── Print Action ──
  const handlePrint = async () => {
    if (custName.trim()) {
      saveCustomerToDb()
    }
    saveCurrentInvoiceToDb()
    window.print()
  }

  const MIN_ROWS = billType === 'ESTIMATE' ? 8 : 10
  const fillerCount = Math.max(0, MIN_ROWS - items.length)
  const formatTitle = billType === 'TAX_INVOICE' ? 'Tax Invoice' : billType === 'QUOTATION' ? 'Quotation' : 'Estimate Bill'
  const allSavedInvoices = DataService.getInvoices()

  return (
    <div className={`estimate-panel ${cls}`}>

      {/* ═══════════ LEFT: INPUT FORM ═══════════ */}
      <div className="estimate-form-panel">

        {/* Format Selector Bar */}
        <div style={{ display: 'flex', background: isDark ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.9)', padding: 4, borderRadius: 12, border: '1.5px solid var(--eb-border)', gap: 4, marginBottom: 4 }}>
          <button
            onClick={() => {
              setEditingInvoiceId(null)
              onClearEditing?.()
              setBillType('TAX_INVOICE')
              setBillNo(getNextInvoiceNumber('TAX_INVOICE', billDate))
            }}
            style={{
              flex: 1, padding: '7px 8px', borderRadius: 8, border: 'none', fontWeight: 800, fontSize: '0.76rem', cursor: 'pointer',
              background: billType === 'TAX_INVOICE' ? 'linear-gradient(135deg, #736efe, #00D2FF)' : 'transparent',
              color: billType === 'TAX_INVOICE' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
              boxShadow: billType === 'TAX_INVOICE' ? '0 3px 10px rgba(115,110,254,0.3)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all 0.2s ease'
            }}
          >
            <Receipt size={14} /> Tax Invoice
          </button>

          <button
            onClick={() => {
              setEditingInvoiceId(null)
              onClearEditing?.()
              setBillType('QUOTATION')
              setBillNo(getNextInvoiceNumber('QUOTATION', billDate))
            }}
            style={{
              flex: 1, padding: '7px 8px', borderRadius: 8, border: 'none', fontWeight: 800, fontSize: '0.76rem', cursor: 'pointer',
              background: billType === 'QUOTATION' ? 'linear-gradient(135deg, #00D2FF, #00A8FF)' : 'transparent',
              color: billType === 'QUOTATION' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
              boxShadow: billType === 'QUOTATION' ? '0 3px 10px rgba(0,210,255,0.3)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all 0.2s ease'
            }}
          >
            <FileText size={14} /> Quotation
          </button>

          <button
            onClick={() => {
              setEditingInvoiceId(null)
              onClearEditing?.()
              setBillType('ESTIMATE')
              setBillNo(getNextInvoiceNumber('ESTIMATE', billDate))
            }}
            style={{
              flex: 1, padding: '7px 8px', borderRadius: 8, border: 'none', fontWeight: 800, fontSize: '0.76rem', cursor: 'pointer',
              background: billType === 'ESTIMATE' ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'transparent',
              color: billType === 'ESTIMATE' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
              boxShadow: billType === 'ESTIMATE' ? '0 3px 10px rgba(245,158,11,0.3)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all 0.2s ease'
            }}
          >
            <Tag size={14} /> Estimate Bill
          </button>
        </div>

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
            onClick={() => DataService.saveBackupToFileDrive()}
            style={{ fontSize: '0.76rem', fontWeight: 800, padding: '6px 11px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', borderColor: 'rgba(99,102,241,0.25)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
            title="Backup all bill data as JSON file to drive"
          >
            <HardDrive size={13} /> JSON Backup
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
                <label>Mobile No.</label>
                <input
                  placeholder="9XXXXXXXXX"
                  value={custMobile}
                  onChange={e => setCustMobile(e.target.value)}
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
          <div className="eb-card-body" style={{ padding: 10 }}>

            {/* Inline Items Table with Product Search Autocomplete */}
            <div className="eb-items-table-wrap" style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 8 }}>
              <table className="eb-items-table" style={{ width: '100%', minWidth: 460 }}>
                <thead>
                  <tr>
                    <th style={{ width: 24 }}>#</th>
                    <th style={{ minWidth: 150 }}>Product / Description</th>
                    <th style={{ width: 55 }}>Qty</th>
                    <th style={{ width: 75 }}>Rate</th>
                    <th style={{ width: 75, textAlign: 'right' }}>Total</th>
                    <th style={{ width: 28 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const { total } = calcRow(item)
                    const matches = getProductMatches(item.description)
                    const showDropdown = activeItemSearchId === (item.id + 100000) && matches.length > 0

                    return (
                      <tr key={item.id}>
                        <td style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>{idx + 1}</td>
                        <td style={{ position: 'relative' }}>
                          <input
                            placeholder="Type product name..."
                            value={item.description}
                            onChange={e => {
                              updateItem(item.id, 'description', e.target.value)
                              setActiveItemSearchId(item.id + 100000)
                              setActiveItemSearchIndex(0)
                            }}
                            onFocus={() => {
                              setActiveItemSearchId(item.id + 100000)
                              setActiveItemSearchIndex(0)
                            }}
                            onKeyDown={e => handleItemKeyDown(e, item.id, matches)}
                            onBlur={() => setTimeout(() => setActiveItemSearchId(null), 250)}
                            style={{ width: '100%', padding: '5px 8px', fontSize: '0.8rem' }}
                          />

                          {/* Autocomplete Dropdown */}
                          {showDropdown && (
                            <div className="eb-product-autocomplete-menu" style={{ minWidth: 280 }}>
                              <div className="eb-product-autocomplete-header">
                                <span><Package size={11} style={{ display: 'inline', marginRight: 4 }} /> Catalog Suggestions</span>
                                <span style={{ fontSize: '0.6rem', opacity: 0.85 }}>↑ ↓ · Enter</span>
                              </div>
                              {matches.map((p, pIdx) => {
                                const isSelected = activeItemSearchIndex === pIdx
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
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div className="eb-product-title">
                                        <Package size={12} style={{ color: '#736efe', flexShrink: 0 }} />
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                                      </div>
                                      <div className="eb-product-meta">
                                        {p.unit && <span>{p.unit}</span>}
                                        {billType !== 'ESTIMATE' && p.gst_rate !== undefined && (
                                          <span style={{ color: '#10B981', fontWeight: 700 }}>{p.gst_rate}% GST</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="eb-product-price-tag" style={{ fontSize: '0.78rem' }}>
                                      ₹{p.price}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
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

        {/* Action Buttons (Print, Save PDF, WhatsApp Share, Email Share, Reset) */}
        <div className="eb-actions">
          <button className="eb-btn-action eb-btn-print" onClick={handlePrint} title="Print Bill directly to printer or save as PDF">
            <Printer size={15} />
            <span>Print Bill</span>
          </button>
          <button className="eb-btn-action eb-btn-download" onClick={handlePrint} title="Download & Save Bill as PDF Document">
            <Download size={15} />
            <span>Download PDF</span>
          </button>
          <button
            className="eb-btn-action eb-btn-whatsapp"
            onClick={() => {
              const text = `*VIRAL PRINT MEDIA - ${formatTitle}*\nInvoice No: ${billNo}\nCustomer: ${custName}\nTotal Amount: ₹${roundedGrand}\n\nThank you for doing business with Viral Print Media!`
              const mob = custMobile.replace(/\D/g, '')
              window.open(`https://wa.me/${mob}?text=${encodeURIComponent(text)}`, '_blank')
            }}
            title="Send Invoice Summary via WhatsApp"
          >
            <MessageCircle size={15} />
            <span>WhatsApp</span>
          </button>
          <button
            className="eb-btn-action eb-btn-email"
            onClick={() => {
              const subject = `Invoice ${billNo} from Viral Print Media`
              const body = `Dear ${custName || 'Customer'},\n\nPlease find the details for ${formatTitle} ${billNo}.\nGrand Total: ₹${roundedGrand}\n\nViral Print Media\nAhmedabad, Gujarat`
              window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
            }}
            title="Send Invoice Summary via Email"
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
                          <th style={{ width: 40 }}>Sr. No.</th>
                          <th style={{ textAlign: 'left' }}>DESCRIPTION</th>
                          {billType === 'TAX_INVOICE' && <th style={{ width: 70 }}>HSN</th>}
                          <th style={{ width: 55 }}>TAX%</th>
                          <th style={{ width: 55 }}>QTY</th>
                          <th style={{ width: 85 }}>RATE</th>
                          <th style={{ width: 100 }}>AMOUNT</th>
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
                              <td className="center">{gstPct}%</td>
                              <td className="center">{item.qty}</td>
                              <td className="right">{item.rate ? fmt(parseFloat(item.rate)) : ''}</td>
                              <td className="right bold">{total > 0 ? fmt(total) : ''}</td>
                            </tr>
                          )
                        })}

                        {/* Blank filler lines extending table to bottom */}
                        {Array.from({ length: fillerCount }).map((_, i) => (
                          <tr key={`blank-${i}`}>
                            <td className="center"></td>
                            <td>&nbsp;</td>
                            {billType === 'TAX_INVOICE' && <td></td>}
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
                        {/* Swoosh Logo matching Page 3 */}
                        <div style={{
                          width: 70, height: 60, borderRadius: 6,
                          background: 'linear-gradient(135deg,#736efe,#00D2FF)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 900, fontSize: 11, textAlign: 'center'
                        }}>
                          VIRAL<br/>PRINT
                        </div>
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
                          <th style={{ width: 70 }}>QTY</th>
                          <th style={{ width: 100 }}>RATE</th>
                          <th style={{ width: 120 }}>AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => {
                          const { total } = calcRow(item)
                          return (
                            <tr key={item.id}>
                              <td className="center bold">{idx + 1}</td>
                              <td>{item.description || ''}</td>
                              <td className="center">{item.qty}</td>
                              <td className="right">{item.rate ? fmt(parseFloat(item.rate)) : ''}</td>
                              <td className="right bold">{total > 0 ? fmt(total) : ''}</td>
                            </tr>
                          )
                        })}

                        {Array.from({ length: fillerCount }).map((_, i) => (
                          <tr key={`blank-est-${i}`}>
                            <td className="center"></td>
                            <td>&nbsp;</td>
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
                  </>
                )}

                {/* ── TERMS & CONDITIONS + SIGNATURE FOOTER ── */}
                <div className="pdf-terms-sig-row">
                  <div className="pdf-terms-col">
                    <div className="pdf-terms-title">TERMS & CONDITIONS :</div>
                    <ul className="pdf-terms-list">
                      <li>Goods once sold will not be accepted.</li>
                      <li>Subject to Ahmedabad Jurisdiction.</li>
                    </ul>
                  </div>

                  <div className="pdf-sig-col">
                    <div>For, VIRAL PRINT MEDIA</div>
                    <div style={{ height: 35 }}></div>
                    <div style={{ textDecoration: 'overline', paddingTop: 2 }}>Authorised Signatory</div>
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

              <div className="eb-items-table-wrap" style={{ maxHeight: 380, overflowY: 'auto' }}>
                <table className="eb-items-table" style={{ width: '100%', minWidth: 700 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 30 }}>#</th>
                      <th style={{ minWidth: 220 }}>Description & Product Search</th>
                      {billType === 'TAX_INVOICE' && <th style={{ width: 75 }}>HSN</th>}
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
                      const showDropdown = activeItemSearchId === item.id && matches.length > 0

                      return (
                        <tr key={item.id}>
                          <td style={{ textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, color: '#94A3B8' }}>{idx + 1}</td>
                          <td style={{ position: 'relative' }}>
                            <input
                              placeholder="Type item description or search product..."
                              value={item.description}
                              onChange={e => {
                                updateItem(item.id, 'description', e.target.value)
                                setActiveItemSearchId(item.id)
                                setActiveItemSearchIndex(0)
                              }}
                              onFocus={() => {
                                setActiveItemSearchId(item.id)
                                setActiveItemSearchIndex(0)
                              }}
                              onKeyDown={e => handleItemKeyDown(e, item.id, matches)}
                              onBlur={() => setTimeout(() => setActiveItemSearchId(null), 250)}
                              style={{ width: '100%', padding: '7px 10px', fontSize: '0.85rem' }}
                            />

                            {/* Item Row Product Search Autocomplete Menu */}
                            {showDropdown && (
                              <div className="eb-product-autocomplete-menu">
                                <div className="eb-product-autocomplete-header">
                                  <span><Package size={12} style={{ display: 'inline', marginRight: 4 }} /> Saved Product Catalog Suggestions</span>
                                  <span style={{ fontSize: '0.62rem', opacity: 0.85 }}>↑ ↓ Navigate · Enter Select</span>
                                </div>
                                {matches.map((p, pIdx) => {
                                  const isSelected = activeItemSearchIndex === pIdx
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
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="eb-product-title">
                                          <Package size={13} style={{ color: '#736efe', flexShrink: 0 }} />
                                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                                        </div>
                                        <div className="eb-product-meta">
                                          {p.hsn && <span>HSN: {p.hsn}</span>}
                                          {billType !== 'ESTIMATE' && p.gst_rate !== undefined && (
                                            <span style={{ color: '#10B981', fontWeight: 700 }}>{p.gst_rate}% GST</span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="eb-product-price-tag">
                                        ₹{p.price} / {p.unit || 'pcs'}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </td>
                          {billType === 'TAX_INVOICE' && (
                            <td>
                              <input
                                placeholder="9983"
                                value={item.hsn}
                                onChange={e => updateItem(item.id, 'hsn', e.target.value)}
                              />
                            </td>
                          )}
                          <td>
                            <select value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)}>
                              {UNITS.map(u => <option key={u}>{u}</option>)}
                            </select>
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
          <div className="vpm-modal-card" style={{ maxWidth: 760 }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="vpm-modal-header" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#fff' }}>
              <div className="vpm-modal-title" style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Truck size={20} /> Official Govt GST E-Way Bill Generator (NIC v1.0.0421)
              </div>
              <button className="vpm-modal-close-btn" style={{ color: '#94a3b8' }} onClick={() => setIsEwayModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="vpm-modal-body" style={{ padding: 20 }}>
              
              {/* Threshold Warning / Info Banner */}
              {roundedGrand < 50000 && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fffbebf0', border: '1px solid #fde68a', color: '#92400e', fontSize: '0.8rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={16} /> Note: Under GST Law, E-Way bills are compulsory for goods exceeding ₹50,000. (Current Invoice Total: ₹{fmt(roundedGrand)}). You can still generate & export for transport dispatch.
                </div>
              )}

              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
                <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>Document / Invoice No.</span>
                  <strong style={{ fontSize: '0.92rem', color: '#1E293B' }}>{billNo}</strong>
                </div>
                <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>Supplier GSTIN (From)</span>
                  <strong style={{ fontSize: '0.92rem', color: '#10B981' }}>{company.gstNo}</strong>
                </div>
                <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>Recipient GSTIN (To)</span>
                  <strong style={{ fontSize: '0.92rem', color: '#3B82F6' }}>{custGst || 'URP (Unregistered)'}</strong>
                </div>
              </div>

              {/* E-Way Transport Inputs Form */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 18 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Dispatch Pincode (From)</label>
                  <input
                    value={ewayFromPincode}
                    onChange={e => setEwayFromPincode(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 600 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Destination Pincode (To)</label>
                  <input
                    value={ewayToPincode}
                    onChange={e => setEwayToPincode(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 600 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Vehicle Number</label>
                  <input
                    placeholder="e.g. GJ01AB1234"
                    value={vehicleNo}
                    onChange={e => setVehicleNo(e.target.value.toUpperCase())}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Approx Distance (in Km)</label>
                  <input
                    placeholder="e.g. 25"
                    value={distanceKm}
                    onChange={e => setDistanceKm(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 600 }}
                  />
                </div>
              </div>

              {/* Taxable & Invoice Financial Breakdown */}
              <div style={{ padding: '12px 16px', background: '#F1F5F9', borderRadius: 8, fontSize: '0.82rem', marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Total Taxable Value:</span>
                  <strong>₹{fmt(subtotal)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>CGST (9%) + SGST (9%):</span>
                  <strong>₹{fmt(cgst + sgst)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', color: '#0F172A', fontWeight: 800, borderTop: '1px solid #CBD5E1', paddingTop: 6 }}>
                  <span>Total Invoice Value:</span>
                  <span style={{ color: '#10B981' }}>₹{fmt(roundedGrand)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  onClick={copyGovtEwayJson}
                  style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#fff', color: ewayJsonCopied ? '#10B981' : '#334155', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Copy size={15} /> {ewayJsonCopied ? 'Copied NIC JSON!' : 'Copy JSON Payload'}
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

    </div>
  )
}

export default EstimateBill
