import React, { useState, useEffect, useCallback } from 'react'
import { Row, Col, Card, Button, Table, Badge, Form, InputGroup } from 'react-bootstrap'
import {
  Truck,
  Search,
  FileDown,
  Copy,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { DataService, Invoice } from '../services/dataService'

interface EwayBillModuleProps {
  theme: 'dark' | 'light'
}

export const EwayBillModule: React.FC<EwayBillModuleProps> = ({ theme }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  // E-Way Bill Entry Form States
  const [fromPincode, setFromPincode] = useState('382424')
  const [toPincode, setToPincode]     = useState('380054')
  const [vehicleNo, setVehicleNo]     = useState('GJ01AB1234')
  const [transporter, setTransporter] = useState('Gujarat Logistics & Transport')
  const [distanceKm, setDistanceKm]   = useState('25')
  const [ewayNo, setEwayNo]           = useState('')

  const [copiedMsg, setCopiedMsg]     = useState(false)
  const isDark = theme === 'dark'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const list = DataService.getInvoices()
    setInvoices(list)
    if (list.length > 0) {
      setSelectedInvoice(list[0])
      if (list[0].eway_bill_no) setEwayNo(list[0].eway_bill_no)
    }
  }

  const handleSelectInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv)
    setEwayNo(inv.eway_bill_no || '')
    setVehicleNo(inv.vehicle_no || 'GJ01AB1234')
    setTransporter(inv.transporter_name || 'Gujarat Logistics & Transport')
    setDistanceKm(inv.distance_km ? String(inv.distance_km) : '25')
  }

  // Company details
  const company = {
    name: 'Viral Print Media',
    gstNo: '24BAAPM9783K1Z7',
    address: 'GF-10, 13, 14 Satyamev Arcade, Chandkheda, Ahmedabad, Gujarat',
    stateCode: '24'
  }

  // Generate Official Govt NIC JSON payload (v1.0.0421)
  const generateEwayJsonPayload = useCallback(() => {
    if (!selectedInvoice) return null

    const cleanGstFrom = company.gstNo.replace(/[^A-Z0-9]/gi, '')
    const cleanGstTo   = selectedInvoice.customer_gstin ? selectedInvoice.customer_gstin.replace(/[^A-Z0-9]/gi, '') : 'URP'

    const formattedDate = selectedInvoice.date
      ? selectedInvoice.date.split('-').reverse().join('/')
      : new Date().toLocaleDateString('en-IN')

    const itemsPayload = (selectedInvoice.items || []).map((item) => ({
      productName: item.description || 'Printing Services',
      productDesc: item.description || 'Print Materials',
      hsnCode: parseInt((item.hsn || '9983').replace(/[^0-9]/g, ''), 10) || 9983,
      quantity: item.qty || 1,
      qtyUnit: 'SQF',
      taxableAmount: item.amount || 0,
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 0,
      cessRate: 0
    }))

    return {
      version: '1.0.0421',
      billDtls: [
        {
          userGstin: cleanGstFrom,
          supplyType: 'O',
          subSupplyType: '1',
          docType: 'INV',
          docNo: selectedInvoice.invoice_number,
          docDate: formattedDate,
          fromGstin: cleanGstFrom,
          fromTrdName: company.name,
          fromAddr1: company.address,
          fromAddr2: 'Chandkheda',
          fromPlace: 'Ahmedabad',
          fromPincode: parseInt(fromPincode, 10) || 382424,
          actFromStateCode: 24,
          fromStateCode: 24,
          toGstin: cleanGstTo,
          toTrdName: selectedInvoice.customer_name || 'Customer',
          toAddr1: selectedInvoice.customer_address || 'Ahmedabad',
          toAddr2: '',
          toPlace: 'Ahmedabad',
          toPincode: parseInt(toPincode, 10) || 380054,
          actToStateCode: 24,
          toStateCode: 24,
          totalValue: selectedInvoice.sub_total || 0,
          cgstValue: selectedInvoice.cgst || 0,
          sgstValue: selectedInvoice.sgst || 0,
          igstValue: 0,
          cessValue: 0,
          totInvValue: selectedInvoice.grand_total || 0,
          transMode: '1',
          transDistance: distanceKm || '25',
          transporterId: '',
          transporterName: transporter || '',
          transDocNo: '',
          transDocDate: '',
          vehicleNo: vehicleNo ? vehicleNo.replace(/[^A-Z0-9]/gi, '') : '',
          vehicleType: 'R',
          itemList: itemsPayload
        }
      ]
    }
  }, [selectedInvoice, company, fromPincode, toPincode, distanceKm, transporter, vehicleNo])

  const downloadGovtJson = () => {
    const payload = generateEwayJsonPayload()
    if (!payload || !selectedInvoice) return

    const jsonStr = JSON.stringify(payload, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `EWAY_BILL_${selectedInvoice.invoice_number.replace(/[^A-Z0-9]/gi, '_')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyGovtJson = () => {
    const payload = generateEwayJsonPayload()
    if (!payload) return
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
    setCopiedMsg(true)
    setTimeout(() => setCopiedMsg(false), 2500)
  }

  const saveEwayDetails = () => {
    if (!selectedInvoice) return
    DataService.saveInvoice({
      id: selectedInvoice.id,
      eway_bill_no: ewayNo,
      vehicle_no: vehicleNo,
      transporter_name: transporter,
      distance_km: parseInt(distanceKm, 10) || 25
    })
    loadData()
    alert('E-Way Bill details saved successfully!')
  }

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.eway_bill_no && inv.eway_bill_no.includes(searchQuery))
  )

  return (
    <div className="vpm-eway-module">
      {/* ── Header ───────────────────────────────────────────── */}
      <Card className={`border-0 shadow-sm rounded-4 mb-4 ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
        <Card.Body className="p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <Truck className="text-primary" size={24} />
              <h4 className="fw-bold m-0">Govt GST E-Way Bill Management</h4>
              <Badge bg="success" className="px-2 py-1">Govt NIC v1.0.0421</Badge>
            </div>
            <p className="text-muted small m-0">
              Generate, download, and export official E-Way Bill JSON files for direct upload to ewaybillgst.gov.in
            </p>
          </div>

          <div className="d-flex gap-2">
            <Button
              variant="outline-success"
              className="fw-bold rounded-3 d-flex align-items-center gap-2"
              onClick={() => window.open('https://ewaybillgst.gov.in', '_blank')}
            >
              <ExternalLink size={16} /> Open ewaybillgst.gov.in
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* ── Main Layout (Left: Form Generator, Right: Bills List) ── */}
      <Row className="g-4">
        {/* Left Column: Generator Form & Payload Exporter */}
        <Col lg={7}>
          <Card className={`border-0 shadow-sm rounded-4 mb-4 ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
            <Card.Header className={`p-3 border-0 bg-transparent fw-bold d-flex justify-content-between align-items-center`}>
              <span className="d-flex align-items-center gap-2">
                <ShieldCheck size={18} className="text-primary" />
                E-Way Transport Entry & JSON Payload Exporter
              </span>
              {selectedInvoice && (
                <Badge bg="primary" className="font-monospace">
                  {selectedInvoice.invoice_number}
                </Badge>
              )}
            </Card.Header>

            <Card.Body className="p-4">
              {selectedInvoice ? (
                <div>
                  {/* Notice Banner */}
                  <div className="p-3 rounded-3 mb-3 bg-light border border-info-subtle small d-flex align-items-center gap-2">
                    <AlertCircle size={16} className="text-info flex-shrink-0" />
                    <span>
                      Mandatory for movement of goods above ₹50,000 under GST Law.
                    </span>
                  </div>

                  <Row className="g-3 mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold small">Supplier GSTIN (From)</Form.Label>
                        <Form.Control value={company.gstNo} disabled className="bg-light fw-bold" />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold small">Recipient GSTIN (To)</Form.Label>
                        <Form.Control value={selectedInvoice.customer_gstin || 'URP (Unregistered)'} disabled className="bg-light fw-bold" />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold small">Customer Name</Form.Label>
                        <Form.Control value={selectedInvoice.customer_name} disabled className="bg-light" />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold small">Invoice Total Amount</Form.Label>
                        <Form.Control value={`₹${selectedInvoice.grand_total.toLocaleString('en-IN')}`} disabled className="bg-light fw-bold text-success" />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold small">Dispatch Pincode (From)</Form.Label>
                        <Form.Control
                          value={fromPincode}
                          onChange={(e) => setFromPincode(e.target.value)}
                          placeholder="e.g. 382424"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold small">Destination Pincode (To)</Form.Label>
                        <Form.Control
                          value={toPincode}
                          onChange={(e) => setToPincode(e.target.value)}
                          placeholder="e.g. 380054"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold small">Vehicle Number</Form.Label>
                        <Form.Control
                          value={vehicleNo}
                          onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                          placeholder="e.g. GJ01AB1234"
                          className="fw-bold text-uppercase"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold small">Approx Distance (Km)</Form.Label>
                        <Form.Control
                          type="number"
                          value={distanceKm}
                          onChange={(e) => setDistanceKm(e.target.value)}
                          placeholder="e.g. 25"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="fw-bold small">Transporter Name / ID</Form.Label>
                        <Form.Control
                          value={transporter}
                          onChange={(e) => setTransporter(e.target.value)}
                          placeholder="e.g. Gujarat Logistics"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="fw-bold small">Government 12-Digit E-Way Bill No.</Form.Label>
                        <Form.Control
                          value={ewayNo}
                          onChange={(e) => setEwayNo(e.target.value)}
                          placeholder="Enter 12-digit number once generated on Govt portal"
                          className="fw-bold font-monospace"
                          maxLength={12}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Actions Row */}
                  <div className="d-flex flex-wrap gap-2 justify-content-end pt-2 border-top">
                    <Button variant="outline-secondary" className="fw-bold d-flex align-items-center gap-1" onClick={saveEwayDetails}>
                      <CheckCircle2 size={16} /> Save Details
                    </Button>
                    <Button variant="outline-primary" className="fw-bold d-flex align-items-center gap-1" onClick={copyGovtJson}>
                      <Copy size={16} /> {copiedMsg ? 'Copied NIC JSON!' : 'Copy NIC JSON'}
                    </Button>
                    <Button variant="success" className="fw-bold d-flex align-items-center gap-2" onClick={downloadGovtJson}>
                      <FileDown size={18} /> Download Govt JSON (.json)
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  Select an invoice from the right table to generate E-Way bill details.
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column: Invoices & E-Way Bills List */}
        <Col lg={5}>
          <Card className={`border-0 shadow-sm rounded-4 ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
            <Card.Header className="p-3 border-0 bg-transparent fw-bold d-flex justify-content-between align-items-center">
              <span>Tax Invoices for E-Way Generation</span>
              <Badge bg="secondary">{filteredInvoices.length}</Badge>
            </Card.Header>

            <Card.Body className="p-3">
              <InputGroup className="mb-3">
                <InputGroup.Text className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}>
                  <Search size={16} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search invoice # or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
                />
              </InputGroup>

              <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
                <Table hover className={`align-middle m-0 ${isDark ? 'table-dark' : ''}`}>
                  <tbody>
                    {filteredInvoices.map((inv) => {
                      const isSelected = selectedInvoice?.id === inv.id
                      return (
                        <tr
                          key={inv.id}
                          style={{ cursor: 'pointer' }}
                          className={isSelected ? 'table-primary' : ''}
                          onClick={() => handleSelectInvoice(inv)}
                        >
                          <td>
                            <div className="d-flex flex-column">
                              <span className="fw-bold">{inv.invoice_number}</span>
                              <span className="small text-muted">{inv.customer_name}</span>
                            </div>
                          </td>
                          <td className="text-end">
                            <span className="fw-bold text-success d-block">
                              ₹{inv.grand_total.toLocaleString('en-IN')}
                            </span>
                            {inv.eway_bill_no ? (
                              <Badge bg="success" className="small">E-Way: {inv.eway_bill_no}</Badge>
                            ) : (
                              <Badge bg="warning" text="dark" className="small">Ready to Export</Badge>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default EwayBillModule
