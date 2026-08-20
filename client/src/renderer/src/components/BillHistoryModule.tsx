import React, { useState, useEffect } from 'react'
import {
  History,
  Search,
  Filter,
  Edit,
  Printer,
  Trash2,
  FileText,
  Calendar,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  X,
  MessageSquare,
  Receipt,
  Tag,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react'
import { DataService, Invoice } from '../services/dataService'
import './BillHistoryModule.css'

interface BillHistoryModuleProps {
  theme: 'dark' | 'light'
  onEditInvoice: (inv: Invoice) => void
  onCreateNewBill: () => void
}

export const BillHistoryModule: React.FC<BillHistoryModuleProps> = ({
  theme,
  onEditInvoice,
  onCreateNewBill
}) => {
  const isDark = theme === 'dark'
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null)

  const loadInvoices = () => {
    setInvoices(DataService.getInvoices())
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  // Filter invoices based on user inputs
  const filteredInvoices = invoices.filter((inv) => {
    const q = searchTerm.toLowerCase().trim()
    const matchSearch =
      !q ||
      inv.invoice_number.toLowerCase().includes(q) ||
      inv.customer_name.toLowerCase().includes(q) ||
      (inv.customer_mobile && inv.customer_mobile.includes(q)) ||
      (inv.customer_gstin && inv.customer_gstin.toLowerCase().includes(q))

    const matchType = typeFilter === 'ALL' || inv.type === typeFilter
    const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter
    const matchStart = !startDate || inv.date >= startDate
    const matchEnd = !endDate || inv.date <= endDate

    return matchSearch && matchType && matchStatus && matchStart && matchEnd
  })

  // Metric stats
  const totalCount = filteredInvoices.length
  const taxInvoiceCount = filteredInvoices.filter((i) => i.type === 'TAX_INVOICE').length
  const quoteCount = filteredInvoices.filter((i) => i.type === 'QUOTATION').length
  const estCount = filteredInvoices.filter((i) => i.type === 'ESTIMATE').length
  const totalGrandVal = filteredInvoices.reduce((sum, i) => sum + (i.grand_total || 0), 0)

  const handleDelete = (id: number, invNo: string) => {
    if (window.confirm(`Are you sure you want to delete bill ${invNo}? This action cannot be undone.`)) {
      DataService.deleteInvoice(id)
      loadInvoices()
      if (previewInvoice?.id === id) {
        setPreviewInvoice(null)
      }
    }
  }

  const handlePrintModal = (inv: Invoice) => {
    setPreviewInvoice(inv)
  }

  const triggerModalPrint = () => {
    window.print()
  }

  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'TAX_INVOICE':
        return <span className="vpm-badge badge-tax"><Receipt size={12} /> Tax Invoice</span>
      case 'QUOTATION':
        return <span className="vpm-badge badge-quote"><FileText size={12} /> Quotation</span>
      default:
        return <span className="vpm-badge badge-est"><Tag size={12} /> Estimate</span>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="vpm-badge badge-paid"><CheckCircle2 size={12} /> Paid</span>
      case 'PARTIALLY_PAID':
        return <span className="vpm-badge badge-partial"><Clock size={12} /> Partial</span>
      default:
        return <span className="vpm-badge badge-unpaid"><AlertCircle size={12} /> Unpaid</span>
    }
  }

  return (
    <div className={`vpm-history-module ${isDark ? 'theme-dark' : 'theme-light'}`}>
      
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <div className="vpm-module-header">
        <div>
          <div className="vpm-module-title">
            <History size={24} style={{ color: '#736efe' }} />
            <h2>Previous Bills & Invoice History</h2>
          </div>
          <p className="vpm-module-subtitle">
            Search, filter, view, print, and edit all previously saved Tax Invoices, Quotations, and Estimate Bills.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => DataService.exportAllDataToExcel()}
            className="vpm-btn-secondary"
            title="Export all bills to Excel (.xlsx)"
          >
            <FileSpreadsheet size={15} /> Export Excel
          </button>

          <button
            onClick={onCreateNewBill}
            className="vpm-btn-primary"
          >
            <Plus size={16} /> Create New Bill
          </button>
        </div>
      </div>

      {/* ── Metric Summary Cards ──────────────────────────────────── */}
      <div className="vpm-stats-grid">
        <div className="vpm-stat-card">
          <div className="vpm-stat-icon icon-purple">
            <History size={20} />
          </div>
          <div>
            <div className="vpm-stat-val">{totalCount}</div>
            <div className="vpm-stat-lbl">Total Bills Found</div>
          </div>
        </div>

        <div className="vpm-stat-card">
          <div className="vpm-stat-icon icon-blue">
            <Receipt size={20} />
          </div>
          <div>
            <div className="vpm-stat-val">{taxInvoiceCount}</div>
            <div className="vpm-stat-lbl">Tax Invoices (GST)</div>
          </div>
        </div>

        <div className="vpm-stat-card">
          <div className="vpm-stat-icon icon-cyan">
            <FileText size={20} />
          </div>
          <div>
            <div className="vpm-stat-val">{quoteCount}</div>
            <div className="vpm-stat-lbl">Quotations</div>
          </div>
        </div>

        <div className="vpm-stat-card">
          <div className="vpm-stat-icon icon-emerald">
            <Tag size={20} />
          </div>
          <div>
            <div className="vpm-stat-val">{estCount}</div>
            <div className="vpm-stat-lbl">Estimate Slips</div>
          </div>
        </div>

        <div className="vpm-stat-card">
          <div className="vpm-stat-icon icon-purple">
            <Receipt size={20} />
          </div>
          <div>
            <div className="vpm-stat-val">₹{totalGrandVal.toLocaleString('en-IN')}</div>
            <div className="vpm-stat-lbl">Total Revenue (₹)</div>
          </div>
        </div>
      </div>

      {/* ── Filter Controls Panel ─────────────────────────────────── */}
      <div className="vpm-filter-card">
        <div className="vpm-filter-row">

          {/* Search Box */}
          <div className="vpm-search-box" style={{ flex: 2 }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by Invoice No, Customer Name, Mobile, GSTIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <X size={15} className="clear-icon" onClick={() => setSearchTerm('')} />
            )}
          </div>

          {/* Type Filter */}
          <div className="vpm-field" style={{ flex: 1 }}>
            <label><Filter size={12} /> Bill Format Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="ALL">All Formats (All Types)</option>
              <option value="TAX_INVOICE">Tax Invoice (GST)</option>
              <option value="QUOTATION">Quotation</option>
              <option value="ESTIMATE">Estimate Slip</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="vpm-field" style={{ flex: 1 }}>
            <label><CheckCircle2 size={12} /> Payment Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="vpm-field" style={{ flex: 1 }}>
            <label><Calendar size={12} /> From Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="vpm-field" style={{ flex: 1 }}>
            <label><Calendar size={12} /> To Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <button
            onClick={loadInvoices}
            className="vpm-btn-secondary"
            style={{ marginTop: 'auto', height: 38 }}
            title="Refresh List"
          >
            <RefreshCw size={14} /> Refresh
          </button>

        </div>
      </div>

      {/* ── Main History Data Table ───────────────────────────────── */}
      <div className="vpm-table-card">
        <table className="vpm-data-table">
          <thead>
            <tr>
              <th style={{ width: 45 }}>Sr.</th>
              <th style={{ width: 140 }}>Invoice No.</th>
              <th style={{ width: 130 }}>Format Type</th>
              <th style={{ width: 100 }}>Date</th>
              <th>Customer / Billed To</th>
              <th style={{ width: 90 }}>Items</th>
              <th style={{ width: 120, textAlign: 'right' }}>Grand Total</th>
              <th style={{ width: 100, textAlign: 'center' }}>Status</th>
              <th style={{ width: 180, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
                  <History size={36} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>No matching bills found</div>
                  <div style={{ fontSize: '0.8rem' }}>Try clearing your search query or filters.</div>
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv, idx) => (
                <tr key={inv.id}>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: '#94A3B8' }}>{idx + 1}</td>
                  <td>
                    <strong style={{ color: '#736efe', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {inv.invoice_number}
                    </strong>
                  </td>
                  <td>{getTypeBadge(inv.type)}</td>
                  <td style={{ fontSize: '0.8rem', fontWeight: 600 }}>{inv.date}</td>
                  <td>
                    <div style={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b' }}>
                      {inv.customer_name}
                    </div>
                    {inv.customer_mobile && (
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        📞 {inv.customer_mobile} {inv.customer_gstin ? `| GST: ${inv.customer_gstin}` : ''}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, background: 'rgba(115,110,254,0.1)', color: '#736efe', padding: '2px 8px', borderRadius: 6 }}>
                      {inv.items?.length || 0} Items
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.9rem' }}>
                    ₹{formatCurrency(inv.grand_total || 0)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {getStatusBadge(inv.status)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                      
                      {/* EDIT BILL BUTTON */}
                      <button
                        onClick={() => onEditInvoice(inv)}
                        className="action-btn action-edit"
                        title="Edit this Bill (Loads into Bill Editor)"
                      >
                        <Edit size={14} /> Edit
                      </button>

                      {/* QUICK PRINT / PDF BUTTON */}
                      <button
                        onClick={() => handlePrintModal(inv)}
                        className="action-btn action-print"
                        title="Quick Print & Save as PDF"
                      >
                        <Printer size={14} /> Print
                      </button>

                      {/* WHATSAPP SHARE */}
                      <button
                        onClick={() => {
                          const mob = (inv.customer_mobile || '').replace(/\D/g, '')
                          const targetMob = mob.length === 10 ? '91' + mob : mob
                          const text = `📄 *VIRAL PRINT MEDIA - ${inv.type}*\n` +
                            `-----------------------------------------\n` +
                            `*Invoice No:* ${inv.invoice_number}\n` +
                            `*Customer:* ${inv.customer_name}\n` +
                            `*Grand Total:* ₹${inv.grand_total}\n` +
                            `*Date:* ${inv.date}\n` +
                            `-----------------------------------------\n` +
                            `Thank you for doing business with Viral Print Media!`
                          window.open(`https://wa.me/${targetMob}?text=${encodeURIComponent(text)}`, '_blank')
                        }}
                        className="action-btn action-wa"
                        title="Share via WhatsApp"
                      >
                        <MessageSquare size={14} />
                      </button>

                      {/* DELETE BUTTON */}
                      <button
                        onClick={() => handleDelete(inv.id, inv.invoice_number)}
                        className="action-btn action-del"
                        title="Delete Bill Record"
                      >
                        <Trash2 size={14} />
                      </button>

                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Quick Print & PDF Preview Modal ──────────────────────── */}
      {previewInvoice && (
        <div className="vpm-modal-backdrop" onClick={() => setPreviewInvoice(null)}>
          <div className="vpm-modal-card" style={{ maxWidth: 850, width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="vpm-modal-header">
              <span className="vpm-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Printer size={18} style={{ color: '#736efe' }} />
                Print Preview — {previewInvoice.type} ({previewInvoice.invoice_number})
              </span>
              <button className="vpm-modal-close" onClick={() => setPreviewInvoice(null)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="vpm-modal-body" style={{ padding: 16, maxHeight: '75vh', overflowY: 'auto' }}>

              {/* Action bar inside modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, background: 'rgba(115,110,254,0.06)', padding: 10, borderRadius: 8 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  Customer: {previewInvoice.customer_name} | Date: {previewInvoice.date}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => {
                      setPreviewInvoice(null)
                      onEditInvoice(previewInvoice)
                    }}
                    style={{ background: '#736efe', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Edit size={14} /> Edit this Bill
                  </button>
                  <button
                    onClick={triggerModalPrint}
                    style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Printer size={14} /> Print / Save PDF
                  </button>
                </div>
              </div>

              {/* Master Printable Invoice Box */}
              <div id="printable-bill" className="bill-paper" style={{ width: '100%', margin: '0 auto', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', padding: 16, background: '#fff', color: '#000' }}>
                <div className="pdf-grid-box" style={{ border: '1.5px solid #000', padding: 0 }}>

                  {/* Header Banner */}
                  <div className="pdf-top-banner" style={{ background: '#000', color: '#fff', textAlign: 'center', padding: '6px', fontWeight: 800, letterSpacing: '1px' }}>
                    {previewInvoice.type === 'TAX_INVOICE' ? 'TAX INVOICE' : previewInvoice.type === 'QUOTATION' ? 'QUOTATION' : 'ESTIMATE'}
                  </div>

                  {/* Details Header */}
                  <div className="pdf-header-row" style={{ display: 'flex', borderBottom: '1.5px solid #000' }}>
                    <div className="pdf-company-col" style={{ flex: 1, padding: 8, borderRight: '1.5px solid #000' }}>
                      <div className="pdf-company-title" style={{ fontSize: 16, fontWeight: 800 }}>VIRAL PRINT MEDIA</div>
                      <div className="pdf-company-line" style={{ fontSize: 10 }}>📍 GF-10, 13, 14, Satyamev Arcade, Highway Road, Chandkheda, Ahmedabad 382424</div>
                      <div className="pdf-company-line" style={{ fontSize: 10 }}>📞 99799 63632 | ✉ viralprintmedia@gmail.com</div>
                      <div style={{ fontSize: 10, fontWeight: 700, marginTop: 4 }}>GSTIN : 24BAAPM9783K1Z7 | PAN : BAAPM9783K | STATE CODE: 24</div>
                    </div>
                    <div className="pdf-meta-col" style={{ width: 340, padding: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: 4, marginBottom: 4, fontWeight: 700, fontSize: 11 }}>
                        <span>INV NO: {previewInvoice.invoice_number}</span>
                        <span>DATE: {previewInvoice.date}</span>
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 800 }}>Billed To:</div>
                      <div style={{ fontSize: 12, fontWeight: 800 }}>{previewInvoice.customer_name}</div>
                      {previewInvoice.customer_address && <div style={{ fontSize: 10 }}>Address: {previewInvoice.customer_address}</div>}
                      {previewInvoice.customer_mobile && <div style={{ fontSize: 10 }}>Mo: {previewInvoice.customer_mobile}</div>}
                      {previewInvoice.customer_gstin && <div style={{ fontSize: 10, fontWeight: 700 }}>GSTIN: {previewInvoice.customer_gstin}</div>}
                    </div>
                  </div>

                  {/* Table */}
                  <table className="pdf-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid #000', background: '#f8fafc' }}>
                        <th style={{ padding: 6, borderRight: '1px solid #000', fontSize: 11 }}>Sr.</th>
                        <th style={{ padding: 6, borderRight: '1px solid #000', textAlign: 'left', fontSize: 11 }}>DESCRIPTION</th>
                        {previewInvoice.type === 'TAX_INVOICE' && <th style={{ padding: 6, borderRight: '1px solid #000', fontSize: 11 }}>HSN</th>}
                        <th style={{ padding: 6, borderRight: '1px solid #000', fontSize: 11 }}>QTY</th>
                        <th style={{ padding: 6, borderRight: '1px solid #000', textAlign: 'right', fontSize: 11 }}>RATE</th>
                        <th style={{ padding: 6, textAlign: 'right', fontSize: 11 }}>AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewInvoice.items?.map((it, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                          <td style={{ padding: 6, borderRight: '1px solid #000', textAlign: 'center', fontSize: 10 }}>{i + 1}</td>
                          <td style={{ padding: 6, borderRight: '1px solid #000', fontSize: 10 }}>{it.description}</td>
                          {previewInvoice.type === 'TAX_INVOICE' && <td style={{ padding: 6, borderRight: '1px solid #000', textAlign: 'center', fontSize: 10 }}>{it.hsn || '9983'}</td>}
                          <td style={{ padding: 6, borderRight: '1px solid #000', textAlign: 'center', fontSize: 10 }}>{it.qty}</td>
                          <td style={{ padding: 6, borderRight: '1px solid #000', textAlign: 'right', fontSize: 10 }}>{it.rate}</td>
                          <td style={{ padding: 6, textAlign: 'right', fontWeight: 700, fontSize: 10 }}>{it.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div style={{ display: 'flex', borderTop: '1.5px solid #000' }}>
                    <div style={{ flex: 1, padding: 8, borderRight: '1.5px solid #000', fontSize: 10 }}>
                      <strong>Bank Details:</strong> UCO BANK | IFSC: UCBA0002881 | A/c: 28810210000939
                      <br />
                      <span style={{ fontSize: 9, color: '#444' }}>Terms: Goods once sold will not be taken back. Subject to Ahmedabad Jurisdiction.</span>
                    </div>
                    <div style={{ width: 220, padding: 8, fontSize: 11 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>Sub Total:</span>
                        <strong>₹{formatCurrency(previewInvoice.sub_total || 0)}</strong>
                      </div>
                      {previewInvoice.type === 'TAX_INVOICE' && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span>CGST (9%):</span>
                            <strong>₹{formatCurrency(previewInvoice.cgst || 0)}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span>SGST (9%):</span>
                            <strong>₹{formatCurrency(previewInvoice.sgst || 0)}</strong>
                          </div>
                        </>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4, borderTop: '1.5px solid #000', fontSize: 13, fontWeight: 800 }}>
                        <span>Grand Total:</span>
                        <strong style={{ color: '#000' }}>₹{formatCurrency(previewInvoice.grand_total || 0)}</strong>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}
