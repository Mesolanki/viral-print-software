import React, { useState, useEffect, useMemo } from 'react'
import {
  Row,
  Col,
  Card,
  Form,
  Modal,
  Spinner,
  Alert,
  Table,
  InputGroup
} from 'react-bootstrap'
import {
  Package,
  PackagePlus,
  Tag,
  TagsIcon,
  Search,
  X,
  Edit2,
  Trash2,
  RefreshCw,
  Sparkles,
  AlertCircle,
  IndianRupee,
  Percent,
  Layers,
  CheckCircle2,
  PlusCircle,
  Box
} from 'lucide-react'
import { DataService } from '../services/dataService'
import './ProductManagement.css'

// ── Constants ─────────────────────────────────────────────────────
const API_HOST =
  typeof window !== 'undefined' && window.location?.hostname
    ? window.location.hostname
    : 'localhost'
const API_BASE_URL = `http://${API_HOST}:5000/api`
const DEFAULT_COMPANY_ID = 1

const GST_OPTIONS = [0, 5, 12, 18, 28]

const UNIT_OPTIONS = [
  'pcs',
  'roll',
  'sqft',
  'sqmt',
  'meter',
  'feet',
  'inch',
  'kg',
  'litre',
  'sheet',
  'packet',
  'ream',
  'box',
  'set',
  'nos',
  'bundle',
  'job',
  'carton',
  'hr',
  'Other'
]

// ── Types ──────────────────────────────────────────────────────────
export interface Category {
  id: number
  company_id: number
  name: string
  createdAt?: string
}

export interface Product {
  id: number
  company_id: number
  category_id: number
  category?: { id: number; name: string }
  name: string
  unit: string
  price: number | string
  gst_rate: number | string
  hsn_code?: string | null
  description?: string | null
  createdAt?: string
}

interface ProductManagementProps {
  theme?: 'dark' | 'light'
}

// ── Helpers ────────────────────────────────────────────────────────
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('vpm_auth_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

const fmtPrice = (v: number | string): string => {
  const n = Number(v)
  return isNaN(n) ? '0.00' : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Sample Data (fallback) ─────────────────────────────────────────
const SAMPLE_CATEGORIES: Category[] = [
  { id: 1, company_id: 1, name: 'Banners & Flex', createdAt: new Date().toISOString() },
  { id: 2, company_id: 1, name: 'Visiting Cards', createdAt: new Date().toISOString() },
  { id: 3, company_id: 1, name: 'Stickers & Labels', createdAt: new Date().toISOString() },
  { id: 4, company_id: 1, name: 'Brochures & Flyers', createdAt: new Date().toISOString() },
  { id: 5, company_id: 1, name: 'Canvas Prints', createdAt: new Date().toISOString() }
]

const SAMPLE_PRODUCTS: Product[] = [
  { id: 1, company_id: 1, category_id: 1, category: { id: 1, name: 'Banners & Flex' }, name: 'Star Flex Banner (1mm)', unit: 'sqft', price: 35, gst_rate: 18, description: 'Premium 1mm star flex, outdoor quality' },
  { id: 2, company_id: 1, category_id: 1, category: { id: 1, name: 'Banners & Flex' }, name: 'Non-Woven Banner', unit: 'sqft', price: 28, gst_rate: 18, description: 'Eco-friendly non-woven material' },
  { id: 3, company_id: 1, category_id: 2, category: { id: 2, name: 'Visiting Cards' }, name: 'Matt Visiting Card (500pcs)', unit: 'set', price: 250, gst_rate: 12, description: '350gsm matt laminated, UV coated' },
  { id: 4, company_id: 1, category_id: 2, category: { id: 2, name: 'Visiting Cards' }, name: 'Gloss Visiting Card (1000pcs)', unit: 'set', price: 450, gst_rate: 12, description: '400gsm gloss laminated, double sided' },
  { id: 5, company_id: 1, category_id: 3, category: { id: 3, name: 'Stickers & Labels' }, name: 'Vinyl Sticker Printing', unit: 'sqft', price: 60, gst_rate: 18, description: 'Waterproof vinyl, outdoor grade' },
  { id: 6, company_id: 1, category_id: 4, category: { id: 4, name: 'Brochures & Flyers' }, name: 'A4 Flyer (Single Side)', unit: 'pcs', price: 3.5, gst_rate: 12, description: '130gsm glossy paper, CMYK full-color' },
  { id: 7, company_id: 1, category_id: 5, category: { id: 5, name: 'Canvas Prints' }, name: 'Canvas Photo Print 12x18', unit: 'pcs', price: 380, gst_rate: 18, description: 'Gallery wrapped, 1.5" deep frame' }
]

// ═══════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function ProductManagement({ theme = 'dark' }: ProductManagementProps): React.JSX.Element {
  const isDark = theme === 'dark'

  // ── Data State ──────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [catsLoading, setCatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // ── Filters ─────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [activeView, setActiveView] = useState<'products' | 'categories'>('products')

  // ── Product Modal ───────────────────────────────────────────────
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [pName, setPName] = useState('')
  const [pCategory, setPCategory] = useState<string>('')
  const [pUnit, setPUnit] = useState('pcs')
  const [pPrice, setPPrice] = useState('')
  const [pGst, setPGst] = useState<number>(18)
  const [pHsn, setPHsn] = useState('9983')
  const [pDesc, setPDesc] = useState('')
  const [pSubmitting, setPSubmitting] = useState(false)

  // ── Category Modal ──────────────────────────────────────────────
  const [showCatModal, setShowCatModal] = useState(false)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [catName, setCatName] = useState('')
  const [catSubmitting, setCatSubmitting] = useState(false)

  // ── Load data ───────────────────────────────────────────────────
  useEffect(() => {
    fetchCategories()
    fetchProducts()
  }, [])

  const fetchCategories = async (): Promise<void> => {
    setCatsLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/categories?company_id=${DEFAULT_COMPANY_ID}`, {
        headers: getAuthHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setCategories(Array.isArray(data) ? data : SAMPLE_CATEGORIES)
      } else {
        setCategories(SAMPLE_CATEGORIES)
      }
    } catch {
      setCategories(SAMPLE_CATEGORIES)
    } finally {
      setCatsLoading(false)
    }
  }

  const fetchProducts = async (): Promise<void> => {
    setLoading(true)
    try {
      const res = await fetch(
        `${API_BASE_URL}/products?company_id=${DEFAULT_COMPANY_ID}`,
        { headers: getAuthHeaders() }
      )
      if (res.ok) {
        const data = await res.json()
        setProducts(Array.isArray(data) ? data : SAMPLE_PRODUCTS)
      } else {
        setProducts(SAMPLE_PRODUCTS)
      }
    } catch {
      setProducts(SAMPLE_PRODUCTS)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (msg: string): void => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3500)
  }

  // ── Product CRUD ─────────────────────────────────────────────────
  const openAddProduct = (): void => {
    setEditingProduct(null)
    setPName('')
    setPCategory(categories[0]?.id?.toString() || '')
    setPUnit('pcs')
    setPPrice('')
    setPGst(18)
    setPHsn('9983')
    setPDesc('')
    setError(null)
    setShowProductModal(true)
  }

  const openEditProduct = (p: Product): void => {
    setEditingProduct(p)
    setPName(p.name)
    setPCategory(p.category_id.toString())
    setPUnit(p.unit)
    setPPrice(String(Number(p.price)))
    setPGst(Number(p.gst_rate))
    setPHsn(p.hsn_code || '9983')
    setPDesc(p.description || '')
    setError(null)
    setShowProductModal(true)
  }

  const handleSaveProduct = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!pName.trim()) { setError('Product name is required.'); return }
    if (!pCategory) { setError('Please select a category.'); return }
    if (!pPrice || isNaN(Number(pPrice)) || Number(pPrice) < 0) {
      setError('Please enter a valid price.')
      return
    }

    setPSubmitting(true)
    setError(null)

    const payload = {
      company_id: DEFAULT_COMPANY_ID,
      category_id: Number(pCategory),
      name: pName.trim(),
      unit: pUnit,
      price: Number(pPrice),
      gst_rate: pGst,
      hsn_code: pHsn.trim() || '9983',
      description: pDesc.trim() || null
    }

    const catObj = categories.find((c) => c.id === Number(pCategory))

    try {
      if (editingProduct) {
        const res = await fetch(`${API_BASE_URL}/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        })
        const updated: Product = res.ok
          ? { ...editingProduct, ...payload, category: catObj ? { id: catObj.id, name: catObj.name } : editingProduct.category }
          : { ...editingProduct, ...payload, category: catObj ? { id: catObj.id, name: catObj.name } : editingProduct.category }
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? updated : p)))
        DataService.saveProduct({
          id: updated.id,
          name: updated.name,
          category: updated.category?.name || 'General',
          unit: updated.unit,
          price: Number(updated.price),
          gst_rate: Number(updated.gst_rate),
          hsn_code: updated.hsn_code || '9983',
          description: updated.description || ''
        })
        showToast(`Product "${updated.name}" updated successfully!`)
      } else {
        const res = await fetch(`${API_BASE_URL}/products`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        })
        let newProduct: Product
        if (res.ok) {
          const raw = await res.json()
          newProduct = {
            ...raw,
            category: catObj ? { id: catObj.id, name: catObj.name } : undefined
          }
        } else {
          newProduct = {
            id: Date.now(),
            ...payload,
            category: catObj ? { id: catObj.id, name: catObj.name } : undefined
          }
        }
        setProducts((prev) => [newProduct, ...prev])
        DataService.saveProduct({
          id: newProduct.id,
          name: newProduct.name,
          category: newProduct.category?.name || 'General',
          unit: newProduct.unit,
          price: Number(newProduct.price),
          gst_rate: Number(newProduct.gst_rate),
          hsn_code: newProduct.hsn_code || '9983',
          description: newProduct.description || ''
        })
        showToast(`Product "${newProduct.name}" created successfully!`)
      }
      setShowProductModal(false)
    } catch {
      const localProduct: Product = {
        id: editingProduct ? editingProduct.id : Date.now(),
        ...payload,
        category: catObj ? { id: catObj.id, name: catObj.name } : undefined
      }
      if (editingProduct) {
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? localProduct : p)))
      } else {
        setProducts((prev) => [localProduct, ...prev])
      }
      DataService.saveProduct({
        id: localProduct.id,
        name: localProduct.name,
        category: localProduct.category?.name || 'General',
        unit: localProduct.unit,
        price: Number(localProduct.price),
        gst_rate: Number(localProduct.gst_rate),
        hsn_code: localProduct.hsn_code || '9983',
        description: localProduct.description || ''
      })
      showToast(`Product "${localProduct.name}" saved locally.`)
      setShowProductModal(false)
    } finally {
      setPSubmitting(false)
    }
  }

  const handleDeleteProduct = async (id: number, name: string): Promise<void> => {
    if (!window.confirm(`Delete product "${name}"? This cannot be undone.`)) return
    setProducts((prev) => prev.filter((p) => p.id !== id))
    showToast(`Product "${name}" deleted.`)
    try {
      await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
    } catch { /* noop */ }
  }

  // ── Category CRUD ────────────────────────────────────────────────
  const openAddCategory = (): void => {
    setEditingCat(null)
    setCatName('')
    setError(null)
    setShowCatModal(true)
  }

  const openEditCategory = (c: Category): void => {
    setEditingCat(c)
    setCatName(c.name)
    setError(null)
    setShowCatModal(true)
  }

  const handleSaveCategory = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!catName.trim()) { setError('Category name is required.'); return }

    setCatSubmitting(true)
    setError(null)

    try {
      if (editingCat) {
        // Update locally (backend may not have update endpoint)
        const updated: Category = { ...editingCat, name: catName.trim() }
        setCategories((prev) => prev.map((c) => (c.id === editingCat.id ? updated : c)))
        showToast(`Category "${updated.name}" updated!`)
      } else {
        const res = await fetch(`${API_BASE_URL}/categories`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ company_id: DEFAULT_COMPANY_ID, name: catName.trim() })
        })
        let newCat: Category
        if (res.ok) {
          newCat = await res.json()
        } else {
          newCat = {
            id: Date.now(),
            company_id: DEFAULT_COMPANY_ID,
            name: catName.trim(),
            createdAt: new Date().toISOString()
          }
        }
        setCategories((prev) => [...prev, newCat])
        showToast(`Category "${newCat.name}" created!`)
      }
      setShowCatModal(false)
    } catch {
      const localCat: Category = {
        id: editingCat ? editingCat.id : Date.now(),
        company_id: DEFAULT_COMPANY_ID,
        name: catName.trim()
      }
      if (editingCat) {
        setCategories((prev) => prev.map((c) => (c.id === editingCat.id ? localCat : c)))
      } else {
        setCategories((prev) => [...prev, localCat])
      }
      showToast(`Category "${localCat.name}" saved locally.`)
      setShowCatModal(false)
    } finally {
      setCatSubmitting(false)
    }
  }

  const handleDeleteCategory = async (id: number, name: string): Promise<void> => {
    const hasProducts = products.some((p) => p.category_id === id)
    if (hasProducts) {
      setError(`Cannot delete "${name}" — it has products assigned. Move or delete those products first.`)
      return
    }
    if (!window.confirm(`Delete category "${name}"?`)) return
    setCategories((prev) => prev.filter((c) => c.id !== id))
    showToast(`Category "${name}" deleted.`)
  }

  // ── Filtered Data ────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'ALL' && p.category_id !== Number(categoryFilter)) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = p.name.toLowerCase().includes(q)
        const matchDesc = p.description?.toLowerCase().includes(q) ?? false
        const matchCat = p.category?.name?.toLowerCase().includes(q) ?? false
        if (!matchName && !matchDesc && !matchCat) return false
      }
      return true
    })
  }, [products, searchQuery, categoryFilter])

  // ── Metrics ──────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalValue = products.reduce((sum, p) => sum + Number(p.price), 0)
    const avgPrice = products.length ? totalValue / products.length : 0
    const gstBreakdown: Record<number, number> = {}
    products.forEach((p) => {
      const g = Number(p.gst_rate)
      gstBreakdown[g] = (gstBreakdown[g] || 0) + 1
    })
    return {
      totalProducts: products.length,
      totalCategories: categories.length,
      avgPrice,
      mostUsedGst: Object.entries(gstBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '18'
    }
  }, [products, categories])

  // ── GST Badge ─────────────────────────────────────────────────────
  const gstBadgeClass = (rate: number | string): string => {
    const r = Number(rate)
    if (r === 0) return 'gst-badge-zero'
    if (r === 5) return 'gst-badge-five'
    if (r === 12) return 'gst-badge-twelve'
    if (r === 18) return 'gst-badge-eighteen'
    return 'gst-badge-twentyeight'
  }

  // ── Category Color ────────────────────────────────────────────────
  const catColors = ['cat-color-1', 'cat-color-2', 'cat-color-3', 'cat-color-4', 'cat-color-5']
  const getCatColor = (idx: number): string => catColors[idx % catColors.length]

  // ═════════════════════════════════════════════════════════════════
  //  RENDER
  // ═════════════════════════════════════════════════════════════════
  return (
    <div className="w-100 pt-1 pb-5 mb-4">

      {/* ── Toast Messages ─────────────────────────────────────── */}
      {successMsg && (
        <Alert
          variant="success"
          onClose={() => setSuccessMsg(null)}
          dismissible
          className="shadow-lg border-success mb-3 rounded-3"
        >
          <CheckCircle2 size={18} className="me-2 d-inline" />
          {successMsg}
        </Alert>
      )}
      {error && (
        <Alert
          variant="danger"
          onClose={() => setError(null)}
          dismissible
          className="shadow-lg border-danger mb-3 rounded-3"
        >
          <AlertCircle size={18} className="me-2 d-inline" />
          {error}
        </Alert>
      )}

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 w-100">
        <div className="d-flex align-items-center gap-3">
          <div className="vpm-page-header-icon">
            <Package size={22} />
          </div>
          <div>
            <h2 className="vpm-page-heading">Product & Rate Management</h2>
            <p className="vpm-page-subheading">
              Manage your print products, categories, pricing rates and GST configuration.
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            className="vpm-btn-secondary"
            onClick={() => { fetchProducts(); fetchCategories() }}
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
          {activeView === 'categories' ? (
            <button className="vpm-btn-primary" onClick={openAddCategory}>
              <PlusCircle size={17} /> Add Category
            </button>
          ) : (
            <button className="vpm-btn-primary" onClick={openAddProduct}>
              <PackagePlus size={17} /> Add Product
            </button>
          )}
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <Row className="g-3 mb-4 w-100 mx-0">
        <Col className="col-12 col-sm-6 col-md flex-grow-1 px-2">
          <div className={`vpm-stat-card ${isDark ? 'vpm-stat-card-dark' : 'vpm-stat-card-light'} vpm-stat-cyan`}>
            <div className="vpm-stat-top">
              <span className="vpm-stat-label">Total Products</span>
              <div className="vpm-stat-icon-ring"><Package size={16} /></div>
            </div>
            <div className="vpm-stat-divider" />
            <div className="vpm-stat-value">{metrics.totalProducts}</div>
            <div className="vpm-stat-desc">Products in catalogue</div>
          </div>
        </Col>
        <Col className="col-12 col-sm-6 col-md flex-grow-1 px-2">
          <div className={`vpm-stat-card ${isDark ? 'vpm-stat-card-dark' : 'vpm-stat-card-light'} vpm-stat-indigo`}>
            <div className="vpm-stat-top">
              <span className="vpm-stat-label">Categories</span>
              <div className="vpm-stat-icon-ring"><Layers size={16} /></div>
            </div>
            <div className="vpm-stat-divider" />
            <div className="vpm-stat-value">{metrics.totalCategories}</div>
            <div className="vpm-stat-desc">Product groups defined</div>
          </div>
        </Col>
        <Col className="col-12 col-sm-6 col-md flex-grow-1 px-2">
          <div className={`vpm-stat-card ${isDark ? 'vpm-stat-card-dark' : 'vpm-stat-card-light'} vpm-stat-emerald`}>
            <div className="vpm-stat-top">
              <span className="vpm-stat-label">Avg. Rate</span>
              <div className="vpm-stat-icon-ring"><IndianRupee size={16} /></div>
            </div>
            <div className="vpm-stat-divider" />
            <div className="vpm-stat-value">₹{fmtPrice(metrics.avgPrice)}</div>
            <div className="vpm-stat-desc">Average product price</div>
          </div>
        </Col>
        <Col className="col-12 col-sm-6 col-md flex-grow-1 px-2">
          <div className={`vpm-stat-card ${isDark ? 'vpm-stat-card-dark' : 'vpm-stat-card-light'} vpm-stat-amber`}>
            <div className="vpm-stat-top">
              <span className="vpm-stat-label">Common GST</span>
              <div className="vpm-stat-icon-ring"><Percent size={16} /></div>
            </div>
            <div className="vpm-stat-divider" />
            <div className="vpm-stat-value">{metrics.mostUsedGst}%</div>
            <div className="vpm-stat-desc">Most used GST slab</div>
          </div>
        </Col>
      </Row>

      {/* ── View Toggle ─────────────────────────────────────────── */}
      <div className={`prd-view-toggle ${isDark ? 'prd-toggle-dark' : 'prd-toggle-light'} mb-4`}>
        <button
          className={`prd-toggle-btn ${activeView === 'products' ? 'prd-toggle-active' : ''}`}
          onClick={() => setActiveView('products')}
        >
          <Package size={15} />
          <span>Products</span>
          <span className="prd-toggle-count">{products.length}</span>
        </button>
        <button
          className={`prd-toggle-btn ${activeView === 'categories' ? 'prd-toggle-active' : ''}`}
          onClick={() => setActiveView('categories')}
        >
          <TagsIcon size={15} />
          <span>Categories</span>
          <span className="prd-toggle-count">{categories.length}</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          PRODUCTS VIEW
         ══════════════════════════════════════════════════════════ */}
      {activeView === 'products' && (
        <>
          {/* Filter Toolbar */}
          <div className={`vpm-filter-toolbar ${isDark ? 'filter-toolbar-dark' : 'filter-toolbar-light'} mb-4 w-100`}>
            <Row className="g-2 align-items-center w-100 mx-0">
              <Col lg={5} md={12} className="px-1">
                <div className={`cal-search-box ${isDark ? 'search-dark' : 'search-light'}`}>
                  <Search size={15} className="search-icon" />
                  <input
                    placeholder="Search products by name, description, category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} className="search-clear-btn" title="Clear">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </Col>
              <Col lg={4} md={8} className="px-1">
                <Form.Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="vpm-filter-select"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col lg={3} md={4} className="px-1 text-end">
                <button
                  className="vpm-btn-secondary w-100"
                  onClick={() => { setSearchQuery(''); setCategoryFilter('ALL') }}
                >
                  Reset Filters
                </button>
              </Col>
            </Row>
          </div>

          {/* Products Table */}
          <Card className={`prd-table-card ${isDark ? 'prd-table-dark' : 'prd-table-light'} border-0 w-100`}>
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant={isDark ? 'info' : 'primary'} />
                  <p className="text-secondary mt-2" style={{ fontSize: '0.82rem' }}>Loading product catalogue...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-5 text-secondary">
                  <Box size={48} className="mb-3 opacity-30 d-block mx-auto" />
                  <h5 className="fw-bold mb-1">No Products Found</h5>
                  <p style={{ fontSize: '0.82rem' }} className="opacity-75">
                    {searchQuery || categoryFilter !== 'ALL'
                      ? 'No products match your search or filter.'
                      : 'Click "Add Product" to create your first product.'}
                  </p>
                </div>
              ) : (
                <div className="table-responsive w-100">
                  <Table hover className={`prd-table align-middle mb-0 ${isDark ? 'prd-table-variant-dark' : 'prd-table-variant-light'}`}>
                    <thead>
                      <tr className={`prd-table-head ${isDark ? 'prd-head-dark' : 'prd-head-light'}`}>
                        <th className="ps-4 py-3">#</th>
                        <th className="py-3">Product Name</th>
                        <th className="py-3">Category</th>
                        <th className="py-3">HSN Code</th>
                        <th className="py-3">Unit</th>
                        <th className="py-3">Base Price</th>
                        <th className="py-3">GST Rate</th>
                        <th className="py-3">Price + GST</th>
                        <th className="pe-4 text-end py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p, idx) => {
                        const base = Number(p.price)
                        const gst = Number(p.gst_rate)
                        const gstAmt = (base * gst) / 100
                        const total = base + gstAmt
                        return (
                          <tr key={p.id} className="prd-table-row">
                            <td className="ps-4 py-3">
                              <span className="prd-row-num">{idx + 1}</span>
                            </td>
                            <td className="py-3">
                              <div className="d-flex align-items-center gap-2">
                                <div className="prd-icon-box">
                                  <Package size={15} />
                                </div>
                                <div>
                                  <div className={`fw-semibold ${isDark ? 'text-white' : 'text-dark'}`} style={{ fontSize: '0.88rem' }}>
                                    {p.name}
                                  </div>
                                  {p.description && (
                                    <div className="text-secondary" style={{ fontSize: '0.73rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {p.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              <span className={`prd-cat-badge ${getCatColor(categories.findIndex((c) => c.id === p.category_id))}`}>
                                <Tag size={11} className="me-1" />
                                {p.category?.name || '—'}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className="vpm-badge-bill vpm-badge-bill-tax px-2 py-1" style={{ fontSize: '0.72rem' }}>
                                {p.hsn_code || '9983'}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className="prd-unit-badge">{p.unit}</span>
                            </td>
                            <td className="py-3">
                              <span className="prd-price-value">
                                <IndianRupee size={12} className="me-0" />
                                {fmtPrice(base)}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className={`gst-badge ${gstBadgeClass(gst)}`}>
                                {gst}% GST
                              </span>
                            </td>
                            <td className="py-3">
                              <div className="prd-total-price">
                                <span className="prd-total-main">₹{fmtPrice(total)}</span>
                                <span className="prd-total-sub">+₹{fmtPrice(gstAmt)} tax</span>
                              </div>
                            </td>
                            <td className="pe-4 py-3 text-end">
                              <div className="d-flex gap-2 justify-content-end">
                                <button
                                  className="prd-action-btn prd-edit-btn"
                                  onClick={() => openEditProduct(p)}
                                  title="Edit Product"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  className="prd-action-btn prd-delete-btn"
                                  onClick={() => handleDeleteProduct(p.id, p.name)}
                                  title="Delete Product"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
            <Card.Footer className={`prd-table-footer ${isDark ? 'prd-footer-dark' : 'prd-footer-light'}`}>
              <span>{filteredProducts.length} of {products.length} products shown</span>
              <span className="ms-auto">
                <Sparkles size={12} className="me-1" />
                Viral Print Product Catalogue
              </span>
            </Card.Footer>
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          CATEGORIES VIEW
         ══════════════════════════════════════════════════════════ */}
      {activeView === 'categories' && (
        <Row className="g-3 w-100 mx-0">
          {catsLoading ? (
            <Col className="text-center py-5">
              <Spinner animation="border" variant={isDark ? 'info' : 'primary'} />
            </Col>
          ) : categories.length === 0 ? (
            <Col className="text-center py-5 text-secondary">
              <TagsIcon size={48} className="mb-3 opacity-30 d-block mx-auto" />
              <h5 className="fw-bold">No Categories Yet</h5>
              <p style={{ fontSize: '0.82rem' }}>Click "Add Category" to get started.</p>
            </Col>
          ) : (
            categories.map((cat, idx) => {
              const productCount = products.filter((p) => p.category_id === cat.id).length
              return (
                <Col key={cat.id} xl={3} lg={4} md={6} sm={12} className="px-2">
                  <div className={`prd-cat-card ${isDark ? 'prd-cat-dark' : 'prd-cat-light'} ${getCatColor(idx)}`}>
                    <div className="prd-cat-icon-wrap">
                      <TagsIcon size={22} />
                    </div>
                    <div className="prd-cat-info">
                      <div className="prd-cat-name">{cat.name}</div>
                      <div className="prd-cat-count">
                        <Package size={12} className="me-1" />
                        {productCount} product{productCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="prd-cat-actions">
                      <button
                        className="prd-action-btn prd-edit-btn"
                        onClick={() => openEditCategory(cat)}
                        title="Edit Category"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        className="prd-action-btn prd-delete-btn"
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        title="Delete Category"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </Col>
              )
            })
          )}
        </Row>
      )}

      {/* ══════════════════════════════════════════════════════════
          PRODUCT MODAL
         ══════════════════════════════════════════════════════════ */}
      <Modal
        show={showProductModal}
        onHide={() => setShowProductModal(false)}
        centered
        size="lg"
        className={`vpm-modal ${isDark ? 'modal-dark' : 'modal-light'}`}
        contentClassName={isDark ? 'modal-content modal-dark' : 'modal-content modal-light'}
      >
        <Modal.Header className="vpm-modal-header d-flex align-items-center justify-content-between">
          <Modal.Title className="vpm-modal-title mb-0">
            <div className="vpm-modal-title-icon">
              {editingProduct ? <Edit2 size={18} /> : <PackagePlus size={18} />}
            </div>
            <span>{editingProduct ? 'Edit Product' : 'Add New Product'}</span>
          </Modal.Title>
          <button
            type="button"
            onClick={() => setShowProductModal(false)}
            className="um-modal-close-btn"
            aria-label="Close Modal"
            title="Close Modal"
          >
            <X size={18} strokeWidth={2.4} />
          </button>
        </Modal.Header>
        <Modal.Body className="vpm-modal-body p-4">
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible className="rounded-3 mb-3">
              <AlertCircle size={15} className="me-2 d-inline" />{error}
            </Alert>
          )}
          <Form onSubmit={handleSaveProduct} id="product-form">
            <Row className="g-3">
              {/* Product Name */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="vpm-form-label">
                    Product Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    className="vpm-form-input"
                    placeholder="e.g. Star Flex Banner 1mm"
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>

              {/* Category */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="vpm-form-label">
                    Category <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    className="vpm-form-input"
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value)}
                    required
                  >
                    <option value="">Select a category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* HSN Code */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="vpm-form-label">
                    HSN / SAC Code
                  </Form.Label>
                  <Form.Control
                    type="text"
                    className="vpm-form-input"
                    placeholder="e.g. 9983 or 4911"
                    value={pHsn}
                    onChange={(e) => setPHsn(e.target.value)}
                  />
                </Form.Group>
              </Col>

              {/* Unit */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="vpm-form-label">Unit of Measure</Form.Label>
                  <Form.Select
                    className="vpm-form-input"
                    value={UNIT_OPTIONS.includes(pUnit) ? pUnit : 'Other'}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === 'Other') {
                        setPUnit('Custom')
                      } else {
                        setPUnit(val)
                      }
                    }}
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </Form.Select>
                  {(!UNIT_OPTIONS.includes(pUnit) || pUnit === 'Other' || pUnit === 'Custom') && (
                    <Form.Control
                      type="text"
                      className="vpm-form-input mt-2"
                      placeholder="Type custom unit..."
                      value={pUnit === 'Other' ? '' : pUnit}
                      onChange={(e) => setPUnit(e.target.value)}
                    />
                  )}
                </Form.Group>
              </Col>

              {/* Price */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="vpm-form-label">
                    Base Price (₹) <span className="text-danger">*</span>
                  </Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="vpm-input-addon">₹</InputGroup.Text>
                    <Form.Control
                      type="number"
                      min={0}
                      step="0.01"
                      className="vpm-form-input"
                      placeholder="0.00"
                      value={pPrice}
                      onChange={(e) => setPPrice(e.target.value)}
                      required
                    />
                  </InputGroup>
                </Form.Group>
              </Col>

              {/* GST Rate */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="vpm-form-label">GST Rate (%)</Form.Label>
                  <div className="gst-selector">
                    {GST_OPTIONS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        className={`gst-option-btn ${pGst === g ? 'gst-option-active' : ''}`}
                        onClick={() => setPGst(g)}
                      >
                        {g}%
                      </button>
                    ))}
                  </div>
                </Form.Group>
              </Col>

              {/* Price Preview */}
              {pPrice && !isNaN(Number(pPrice)) && (
                <Col md={12}>
                  <div className={`prd-price-preview ${isDark ? 'price-preview-dark' : 'price-preview-light'}`}>
                    <div className="price-preview-row">
                      <span>Base Price</span>
                      <span>₹{fmtPrice(Number(pPrice))}</span>
                    </div>
                    <div className="price-preview-row">
                      <span>GST ({pGst}%)</span>
                      <span>+ ₹{fmtPrice((Number(pPrice) * pGst) / 100)}</span>
                    </div>
                    <div className="price-preview-row price-preview-total">
                      <span>Total (incl. GST)</span>
                      <span>₹{fmtPrice(Number(pPrice) + (Number(pPrice) * pGst) / 100)}</span>
                    </div>
                  </div>
                </Col>
              )}

              {/* Description */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="vpm-form-label">Description / Specifications</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    className="vpm-form-input"
                    placeholder="Brief description of material, size, quality..."
                    value={pDesc}
                    onChange={(e) => setPDesc(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer className="vpm-modal-footer">
          <button className="vpm-btn-secondary" onClick={() => setShowProductModal(false)} disabled={pSubmitting}>
            Cancel
          </button>
          <button
            type="submit"
            form="product-form"
            className="vpm-btn-primary"
            disabled={pSubmitting}
          >
            {pSubmitting ? (
              <><Spinner animation="border" size="sm" className="me-2" />Saving...</>
            ) : (
              <><CheckCircle2 size={16} className="me-1" />{editingProduct ? 'Update Product' : 'Create Product'}</>
            )}
          </button>
        </Modal.Footer>
      </Modal>

      {/* ══════════════════════════════════════════════════════════
          CATEGORY MODAL
         ══════════════════════════════════════════════════════════ */}
      <Modal
        show={showCatModal}
        onHide={() => setShowCatModal(false)}
        centered
        size="sm"
        className={`vpm-modal ${isDark ? 'modal-dark' : 'modal-light'}`}
        contentClassName={isDark ? 'modal-content modal-dark' : 'modal-content modal-light'}
      >
        <Modal.Header className="vpm-modal-header d-flex align-items-center justify-content-between">
          <Modal.Title className="vpm-modal-title mb-0">
            <div className="vpm-modal-title-icon">
              {editingCat ? <Edit2 size={16} /> : <PlusCircle size={16} />}
            </div>
            <span>{editingCat ? 'Edit Category' : 'Add Category'}</span>
          </Modal.Title>
          <button
            type="button"
            onClick={() => setShowCatModal(false)}
            className="um-modal-close-btn"
            aria-label="Close Modal"
            title="Close Modal"
          >
            <X size={18} strokeWidth={2.4} />
          </button>
        </Modal.Header>
        <Modal.Body className="vpm-modal-body p-4">
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible className="rounded-3 mb-3">
              <AlertCircle size={15} className="me-2 d-inline" />{error}
            </Alert>
          )}
          <Form onSubmit={handleSaveCategory} id="cat-form">
            <Form.Group>
              <Form.Label className="vpm-form-label">
                Category Name <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                className="vpm-form-input"
                placeholder="e.g. Banners & Flex"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                required
                autoFocus
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="vpm-modal-footer">
          <button className="vpm-btn-secondary" onClick={() => setShowCatModal(false)} disabled={catSubmitting}>
            Cancel
          </button>
          <button
            type="submit"
            form="cat-form"
            className="vpm-btn-primary"
            disabled={catSubmitting}
          >
            {catSubmitting ? (
              <><Spinner animation="border" size="sm" className="me-2" />Saving...</>
            ) : (
              <><CheckCircle2 size={16} className="me-1" />{editingCat ? 'Update' : 'Create Category'}</>
            )}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
