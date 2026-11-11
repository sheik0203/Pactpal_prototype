import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  FileText,
  FolderKanban,
  GanttChartSquare,
  Landmark,
  MessageSquareWarning,
  Menu,
  PackageCheck,
  ShieldCheck,
  Truck,
  Users,
  X,
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import pactPalLogo from './assets/PactPal_Logo.png'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type UserRole = 'buyer' | 'seller' | 'admin' | 'guest'
type TransactionStatus =
  | 'Draft'
  | 'Awaiting Seller Acceptance'
  | 'Awaiting Buyer Payment'
  | 'Payment Confirmed (Demo)'
  | 'Processing'
  | 'Dispatched'
  | 'In Transit'
  | 'Delivered'
  | 'Under Inspection'
  | 'Completed'
  | 'Disputed'
  | 'Refund Requested'
  | 'Cancelled'

type Transaction = {
  id: string
  title: string
  buyerName: string
  sellerName: string
  product: string
  amount: number
  currency: string
  createdAt: string
  deliveryDeadline: string
  paymentStatus: 'Pending' | 'Confirmed' | 'Refund Requested'
  deliveryStatus: 'Awaiting Dispatch' | 'In Transit' | 'Delivered' | 'Inspection' | 'Completed'
  currentStage: string
  status: TransactionStatus
  category: string
  quantity: number
  unitPrice: number
  deliveryMethod: string
  deliveryAddress: string
  expectedDispatchDate: string
  inspectionPeriod: string
  agreementHistory: string[]
  paymentPartnerStatus: string
  dispatchEvidence: string
  trackingNumber: string
  deliveredAt: string
  inspectionResult: string
  activity: { date: string; title: string; detail: string }[]
  supportingDocuments?: string
  specialConditions?: string
}

type Dispute = {
  id: string
  title: string
  category: string
  issue: string
  status: 'Open' | 'Awaiting Seller Response' | 'Under Review' | 'Resolved' | 'Closed'
  createdAt: string
  priority: 'High' | 'Medium' | 'Low'
  transactionId: string
  sellerResponse: string
}

type Agreement = {
  id: string
  title: string
  transactionId: string
  buyerAccepted: boolean
  sellerAccepted: boolean
  version: string
  updatedAt: string
  history: string[]
}

const storage = {
  get<T>(key: string, fallback: T): T {
    const value = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
    if (!value) return fallback
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  },
  set<T>(key: string, value: T) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(value))
    }
  },
  remove(key: string) {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key)
    }
  },
}

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/buyers', label: 'For Buyers' },
  { href: '/sellers', label: 'For Sellers' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/admin', label: 'Admin' },
  { href: '/partnership', label: 'Partnership' },
  { href: '/contact', label: 'Contact' },
]

const standardInitialTransactions: Transaction[] = [
  {
    id: 'PP-2048',
    title: 'Precision Motor Assembly Kit',
    buyerName: 'Bharat Fabricators Ltd.',
    sellerName: 'Metro Components Works',
    product: 'Industrial motor assembly set',
    amount: 285000,
    currency: 'INR',
    createdAt: '2026-10-06',
    deliveryDeadline: '2026-10-18',
    paymentStatus: 'Confirmed',
    deliveryStatus: 'In Transit',
    currentStage: 'In Transit',
    status: 'In Transit',
    category: 'Manufacturing',
    quantity: 12,
    unitPrice: 23750,
    deliveryMethod: 'Courier delivery',
    deliveryAddress: 'Peenya Industrial Area, Bengaluru',
    expectedDispatchDate: '2026-10-08',
    inspectionPeriod: '72 hours',
    agreementHistory: ['Buyer accepted · 2026-10-06 10:15', 'Seller accepted · 2026-10-06 11:42'],
    paymentPartnerStatus: 'Demo status confirmed; no payment was processed.',
    dispatchEvidence: 'Packing list and dispatch note (sample evidence)',
    trackingNumber: 'DEMO-PP-2048',
    deliveredAt: 'Not yet delivered',
    inspectionResult: 'Awaiting delivery and buyer inspection',
    activity: [
      { date: '2026-10-06 09:30', title: 'Transaction created', detail: 'Commercial terms recorded in the demo workspace.' },
      { date: '2026-10-06 10:15', title: 'Buyer accepted agreement', detail: 'Buyer acceptance recorded for demonstration.' },
      { date: '2026-10-06 11:42', title: 'Seller accepted agreement', detail: 'Seller acceptance recorded for demonstration.' },
      { date: '2026-10-07 14:00', title: 'Payment partner status updated', detail: 'Demo status only; no payment was processed.' },
      { date: '2026-10-09 08:30', title: 'Shipment in transit', detail: 'Sample tracking event: DEMO-PP-2048.' },
    ],
  },
  {
    id: 'PP-2019',
    title: 'Cotton Export Packaging Order',
    buyerName: 'Vardhan Mills',
    sellerName: 'Nila Textile Logistics',
    product: 'Cotton packaging rolls',
    amount: 146490,
    currency: 'INR',
    createdAt: '2026-09-18',
    deliveryDeadline: '2026-09-30',
    paymentStatus: 'Pending',
    deliveryStatus: 'Awaiting Dispatch',
    currentStage: 'Awaiting Seller Acceptance',
    status: 'Awaiting Seller Acceptance',
    category: 'Textiles',
    quantity: 30,
    unitPrice: 4883,
    deliveryMethod: 'Courier delivery',
    deliveryAddress: 'Textile Market, Surat',
    expectedDispatchDate: '2026-09-21',
    inspectionPeriod: '48 hours',
    agreementHistory: ['Invitation sent · 2026-09-18 09:10', 'Awaiting seller acceptance'],
    paymentPartnerStatus: 'Not started; agreement acceptance is pending.',
    dispatchEvidence: 'No dispatch evidence recorded',
    trackingNumber: 'Not assigned',
    deliveredAt: 'Not delivered',
    inspectionResult: 'Not started',
    activity: [
      { date: '2026-09-18 09:10', title: 'Transaction created', detail: 'Invitation sent to the seller for review.' },
      { date: '2026-09-18 09:10', title: 'Awaiting seller acceptance', detail: 'No payment activity has taken place.' },
    ],
  },
  {
    id: 'PP-2087',
    title: 'Cold-Chain Temperature Sensors',
    buyerName: 'CareMed Distribution',
    sellerName: 'ThermaCore Systems',
    product: 'Temperature monitoring sensors',
    amount: 92394,
    currency: 'INR',
    createdAt: '2026-09-30',
    deliveryDeadline: '2026-10-12',
    paymentStatus: 'Confirmed',
    deliveryStatus: 'Delivered',
    currentStage: 'Under Inspection',
    status: 'Under Inspection',
    category: 'Healthcare supplies',
    quantity: 18,
    unitPrice: 5133,
    deliveryMethod: 'Courier delivery',
    deliveryAddress: 'Electronic City, Bengaluru',
    expectedDispatchDate: '2026-10-02',
    inspectionPeriod: '24 hours',
    agreementHistory: ['Buyer accepted · 2026-09-30 13:15', 'Seller accepted · 2026-09-30 13:45'],
    paymentPartnerStatus: 'Demo status confirmed; no payment was processed.',
    dispatchEvidence: 'Sample dispatch note recorded',
    trackingNumber: 'DEMO-PP-2087',
    deliveredAt: '2026-10-10 15:20 (sample event)',
    inspectionResult: 'Buyer inspection pending',
    activity: [
      { date: '2026-09-30 12:40', title: 'Transaction created', detail: 'Sample transaction record.' },
      { date: '2026-09-30 13:15', title: 'Buyer accepted agreement', detail: 'Recorded for demonstration only.' },
      { date: '2026-10-02 09:00', title: 'Dispatch evidence added', detail: 'Sample shipment documentation.' },
      { date: '2026-10-10 15:20', title: 'Delivery recorded', detail: 'Sample event; inspection remains pending.' },
    ],
  },
  {
    id: 'PP-2124',
    title: 'Cement Bag Consolidation',
    buyerName: 'BlueStone Infrastructure',
    sellerName: 'Harbor Supply Co.',
    product: 'Cement bags and silica mix',
    amount: 361200,
    currency: 'INR',
    createdAt: '2026-08-22',
    deliveryDeadline: '2026-09-04',
    paymentStatus: 'Refund Requested',
    deliveryStatus: 'Completed',
    currentStage: 'Disputed',
    status: 'Disputed',
    category: 'Construction',
    quantity: 440,
    unitPrice: 820,
    deliveryMethod: 'Local pickup',
    deliveryAddress: 'Whitefield, Bengaluru',
    expectedDispatchDate: '2026-08-25',
    inspectionPeriod: '48 hours',
    agreementHistory: ['Buyer accepted · 2026-08-22 12:15', 'Seller accepted · 2026-08-22 13:10'],
    paymentPartnerStatus: 'Refund requested in demo record; partner decision not represented.',
    dispatchEvidence: 'Sample handover acknowledgement',
    trackingNumber: 'LOCAL-PICKUP-PP-2124',
    deliveredAt: '2026-08-30 16:00 (sample event)',
    inspectionResult: 'Issue raised; review pending in demo workflow',
    activity: [
      { date: '2026-08-22 11:40', title: 'Transaction created', detail: 'Sample commercial agreement.' },
      { date: '2026-08-22 12:15', title: 'Agreement accepted', detail: 'Acceptance events recorded for demonstration.' },
      { date: '2026-08-30 16:00', title: 'Handover recorded', detail: 'Sample local pickup event.' },
      { date: '2026-09-01 10:00', title: 'Dispute opened', detail: 'A sample issue is under review.' },
    ],
  },
]

const initialDisputes: Dispute[] = [
  {
    id: 'DSP-4001',
    title: 'Delayed site delivery',
    category: 'Delayed delivery',
    issue: 'The shipment was delayed at the route checkpoint and arrived 6 days later than the stated deadline.',
    status: 'Under Review',
    createdAt: '2026-10-02',
    priority: 'High',
    transactionId: 'PP-2124',
    sellerResponse: 'Response not yet recorded.',
  },
  {
    id: 'DSP-4012',
    title: 'Product mismatch',
    category: 'Product mismatch',
    issue: 'The delivered unit differs from the approved sample specification and requires inspection.',
    status: 'Awaiting Seller Response',
    createdAt: '2026-10-04',
    priority: 'Medium',
    transactionId: 'PP-2087',
    sellerResponse: 'Response not yet recorded.',
  },
]

const initialAgreements: Agreement[] = [
  {
    id: 'AGR-109',
    title: 'Precision Motor Assembly Kit',
    transactionId: 'PP-2048',
    buyerAccepted: true,
    sellerAccepted: true,
    version: 'V3',
    updatedAt: '2026-10-07',
    history: ['Buyer accepted · 2026-10-06 10:15', 'Seller accepted · 2026-10-06 11:42'],
  },
  {
    id: 'AGR-210',
    title: 'Cotton Export Packaging Order',
    transactionId: 'PP-2019',
    buyerAccepted: true,
    sellerAccepted: false,
    version: 'V2',
    updatedAt: '2026-09-18',
    history: ['Buyer accepted · 2026-09-18 09:10', 'Awaiting seller acceptance'],
  },
  {
    id: 'AGR-2087',
    title: 'Cold-Chain Temperature Sensors',
    transactionId: 'PP-2087',
    buyerAccepted: true,
    sellerAccepted: true,
    version: 'V2',
    updatedAt: '2026-09-30',
    history: ['Buyer accepted · 2026-09-30 13:15', 'Seller accepted · 2026-09-30 13:45'],
  },
  {
    id: 'AGR-2124',
    title: 'Cement Bag Consolidation',
    transactionId: 'PP-2124',
    buyerAccepted: true,
    sellerAccepted: true,
    version: 'V1',
    updatedAt: '2026-08-22',
    history: ['Buyer accepted · 2026-08-22 12:15', 'Seller accepted · 2026-08-22 13:10'],
  },
]

function loadTransactions(): Transaction[] {
  const saved = storage.get<unknown>('pactpal_transactions', standardInitialTransactions)
  if (!Array.isArray(saved)) return structuredClone(standardInitialTransactions)
  const loaded = saved.filter((item): item is Partial<Transaction> & { id: string; title: string } => Boolean(item && typeof item === 'object' && 'id' in item && 'title' in item)).map((item) => {
    const base = standardInitialTransactions.find((tx) => tx.id === item.id)
    const quantity = Number(item.quantity ?? base?.quantity ?? 1)
    const unitPrice = Number(item.unitPrice ?? base?.unitPrice ?? item.amount ?? 0)
    return {
      ...base,
      ...item,
      buyerName: item.buyerName ?? base?.buyerName ?? 'Not recorded',
      sellerName: item.sellerName ?? base?.sellerName ?? 'Not recorded',
      product: item.product ?? base?.product ?? item.title,
      amount: quantity * unitPrice,
      currency: item.currency ?? base?.currency ?? 'INR',
      createdAt: item.createdAt ?? base?.createdAt ?? '',
      deliveryDeadline: item.deliveryDeadline ?? base?.deliveryDeadline ?? '',
      paymentStatus: item.paymentStatus ?? base?.paymentStatus ?? 'Pending',
      deliveryStatus: item.deliveryStatus ?? base?.deliveryStatus ?? 'Awaiting Dispatch',
      currentStage: item.status ?? base?.status ?? 'Draft',
      status: item.status ?? base?.status ?? 'Draft',
      category: item.category ?? base?.category ?? 'Other',
      quantity,
      unitPrice,
      deliveryMethod: item.deliveryMethod ?? base?.deliveryMethod ?? 'Not specified',
      deliveryAddress: item.deliveryAddress ?? base?.deliveryAddress ?? 'Not recorded',
      expectedDispatchDate: item.expectedDispatchDate ?? base?.expectedDispatchDate ?? 'Not specified',
      inspectionPeriod: item.inspectionPeriod ?? base?.inspectionPeriod ?? 'Not specified',
      agreementHistory: Array.isArray(item.agreementHistory) ? item.agreementHistory : base?.agreementHistory ?? [],
      paymentPartnerStatus: item.paymentPartnerStatus ?? base?.paymentPartnerStatus ?? 'No partner processing is active.',
      dispatchEvidence: item.dispatchEvidence ?? base?.dispatchEvidence ?? 'No dispatch evidence recorded',
      trackingNumber: item.trackingNumber ?? base?.trackingNumber ?? 'Not assigned',
      deliveredAt: item.deliveredAt ?? base?.deliveredAt ?? 'Not delivered',
      inspectionResult: item.inspectionResult ?? base?.inspectionResult ?? 'Not started',
      activity: Array.isArray(item.activity) ? item.activity : base?.activity ?? [],
      supportingDocuments: item.supportingDocuments ?? base?.supportingDocuments ?? 'Not provided',
      specialConditions: item.specialConditions ?? base?.specialConditions ?? 'Not recorded',
    }
  })
  return [...loaded, ...standardInitialTransactions.filter((tx) => !loaded.some((item) => item.id === tx.id))]
}

function loadAgreements(): Agreement[] {
  const saved = storage.get<unknown>('pactpal_agreements', initialAgreements)
  if (!Array.isArray(saved)) return structuredClone(initialAgreements)
  const loaded = saved.filter((item): item is Partial<Agreement> & { id: string; title: string } => Boolean(item && typeof item === 'object' && 'id' in item && 'title' in item)).map((item) => {
    const base = initialAgreements.find((agreement) => agreement.id === item.id)
    return {
      ...base,
      ...item,
      title: base?.title ?? item.title,
      transactionId: item.transactionId ?? base?.transactionId ?? '',
      buyerAccepted: item.buyerAccepted ?? base?.buyerAccepted ?? false,
      sellerAccepted: item.sellerAccepted ?? base?.sellerAccepted ?? false,
      version: item.version ?? base?.version ?? 'V1',
      updatedAt: item.updatedAt ?? base?.updatedAt ?? '',
      history: Array.isArray(item.history) ? item.history : base?.history ?? ['Agreement record loaded from prior demo data.'],
    }
  })
  return [...loaded, ...initialAgreements.filter((agreement) => !loaded.some((item) => item.id === agreement.id))]
}

function loadDisputes(): Dispute[] {
  const saved = storage.get<unknown>('pactpal_disputes', initialDisputes)
  if (!Array.isArray(saved)) return structuredClone(initialDisputes)
  const loaded = saved.filter((item): item is Partial<Dispute> & { id: string; title: string } => Boolean(item && typeof item === 'object' && 'id' in item && 'title' in item)).map((item) => {
    const base = initialDisputes.find((dispute) => dispute.id === item.id)
    return {
      ...base,
      ...item,
      category: item.category ?? base?.category ?? 'Other contractual disagreements',
      issue: item.issue ?? base?.issue ?? '',
      status: item.status ?? base?.status ?? 'Open',
      createdAt: item.createdAt ?? base?.createdAt ?? '',
      priority: item.priority ?? base?.priority ?? 'Medium',
      transactionId: item.transactionId ?? base?.transactionId ?? standardInitialTransactions[0].id,
      sellerResponse: item.sellerResponse ?? base?.sellerResponse ?? 'Response not yet recorded.',
    }
  })
  return [...loaded, ...initialDisputes.filter((dispute) => !loaded.some((item) => item.id === dispute.id))]
}

const industries = [
  'Manufacturing',
  'Textiles',
  'Electronics',
  'Agriculture',
  'Construction',
  'Wholesale distribution',
  'Industrial supplies',
  'Healthcare supplies',
  'Other eligible B2B sectors',
]

const disputeCategories = [
  'Non-delivery',
  'Incorrect quantity',
  'Product mismatch',
  'Damaged products',
  'Delayed delivery',
  'Service not completed',
  'Other contractual disagreements',
]

const statusClasses: Record<string, string> = {
  'Awaiting Seller Acceptance': 'bg-amber-100 text-amber-700 border border-amber-200',
  'Awaiting Buyer Payment': 'bg-sky-100 text-sky-700 border border-sky-200',
  'Payment Confirmed (Demo)': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  Processing: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
  Dispatched: 'bg-violet-100 text-violet-700 border border-violet-200',
  'In Transit': 'bg-cyan-100 text-cyan-700 border border-cyan-200',
  Delivered: 'bg-teal-100 text-teal-700 border border-teal-200',
  'Under Inspection': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  Completed: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  Disputed: 'bg-red-100 text-red-700 border border-red-200',
  'Refund Requested': 'bg-orange-100 text-orange-700 border border-orange-200',
  Cancelled: 'bg-slate-200 text-slate-700 border border-slate-300',
  Draft: 'bg-slate-100 text-slate-700 border border-slate-300',
}

const formatCurrency = (value: number, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)

const renderedYear = new Date().getFullYear()
const getCurrentTimestamp = () => new Date().toLocaleString()
const makeActivityEntry = (title: string, detail: string) => ({
  date: getCurrentTimestamp(),
  title,
  detail,
})

const renderStatusPill = (status: string) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[status] ?? 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
    {status}
  </span>
)

function EmptyState({ title, message, action }: { title: string; message: string; action?: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF1FA] text-[#2563EB]"><FileText className="h-5 w-5" /></div><h3 className="mt-4 font-semibold text-[#172B45]">{title}</h3><p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{message}</p>{action && <div className="mt-4">{action}</div>}</div>
}

function RoleNotice({ expected }: { expected: 'buyer' | 'seller' }) {
  return <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">This page contains {expected}-specific actions. Select the <strong>{expected}</strong> demo role from the header to use them; other role actions are not shown.</div>
}

function TransactionProgress({ status }: { status: TransactionStatus }) {
  const stages = ['Agreement', 'Payment partner', 'Fulfilment', 'Delivery', 'Inspection', 'Complete']
  const stageIndex: Record<TransactionStatus, number> = {
    Draft: 0,
    'Awaiting Seller Acceptance': 0,
    'Awaiting Buyer Payment': 1,
    'Payment Confirmed (Demo)': 1,
    Processing: 2,
    Dispatched: 2,
    'In Transit': 3,
    Delivered: 3,
    'Under Inspection': 4,
    Completed: 5,
    Disputed: 4,
    'Refund Requested': 4,
    Cancelled: 0,
  }
  const activeStage = stageIndex[status]
  return <div className="mt-4" aria-label={`Transaction progress: ${status}`}><div className="mb-2 flex justify-between text-[10px] font-medium text-slate-500 sm:text-xs">{stages.map((stage, index) => <span key={stage} className={index <= activeStage ? 'text-[#2563EB]' : ''}>{stage}</span>)}</div><div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><div className={`h-full rounded-full transition-all duration-500 ${status === 'Disputed' || status === 'Refund Requested' ? 'bg-[#D97706]' : 'bg-[#2563EB]'}`} style={{ width: `${(activeStage / (stages.length - 1)) * 100}%` }} /></div></div>
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return <div role="status" aria-live="polite" className="fixed bottom-5 right-5 z-[70] flex max-w-sm items-center gap-3 rounded-2xl bg-[#0B1F3A] px-5 py-4 text-sm font-medium text-white shadow-xl"><CheckCircle2 className="h-5 w-5 flex-none text-emerald-300" /><span>{message}</span><button aria-label="Dismiss notification" onClick={onClose} className="ml-1 rounded-full p-1 hover:bg-white/10"><X className="h-4 w-4" /></button></div>
}

function ConfirmDialog({ title, message, confirmLabel = 'Confirm', onCancel, onConfirm }: { title: string; message: string; confirmLabel?: string; onCancel: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4" role="presentation"><div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><h2 id="confirm-title" className="text-xl font-bold text-[#0B1F3A]">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{message}</p><div className="mt-6 flex justify-end gap-3"><button onClick={onCancel} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button><button onClick={onConfirm} className="rounded-full bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white">{confirmLabel}</button></div></div></div>
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

function AppShell() {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadTransactions(),
  )
  const [disputes, setDisputes] = useState<Dispute[]>(() =>
    loadDisputes(),
  )
  const [agreements, setAgreements] = useState<Agreement[]>(() =>
    loadAgreements(),
  )
  const [role, setRole] = useState<UserRole>(() => storage.get<UserRole>('pactpal_role', 'buyer'))
  const [loginOpen, setLoginOpen] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    storage.set('pactpal_transactions', transactions)
  }, [transactions])

  useEffect(() => {
    storage.set('pactpal_disputes', disputes)
  }, [disputes])

  useEffect(() => {
    storage.set('pactpal_role', role)
  }, [role])

  useEffect(() => {
    storage.set('pactpal_agreements', agreements)
  }, [agreements])

  const notify = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice((current) => current === message ? '' : current), 3200)
  }

  const resetDemo = () => {
    setTransactions(structuredClone(standardInitialTransactions))
    setDisputes(structuredClone(initialDisputes))
    setAgreements(structuredClone(initialAgreements))
    setRole('buyer')
    storage.set('pactpal_transactions', standardInitialTransactions)
    storage.set('pactpal_disputes', initialDisputes)
    storage.set('pactpal_agreements', initialAgreements)
    storage.set('pactpal_role', 'buyer')
    setResetConfirmOpen(false)
    notify('Demo data restored to the original sample dataset.')
  }

  return (
    <div className="min-h-screen bg-[#F3F6FA] text-[#172B45]">
      <SiteHeader
        role={role}
        loginOpen={loginOpen}
        setLoginOpen={setLoginOpen}
        mobileMenu={mobileMenu}
        setMobileMenu={setMobileMenu}
        onResetDemo={() => setResetConfirmOpen(true)}
        onRoleChange={(nextRole) => {
          setRole(nextRole)
          notify(`Demo role changed to ${nextRole}.`)
        }}
      />

      <MainLayout>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/buyers" element={<BuyerPage transactions={transactions} role={role} disputes={disputes} />} />
            <Route path="/sellers" element={<SellerPage transactions={transactions} role={role} disputes={disputes} />} />
            <Route path="/transactions" element={<TransactionsPage transactions={transactions} disputes={disputes} />} />
            <Route
              path="/create-transaction"
              element={<CreateTransactionPage onCreate={(newTransaction) => {
                setTransactions((prev) => [newTransaction, ...prev])
                setAgreements((prev) => [{
                  id: `AGR-${newTransaction.id.slice(-4)}`,
                  title: newTransaction.title,
                  transactionId: newTransaction.id,
                  buyerAccepted: false,
                  sellerAccepted: false,
                  version: 'V1',
                  updatedAt: new Date().toISOString().slice(0, 10),
                  history: ['Agreement draft created; awaiting party review.'],
                }, ...prev])
                notify('Transaction created in demo mode.')
              }} />}
            />
            <Route path="/agreements" element={<AgreementsPage agreements={agreements} role={role} onAccept={(id, acceptingRole) => {
              const acceptedAt = new Date().toLocaleString()
              setAgreements((prev) => prev.map((agreement) => agreement.id !== id ? agreement : {
                ...agreement,
                buyerAccepted: acceptingRole === 'buyer' || agreement.buyerAccepted,
                sellerAccepted: acceptingRole === 'seller' || agreement.sellerAccepted,
                updatedAt: new Date().toISOString().slice(0, 10),
                history: [...agreement.history, `${acceptingRole === 'buyer' ? 'Buyer' : 'Seller'} accepted · ${acceptedAt} (demo)`],
              }))
              setTransactions((prev) => prev.map((tx) => {
                const agreement = agreements.find((item) => item.id === id)
                if (!agreement || tx.id !== agreement.transactionId) return tx
                const buyerAccepted = acceptingRole === 'buyer' || agreement.buyerAccepted
                const sellerAccepted = acceptingRole === 'seller' || agreement.sellerAccepted
                return {
                  ...tx,
                  status: buyerAccepted && sellerAccepted ? 'Awaiting Buyer Payment' : 'Awaiting Seller Acceptance',
                  currentStage: buyerAccepted && sellerAccepted ? 'Awaiting Buyer Payment' : 'Awaiting Seller Acceptance',
                  agreementHistory: [...tx.agreementHistory, `${acceptingRole === 'buyer' ? 'Buyer' : 'Seller'} accepted · ${acceptedAt} (demo)`],
                  activity: [...tx.activity, { date: acceptedAt, title: 'Agreement acceptance recorded', detail: `${acceptingRole} acceptance saved locally in the demo.` }],
                }
              }))
              notify('Agreement acceptance recorded in the demo.')
            }} />} />
            <Route path="/delivery" element={<DeliveryPage transactions={transactions} role={role} onUpdate={(id, update) => setTransactions((prev) => prev.map((tx) => tx.id === id ? { ...tx, ...update } : tx))} onNotify={notify} />} />
            <Route path="/disputes" element={<DisputesPage disputes={disputes} setDisputes={setDisputes} transactions={transactions} role={role} onNotify={notify} onCreate={(dispute) => {
              setDisputes((prev) => [dispute, ...prev])
              setTransactions((prev) => prev.map((tx) => tx.id !== dispute.transactionId ? tx : {
                ...tx,
                status: 'Disputed',
                currentStage: 'Disputed',
                activity: [...tx.activity, { date: new Date().toLocaleString(), title: 'Dispute opened', detail: `${dispute.id} created in the local demo.` }],
              }))
            }} />} />
            <Route path="/admin" element={<AdminPage transactions={transactions} disputes={disputes} />} />
            <Route path="/payment-architecture" element={<PaymentArchitecturePage />} />
            <Route path="/partnership" element={<PartnershipPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
        </AnimatePresence>
      </MainLayout>
      {notice && <Toast message={notice} onClose={() => setNotice('')} />}
      {resetConfirmOpen && (
        <ConfirmDialog
          title="Reset demo data?"
          message="This restores the original sample transactions, agreements and disputes, and switches the demo role back to buyer."
          confirmLabel="Reset demo"
          onCancel={() => setResetConfirmOpen(false)}
          onConfirm={resetDemo}
        />
      )}
    </div>
  )
}

function SiteHeader({
  role,
  loginOpen,
  setLoginOpen,
  mobileMenu,
  setMobileMenu,
  onResetDemo,
  onRoleChange,
}: {
  role: UserRole
  loginOpen: boolean
  setLoginOpen: React.Dispatch<React.SetStateAction<boolean>>
  mobileMenu: boolean
  setMobileMenu: React.Dispatch<React.SetStateAction<boolean>>
  onResetDemo: () => void
  onRoleChange: (role: UserRole) => void
}) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="PactPal home" className="flex items-center">
            <img src={pactPalLogo} alt="PactPal — Trade with Confidence" className="h-auto w-40 sm:w-48" />
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `text-sm font-medium transition ${isActive ? 'text-[#0B1F3A]' : 'text-slate-600 hover:text-[#0B1F3A]'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <button onClick={onResetDemo} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300">
              Reset Demo Data
            </button>
            <button
              onClick={() => setLoginOpen(true)}
              className="rounded-full bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163A63]"
            >
              {role === 'guest' ? 'Login' : `Logged in as ${role}`}
            </button>
          </div>

          <button className="lg:hidden" onClick={() => setMobileMenu((prev) => !prev)} aria-label="Toggle menu">
            <Menu className="h-6 w-6 text-[#0B1F3A]" />
          </button>
        </div>

        {mobileMenu && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <NavLink key={item.href} to={item.href} onClick={() => setMobileMenu(false)} className="text-sm text-slate-700 hover:text-[#0B1F3A]">
                  {item.label}
                </NavLink>
              ))}
              <div className="mt-2 flex gap-2">
                <button onClick={onResetDemo} className="flex-1 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                  Reset Demo Data
                </button>
                <button onClick={() => setLoginOpen(true)} className="flex-1 rounded-full bg-[#0B1F3A] px-3 py-2 text-xs font-semibold text-white">
                  {role === 'guest' ? 'Login' : `Role: ${role}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSelectRole={onRoleChange} />
    </>
  )
}

function LoginModal({
  open,
  onClose,
  onSelectRole,
}: {
  open: boolean
  onClose: () => void
  onSelectRole: (role: UserRole) => void
}) {
  if (!open) return null

  const roles: { role: UserRole; email: string; title: string }[] = [
    { role: 'buyer', email: 'buyer@pactpal.demo', title: 'Buyer' },
    { role: 'seller', email: 'seller@pactpal.demo', title: 'Seller' },
    { role: 'admin', email: 'admin@pactpal.demo', title: 'Admin' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Demo access</p>
            <h3 className="mt-2 text-2xl font-bold text-[#0B1F3A]">Select a role</h3>
          </div>
          <button onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {roles.map((item) => (
            <button
              key={item.role}
              onClick={() => {
                onSelectRole(item.role)
                onClose()
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 p-4 text-left transition hover:border-[#2563EB] hover:bg-[#EAF1FA]"
            >
              <div>
                <div className="text-lg font-semibold text-[#172B45]">{item.title}</div>
                <div className="text-sm text-slate-500">{item.email}</div>
              </div>
              <ChevronRight className="h-5 w-5 text-[#2563EB]" />
            </button>
          ))}
        </div>

        <p className="mt-5 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
          Demo-only role selection. This prototype does not implement real authentication or secure production credentials.
        </p>
      </div>
    </div>
  )
}

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-16">
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mb-5 rounded-2xl border border-sky-100 bg-[#EAF1FA] px-4 py-3 text-sm text-slate-700">
          “PactPal is currently a proposed startup platform and demonstration prototype. Payment collection, fund custody, conditional settlement and financial services will only be enabled after the necessary regulatory review, partner approval and formal onboarding.”
        </div>
      </div>
      {children}
      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div>
            <div className="mb-4">
              <img src={pactPalLogo} alt="PactPal — Trade with Confidence" className="h-auto w-44" />
            </div>
            <p className="text-sm text-slate-600">
              Trade with Confidence. Every Transaction Matters.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Company</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link to="/how-it-works">How it works</Link></li>
              <li><Link to="/buyers">For buyers</Link></li>
              <li><Link to="/sellers">For sellers</Link></li>
              <li><Link to="/admin">Admin dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link to="/payment-architecture">Payment architecture</Link></li>
              <li><Link to="/transactions">Transactions</Link></li>
              <li><Link to="/agreements">Agreements</Link></li>
              <li><Link to="/delivery">Delivery</Link></li>
              <li><Link to="/disputes">Disputes</Link></li>
              <li><Link to="/partnership">Partnership</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Contact</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>hello@pactpal.demo</li>
              <li>+91 98765 43210</li>
              <li>Bengaluru, India</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200 bg-[#F3F6FA] py-4 text-center text-sm text-slate-500">
          © {renderedYear} PactPal. Professional demo prototype for preliminary feasibility evaluation.
        </div>
      </footer>
    </div>
  )
}

function LandingPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr,0.9fr]">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-[#DDEBFF] bg-[#EEF5FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#2563EB]">
              Secure B2B transaction platform
            </div>
            <h1 className="max-w-xl text-4xl font-black tracking-tight text-[#0B1F3A] sm:text-5xl">
              Every Business Transaction Deserves Trust.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-600">
              PactPal brings buyers and sellers together through transparent agreements, secure payment coordination, delivery confirmation and fair transaction management.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/create-transaction" className="rounded-full bg-[#0B1F3A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#163A63]">
                Get Started
              </Link>
              <Link to="/how-it-works" className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-[#172B45] transition hover:border-slate-400">
                Explore How It Works
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl gap-4 sm:grid-cols-2">
              {[
                'Transparent Transactions',
                'Business profile records',
                'Documented Agreements',
                'Structured Dispute Workflow',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <ShieldCheck className="h-5 w-5 text-[#2563EB]" />
                  <span className="text-sm font-medium text-[#172B45]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_35px_80px_-40px_rgba(11,31,58,0.35)]">
            <div className="rounded-[28px] bg-[#EAF1FA] p-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Live transaction map</p>
                  <h3 className="mt-1 text-xl font-semibold text-[#0B1F3A]">Order Flow</h3>
                </div>
                <div className="rounded-full bg-[#EAF1FA] px-3 py-1 text-xs font-semibold text-[#2563EB]">Demo status</div>
              </div>

              <div className="relative mt-6 space-y-5">
                {[{ icon: Users, text: 'Buyer creates order', tone: 'bg-[#0B1F3A]' }, { icon: FileText, text: 'Agreement signed', tone: 'bg-[#163A63]' }, { icon: Landmark, text: 'Payment partner review', tone: 'bg-[#2563EB]' }, { icon: PackageCheck, text: 'Seller dispatches', tone: 'bg-[#16A34A]' }, { icon: CheckCircle2, text: 'Delivery confirmed', tone: 'bg-[#D97706]' }].map((step, index) => (
                  <div key={step.text} className="relative flex items-center gap-4">
                    {index !== 4 && <div className="absolute left-[17px] top-10 h-8 w-px bg-slate-300" />}
                    <div className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full ${step.tone} text-white`}>
                      <step.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-sm font-semibold text-[#172B45]">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Agreements', value: 'Shared terms', detail: 'Documented transaction expectations' },
            { label: 'Evidence', value: 'Traceable', detail: 'Delivery and inspection milestones' },
            { label: 'Payment workflow', value: 'Partner-led', detail: 'Subject to partner approval' },
            { label: 'Disputes', value: 'Structured', detail: 'Review and response workflow' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <div className="mt-3 text-3xl font-black text-[#0B1F3A]">{stat.value}</div>
              <p className="mt-2 text-sm text-slate-600">{stat.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Business transaction challenges</p>
          <h2 className="mt-3 text-3xl font-bold text-[#0B1F3A]">Where trust breaks down in B2B trade</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Payment risk', 'Buyers pay for shipments that never arrive or fail inspection after dispatch.'],
            ['Delivery disputes', 'Goods move without clear reception evidence, making resolution slow and difficult.'],
            ['Communication gaps', 'Key approval steps are fragmented across calls, WhatsApp and scattered documents.'],
            ['Trust deficit', 'Suppliers and buyers lack a shared record of commitments and evidence.'],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1FA] text-[#2563EB]">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-[#172B45]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">How PactPal works</p>
          <h2 className="mt-3 text-3xl font-bold text-[#0B1F3A]">A transparent workflow for every trade milestone</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            ['Create transaction', 'The buyer or seller defines the commercial terms, agreed price, quantity and delivery conditions.'],
            ['Review and accept', 'The counterparty reviews the agreement, documents and quality expectations before accepting.'],
            ['Track and settle', 'PactPal coordinates payment readiness, delivery evidence and completion confirmation.'],
          ].map(([title, desc], index) => (
            <div key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#0B1F3A] text-sm font-bold text-white">0{index + 1}</div>
              <h3 className="text-xl font-semibold text-[#172B45]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Buyer protection</p>
            <h3 className="mt-4 text-3xl font-bold text-[#0B1F3A]">Secure every purchase milestone</h3>
            <ul className="mt-6 space-y-4 text-slate-600">
              <li className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-[#16A34A]" /> Clear agreement terms before payment is coordinated.</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-[#16A34A]" /> Tracking evidence for dispatch, handover and proof of delivery.</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-[#16A34A]" /> Inspection confirmation before final settlement is approved.</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Seller protection</p>
            <h3 className="mt-4 text-3xl font-bold text-[#0B1F3A]">Reduce uncertainty and speed up fulfilment</h3>
            <ul className="mt-6 space-y-4 text-slate-600">
              <li className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-[#16A34A]" /> Shared transaction record with clear commercial conditions.</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-[#16A34A]" /> Standardised proof of dispatch and proof of delivery records.</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-[#16A34A]" /> Structured dispute workflow to maintain trust and reduce delays.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Platform features</p>
          <h2 className="mt-3 text-3xl font-bold text-[#0B1F3A]">Built to support the flow of trusted trade</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Transaction documents', 'Agreement outlines, product details and commercially agreed conditions kept in one place.'],
            ['Status tracking', 'Updated across creation, payment coordination, dispatch, delivery and inspection.'],
            ['Evidence capture', 'Upload shipment proof and support dispute, quality and delivery actions.'],
            ['Dispute workflows', 'Track issues from dispute creation through response, review and closure.'],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF1FA] text-[#2563EB]">
                <FolderKanban className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#172B45]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-[#0B1F3A] p-8 text-white shadow-sm">
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Supported industries</p>
            <h2 className="mt-3 text-3xl font-bold">Eligible B2B sectors for demonstration workflows</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {industries.map((industry) => (
              <div key={industry} className="rounded-2xl border border-slate-700 bg-white/5 px-4 py-3 text-sm text-slate-100">
                {industry}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Transaction workflow illustration</p>
          <h2 className="mt-3 text-3xl font-bold text-[#0B1F3A]">From agreement to settlement</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-7">
          {['Create', 'Accept', 'Pay', 'Fulfil', 'Deliver', 'Inspect', 'Settle'].map((step, i) => (
            <div key={step} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF1FA] text-sm font-semibold text-[#2563EB]">{i + 1}</div>
              <div className="font-semibold text-[#172B45]">{step}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">FAQ</p>
          <h2 className="mt-3 text-3xl font-bold text-[#0B1F3A]">Frequently asked questions</h2>
        </div>
        <div className="space-y-4">
          {[{ q: 'Is PactPal a live finance product?', a: 'No. This prototype is a demonstration platform for evaluating transaction trust workflows and business model viability.' }, { q: 'Does PactPal collect funds today?', a: 'No. The prototype does not hold or process real customer funds. Financial services are presented as future, regulated capability.' }, { q: 'How are disputes handled?', a: 'Disputes are created, reviewed and managed through structured process steps that support evidence collection and responses.' }, { q: 'Is this integrated with Razorpay?', a: 'Not currently. The architecture page clearly indicates a proposed payment partner integration pending approval.' }].map((item) => (
            <div key={item.q} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="font-semibold text-[#172B45]">{item.q}</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Contact & partnership enquiry</p>
              <h2 className="mt-3 text-3xl font-bold text-[#0B1F3A]">Discuss commercial opportunities with PactPal</h2>
              <p className="mt-4 text-slate-600">We are building a trusted B2B transaction environment and welcome early-stage evaluation from prospective partners, fintech enablers and business stakeholders.</p>
            </div>
            <div className="rounded-3xl bg-[#EAF1FA] p-6">
              <h3 className="text-xl font-semibold text-[#0B1F3A]">Reach out</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div>Email: hello@pactpal.demo</div>
                <div>Phone: +91 98765 43210</div>
                <div>Business inquiry: Partnership / legal / product</div>
              </div>
              <Link to="/contact" className="mt-6 inline-flex rounded-full bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163A63]">
                Send enquiry
              </Link>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  )
}

function HowItWorksPage() {
  const steps = [
    'Buyer or seller creates a transaction.',
    'The other party receives a transaction invitation.',
    'Both parties review and accept the agreement.',
    'Buyer proceeds to the proposed payment partner.',
    'Seller fulfils the order.',
    'Shipment and delivery evidence are recorded.',
    'Buyer inspects the products or confirms service completion.',
    'Settlement or refund is processed through the authorised payment arrangement, according to approved conditions.',
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">How it works</p>
        <h1 className="mt-3 text-4xl font-black text-[#0B1F3A]">The PactPal transaction lifecycle</h1>
      </div>

      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={step} className="flex gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-[#0B1F3A] text-sm font-bold text-white">{index + 1}</div>
            <div className="flex-1">
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Step {index + 1}</div>
              <p className="text-lg text-[#172B45]">{step}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function BuyerPage({ transactions, role, disputes }: { transactions: Transaction[]; role: UserRole; disputes: Dispute[] }) {
  const metrics = [
    { label: 'Pending acceptance', value: transactions.filter((tx) => tx.status === 'Awaiting Seller Acceptance').length, icon: ClipboardCheck },
    { label: 'Awaiting payment', value: transactions.filter((tx) => tx.status === 'Awaiting Buyer Payment').length, icon: CreditCard },
    { label: 'In transit', value: transactions.filter((tx) => tx.status === 'In Transit').length, icon: Truck },
    { label: 'Awaiting inspection', value: transactions.filter((tx) => tx.status === 'Under Inspection').length, icon: PackageCheck },
    { label: 'Open disputes', value: disputes.filter((item) => item.status !== 'Resolved' && item.status !== 'Closed').length, icon: MessageSquareWarning },
    { label: 'Completed', value: transactions.filter((tx) => tx.status === 'Completed').length, icon: BadgeCheck },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Buyer dashboard · demo data</p>
          <h1 className="mt-3 text-4xl font-black text-[#0B1F3A]">Transaction confidence at a glance</h1>
        </div>
        {role === 'buyer' && <Link to="/create-transaction" className="rounded-full bg-[#0B1F3A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#163A63]">Create transaction</Link>}
      </div>
      {role !== 'buyer' && <RoleNotice expected="buyer" />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((item) => (
          <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EAF1FA] text-[#2563EB]"><item.icon className="h-5 w-5" /></div>
            <div className="text-3xl font-black text-[#0B1F3A]">{item.value}</div>
            <div className="mt-1 text-sm text-slate-600">{item.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between"><h3 className="text-xl font-semibold text-[#172B45]">Shared demo transactions</h3><Link to="/transactions" className="text-sm font-semibold text-[#2563EB]">View all</Link></div>
          {transactions.length ? <div className="space-y-4">{transactions.map((tx) => (
            <Link key={tx.id} to="/transactions" className="block rounded-2xl border border-slate-200 p-4 transition hover:border-[#2563EB] hover:bg-slate-50">
              <div className="flex flex-wrap items-center justify-between gap-3"><div className="font-semibold text-[#172B45]">{tx.title}<div className="mt-1 text-sm font-normal text-slate-500">{tx.id} · Seller: {tx.sellerName}</div></div>{renderStatusPill(tx.status)}</div>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-600"><span>{tx.quantity} units · {tx.product}</span><span className="font-semibold text-[#172B45]">{formatCurrency(tx.amount, tx.currency)}</span></div>
              <TransactionProgress status={tx.status} />
            </Link>
          ))}</div> : <EmptyState title="No transactions yet" message="Create a demo transaction to start the buyer workflow." action={<Link to="/create-transaction" className="text-sm font-semibold text-[#2563EB]">Create transaction</Link>} />}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-[#EAF1FA] p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-[#172B45]">Buyer actions</h3>
          <div className="mt-5 space-y-3">
            {role === 'buyer' ? [
              ['Review agreements', '/agreements'], ['Track shipment', '/delivery'], ['Review payment status', '/transactions'], ['Submit inspection or raise a dispute', '/disputes'],
            ].map(([label, href]) => <Link key={label} to={href} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-sm font-medium text-[#172B45] hover:border-slate-300"><span>{label}</span><ArrowRight className="h-4 w-4 text-[#2563EB]" /></Link>) : <p className="text-sm leading-6 text-slate-600">Buyer actions are available after selecting the buyer demo role.</p>}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function SellerPage({ transactions, role, disputes }: { transactions: Transaction[]; role: UserRole; disputes: Dispute[] }) {
  const metrics = [
    { label: 'New requests', value: transactions.filter((tx) => tx.status === 'Awaiting Seller Acceptance').length, icon: FolderKanban },
    { label: 'Pending agreements', value: transactions.filter((tx) => tx.status === 'Awaiting Seller Acceptance').length, icon: FileText },
    { label: 'Payment statuses confirmed', value: transactions.filter((tx) => tx.paymentStatus === 'Confirmed').length, icon: CircleDollarSign },
    { label: 'Dispatch tasks', value: transactions.filter((tx) => ['Processing', 'Payment Confirmed (Demo)'].includes(tx.status)).length, icon: PackageCheck },
    { label: 'In-transit shipments', value: transactions.filter((tx) => tx.status === 'In Transit').length, icon: Truck },
    { label: 'Dispute responses needed', value: disputes.filter((item) => item.sellerResponse === 'Response not yet recorded.' && !['Resolved', 'Closed'].includes(item.status)).length, icon: MessageSquareWarning },
  ]
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Seller dashboard · demo data</p><h1 className="mt-3 text-4xl font-black text-[#0B1F3A]">Manage incoming orders with confidence</h1></div>{role === 'seller' && <Link to="/create-transaction" className="rounded-full bg-[#0B1F3A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#163A63]">Create request</Link>}</div>
      {role !== 'seller' && <RoleNotice expected="seller" />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{metrics.map((item) => <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EAF1FA] text-[#2563EB]"><item.icon className="h-5 w-5" /></div><div className="text-3xl font-black text-[#0B1F3A]">{item.value}</div><div className="mt-1 text-sm text-slate-600">{item.label}</div></div>)}</div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center justify-between"><h3 className="text-xl font-semibold text-[#172B45]">Order pipeline</h3><Link to="/transactions" className="text-sm font-semibold text-[#2563EB]">View transactions</Link></div>
          {transactions.length ? <div className="space-y-4">{transactions.map((tx) => <Link key={tx.id} to="/transactions" className="block rounded-2xl border border-slate-200 p-4 transition hover:border-[#2563EB] hover:bg-slate-50"><div className="flex flex-wrap items-center justify-between gap-3"><div className="font-semibold text-[#172B45]">{tx.title}<div className="mt-1 text-sm font-normal text-slate-500">{tx.id} · Buyer: {tx.buyerName}</div></div>{renderStatusPill(tx.status)}</div><div className="mt-4 flex items-center justify-between text-sm text-slate-600"><span>{tx.quantity} units</span><span className="font-semibold text-[#172B45]">{formatCurrency(tx.amount, tx.currency)}</span></div><TransactionProgress status={tx.status} /></Link>)}</div> : <EmptyState title="No incoming requests" message="New sample requests will appear here." />}</div>
        <div className="rounded-3xl border border-slate-200 bg-[#EAF1FA] p-6 shadow-sm"><h3 className="text-xl font-semibold text-[#172B45]">Seller actions</h3><div className="mt-5 space-y-3">{role === 'seller' ? [['Review buyer agreement', '/agreements'], ['Upload dispatch evidence and tracking', '/delivery'], ['Respond to disputes', '/disputes'], ['View payment status', '/transactions']].map(([label, href]) => <Link key={label} to={href} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-sm font-medium text-[#172B45] hover:border-slate-300"><span>{label}</span><ArrowRight className="h-4 w-4 text-[#2563EB]" /></Link>) : <p className="text-sm leading-6 text-slate-600">Seller actions are available after selecting the seller demo role.</p>}</div></div>
      </div>
    </motion.div>
  )
}

function TransactionsPage({ transactions, disputes }: { transactions: Transaction[]; disputes: Dispute[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [paymentFilter, setPaymentFilter] = useState('All')
  const [deliveryFilter, setDeliveryFilter] = useState('All')
  const [sortBy, setSortBy] = useState('date-desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const pageSize = 4

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const items = transactions.filter((tx) => {
      const matchesSearch = [tx.id, tx.title, tx.buyerName, tx.sellerName, tx.product, tx.category].some((field) => field.toLowerCase().includes(q))
      const matchesStatus = statusFilter === 'All' || tx.status === statusFilter
      const matchesPayment = paymentFilter === 'All' || tx.paymentStatus === paymentFilter
      const matchesDelivery = deliveryFilter === 'All' || tx.deliveryStatus === deliveryFilter
      return matchesSearch && matchesStatus && matchesPayment && matchesDelivery
    })

    const sorted = [...items].sort((a, b) => {
      if (sortBy === 'amount-desc') return b.amount - a.amount
      if (sortBy === 'amount-asc') return a.amount - b.amount
      if (sortBy === 'name') return a.product.localeCompare(b.product)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return sorted
  }, [search, statusFilter, paymentFilter, deliveryFilter, sortBy, transactions])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPageSafe = Math.min(currentPage, totalPages)
  const visible = filtered.slice((currentPageSafe - 1) * pageSize, currentPageSafe * pageSize)
  const [selectedId, setSelectedId] = useState('')
  const selected = filtered.find((tx) => tx.id === selectedId) ?? filtered[0]

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Transaction management</p>
          <h1 className="mt-3 text-4xl font-black text-[#0B1F3A]">Transaction dashboard</h1>
        </div>
        <Link to="/create-transaction" className="rounded-full bg-[#0B1F3A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#163A63]">Create transaction</Link>
      </div>

      <div className="mb-6 grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-[#2563EB]"
          placeholder="Search ID, product, party, category"
          aria-label="Search transactions"
        />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#2563EB]" aria-label="Filter by transaction status">
          <option value="All">All status</option>
          {Object.keys(statusClasses).map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setCurrentPage(1) }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#2563EB]" aria-label="Filter by payment status">
          <option value="All">All payments</option>
          {['Pending', 'Confirmed', 'Refund Requested'].map((status) => <option key={status}>{status}</option>)}
        </select>
        <select value={deliveryFilter} onChange={(e) => { setDeliveryFilter(e.target.value); setCurrentPage(1) }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#2563EB]" aria-label="Filter by delivery status">
          <option value="All">All deliveries</option>
          {['Awaiting Dispatch', 'In Transit', 'Delivered', 'Inspection', 'Completed'].map((status) => <option key={status}>{status}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1) }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#2563EB]" aria-label="Sort transactions">
          <option value="date-desc">Newest first</option>
          <option value="amount-desc">Highest amount</option>
          <option value="amount-asc">Lowest amount</option>
          <option value="name">Product name</option>
        </select>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Showing {visible.length} / {filtered.length}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">ID</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Buyer / Seller</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Product</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Details</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((tx) => (
                  <tr key={tx.id} className={`transition ${selected?.id === tx.id ? 'bg-[#EAF1FA]' : 'hover:bg-slate-50'}`}>
                    <td className="px-4 py-3 text-sm font-medium text-[#172B45]">{tx.id}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{tx.buyerName}<br />{tx.sellerName}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{tx.product}<div className="mt-1 text-xs text-slate-400">{tx.category}</div></td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#172B45]">{formatCurrency(tx.amount, tx.currency)}</td>
                    <td className="px-4 py-3">{renderStatusPill(tx.status)}</td>
                    <td className="px-4 py-3"><button onClick={() => { setSelectedId(tx.id); setDetailsOpen(true) }} className="whitespace-nowrap rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-[#EAF1FA]">View details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
            <button onClick={() => setCurrentPage((p) => Math.max(1, Math.min(p, totalPages) - 1))} disabled={currentPageSafe === 1} className="rounded-full border border-slate-200 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50">
              Previous
            </button>
            <span>Page {currentPageSafe} of {totalPages}</span>
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, Math.min(p, totalPages) + 1))} disabled={currentPageSafe === totalPages} className="rounded-full border border-slate-200 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50">
              Next
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="text-xl font-semibold text-[#172B45]">Transaction summary</h3>{selected ? <div className="mt-4"><div className="font-semibold">{selected.title}</div><div className="mt-1 text-sm text-slate-500">{selected.id} · {selected.category}</div><div className="mt-4 flex items-center justify-between">{renderStatusPill(selected.status)}<span className="font-bold">{formatCurrency(selected.amount, selected.currency)}</span></div><TransactionProgress status={selected.status} /><button onClick={() => setDetailsOpen(true)} className="mt-5 w-full rounded-xl bg-[#0B1F3A] px-4 py-3 text-sm font-semibold text-white hover:bg-[#163A63]">Open full transaction details</button></div> : <EmptyState title="No matching transactions" message="Adjust the search or filters to see matching demo transactions." />}</div>
      </div>
      {detailsOpen && selected && <TransactionDetailsModal transaction={selected} disputes={disputes.filter((item) => item.transactionId === selected.id)} onClose={() => setDetailsOpen(false)} />}
    </motion.div>
  )
}

function TransactionDetailsModal({ transaction: tx, disputes, onClose }: { transaction: Transaction; disputes: Dispute[]; onClose: () => void }) {
  const sections = [
    { title: 'Buyer and seller', content: <div className="grid gap-4 sm:grid-cols-2"><DetailItem label="Buyer" value={tx.buyerName} /><DetailItem label="Seller" value={tx.sellerName} /></div> },
    { title: 'Product specifications and quantity', content: <div className="grid gap-4 sm:grid-cols-2"><DetailItem label="Product / service" value={tx.product} /><DetailItem label="Category" value={tx.category} /><DetailItem label="Agreed quantity" value={`${tx.quantity} units`} /><DetailItem label="Unit price" value={formatCurrency(tx.unitPrice, tx.currency)} /><DetailItem label="Supporting documents" value={tx.supportingDocuments ?? 'Not provided'} /><DetailItem label="Special conditions" value={tx.specialConditions ?? 'Not recorded'} /></div> },
    { title: 'Price and delivery terms', content: <div className="grid gap-4 sm:grid-cols-2"><DetailItem label="Total amount" value={formatCurrency(tx.amount, tx.currency)} /><DetailItem label="Delivery method" value={tx.deliveryMethod} /><DetailItem label="Delivery address" value={tx.deliveryAddress} /><DetailItem label="Expected dispatch" value={tx.expectedDispatchDate} /><DetailItem label="Expected delivery" value={tx.deliveryDeadline} /><DetailItem label="Inspection period" value={tx.inspectionPeriod} /></div> },
    { title: 'Agreement acceptance history', content: <TimelineList entries={tx.agreementHistory} /> },
    { title: 'Payment partner processing status', content: <p className="text-sm leading-6 text-slate-600">{tx.paymentPartnerStatus} <span className="mt-2 block font-medium text-[#0B1F3A]">Recorded payment status: {tx.paymentStatus}. Prototype status only; no payment collection, fund handling or settlement is performed.</span></p> },
    { title: 'Dispatch evidence and shipment tracking', content: <div className="grid gap-4 sm:grid-cols-2"><DetailItem label="Dispatch evidence" value={tx.dispatchEvidence} /><DetailItem label="Tracking reference" value={tx.trackingNumber} /><DetailItem label="Delivery status" value={tx.deliveryStatus} /><DetailItem label="Delivery confirmation" value={tx.deliveredAt} /></div> },
    { title: 'Buyer inspection results', content: <DetailItem label="Inspection result" value={tx.inspectionResult} /> },
    { title: 'Dispute history and resolution', content: disputes.length ? <div className="space-y-3">{disputes.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm text-[#172B45]">{item.id} · {item.title}</strong>{renderStatusPill(item.status)}</div><p className="mt-2 text-sm text-slate-600">{item.issue}</p><p className="mt-2 text-xs text-slate-500">Seller response: {item.sellerResponse}</p></div>)}</div> : <p className="text-sm text-slate-500">No dispute recorded for this transaction.</p> },
    { title: 'Complete activity timeline', content: <div className="space-y-3">{tx.activity.map((item, index) => <div key={`${item.date}-${index}`} className="flex gap-3"><div className="mt-1 h-2.5 w-2.5 flex-none rounded-full bg-[#2563EB]" /><div><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><strong className="text-sm text-[#172B45]">{item.title}</strong><span className="text-xs text-slate-400">{item.date}</span></div><p className="mt-1 text-sm text-slate-600">{item.detail}</p></div></div>)}</div> },
  ]
  return <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/60 p-3 sm:p-6" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="transaction-detail-title" className="mx-auto my-2 max-w-4xl rounded-3xl bg-[#F3F6FA] shadow-2xl sm:my-8"><header className="sticky top-0 z-10 rounded-t-3xl border-b border-slate-200 bg-white/95 p-5 backdrop-blur sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Transaction overview · {tx.id}</p><h2 id="transaction-detail-title" className="mt-2 text-2xl font-bold text-[#0B1F3A] sm:text-3xl">{tx.title}</h2><div className="mt-3 flex flex-wrap items-center gap-3">{renderStatusPill(tx.status)}<span className="text-sm font-bold text-[#172B45]">{formatCurrency(tx.amount, tx.currency)}</span></div></div><button onClick={onClose} aria-label="Close transaction details" className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"><X className="h-5 w-5" /></button></div><TransactionProgress status={tx.status} /></header><div className="space-y-4 p-4 sm:p-7">{sections.map((section) => <article key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="mb-4 font-semibold text-[#0B1F3A]">{section.title}</h3>{section.content}</article>)}</div><div className="p-4 pt-0 text-center text-xs text-slate-500 sm:px-7">Demo records are illustrative only. No partner approval or real payment activity is implied.</div></section></div>
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return <div><div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div><div className="mt-1 break-words text-sm text-[#172B45]">{value || 'Not recorded'}</div></div>
}

function TimelineList({ entries }: { entries: string[] }) {
  return <ul className="space-y-2">{entries.map((entry) => <li key={entry} className="flex items-start gap-2 text-sm text-slate-600"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[#2563EB]" />{entry}</li>)}</ul>
}

function CreateTransactionPage({ onCreate }: { onCreate: (transaction: Transaction) => void }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    title: '',
    buyerName: '',
    sellerName: '',
    category: '',
    description: '',
    quantity: '',
    unitPrice: '',
    currency: 'INR',
    deliveryMethod: '',
    address: '',
    expectedDispatchDate: '',
    expectedDeliveryDate: '',
    inspectionPeriod: '',
    specialConditions: '',
    supportingDocuments: '',
    reviewedAgreement: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const totalAmount = Number(form.quantity || 0) * Number(form.unitPrice || 0)
  const totalSteps = 6

  const validateCurrentStep = () => {
    const nextErrors: Record<string, string> = {}
    if (step === 1 && (!form.title || !form.buyerName || !form.sellerName)) {
      if (!form.title) nextErrors.title = 'Transaction title is required.'
      if (!form.buyerName) nextErrors.buyerName = 'Buyer details are required.'
      if (!form.sellerName) nextErrors.sellerName = 'Seller details are required.'
    }
    if (step === 2 && (!form.category || !form.description)) {
      if (!form.category) nextErrors.category = 'Category is required.'
      if (!form.description) nextErrors.description = 'Product or service description is required.'
    }
    if (step === 3 && (!form.quantity || !form.unitPrice || Number(form.quantity) <= 0 || Number(form.unitPrice) <= 0)) {
      if (!form.quantity || Number(form.quantity) <= 0) nextErrors.quantity = 'Enter a quantity greater than zero.'
      if (!form.unitPrice || Number(form.unitPrice) <= 0) nextErrors.unitPrice = 'Enter a unit price greater than zero.'
    }
    if (step === 4 && (!form.deliveryMethod || !form.address || !form.expectedDispatchDate || !form.expectedDeliveryDate)) {
      if (!form.deliveryMethod) nextErrors.deliveryMethod = 'Delivery method is required.'
      if (!form.address) nextErrors.address = 'Delivery address is required.'
      if (!form.expectedDispatchDate) nextErrors.expectedDispatchDate = 'Expected dispatch date is required.'
      if (!form.expectedDeliveryDate) nextErrors.expectedDeliveryDate = 'Expected delivery date is required.'
      if (form.expectedDispatchDate && form.expectedDeliveryDate && form.expectedDispatchDate > form.expectedDeliveryDate) nextErrors.expectedDeliveryDate = 'Delivery date must be on or after dispatch.'
    }
    if (step === 5 && (!form.inspectionPeriod)) {
      nextErrors.inspectionPeriod = 'Inspection period is required.'
    }
    if (step === 6 && !form.reviewedAgreement) nextErrors.reviewedAgreement = 'Confirm that you reviewed this demo summary.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const next = () => {
    if (!validateCurrentStep()) return
    setStep((prev) => Math.min(totalSteps, prev + 1))
  }

  const prev = () => setStep((prev) => Math.max(1, prev - 1))

  const submit = () => {
    if (!validateCurrentStep()) return
    const txn: Transaction = {
      id: `PP-${Math.floor(Math.random() * 9000 + 1000)}`,
      title: form.title,
      buyerName: form.buyerName,
      sellerName: form.sellerName,
      product: form.description,
      amount: totalAmount,
      currency: form.currency,
      createdAt: new Date().toISOString().slice(0, 10),
      deliveryDeadline: form.expectedDeliveryDate,
      paymentStatus: 'Pending',
      deliveryStatus: 'Awaiting Dispatch',
      currentStage: 'Draft',
      status: 'Draft',
      category: form.category,
      quantity: Number(form.quantity),
      unitPrice: Number(form.unitPrice),
      deliveryMethod: form.deliveryMethod,
      deliveryAddress: form.address,
      expectedDispatchDate: form.expectedDispatchDate,
      inspectionPeriod: form.inspectionPeriod,
      agreementHistory: ['Agreement summary reviewed in demo; acceptance is not a legal electronic signature.'],
      paymentPartnerStatus: 'Not started; proposed partner integration is not active.',
      dispatchEvidence: 'No dispatch evidence recorded',
      trackingNumber: 'Not assigned',
      deliveredAt: 'Not delivered',
      inspectionResult: 'Not started',
      activity: [{ date: new Date().toLocaleString(), title: 'Transaction created', detail: 'Created locally in the PactPal demo.' }],
      supportingDocuments: form.supportingDocuments || 'Not provided',
      specialConditions: form.specialConditions || 'No special conditions provided.',
    }

    onCreate(txn)
    navigate('/transactions')
  }

  const stepTitle = [
    'Buyer and seller information',
    'Product or service details',
    'Quantity and pricing',
    'Delivery information',
    'Inspection and acceptance conditions',
    'Review and agreement',
  ][step - 1]

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Create transaction</p>
        <h1 className="mt-3 text-4xl font-black text-[#0B1F3A]">Multi-step transaction creation</h1>
      </div>

      <div className="mb-8 flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <div key={idx} className={`h-2 flex-1 rounded-full ${idx + 1 <= step ? 'bg-[#2563EB]' : 'bg-slate-200'}`} />
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Step {step} of {totalSteps}</div>
          <h2 className="mt-2 text-2xl font-bold text-[#0B1F3A]">{stepTitle}</h2>
        </div>

        {step === 1 && (
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Transaction title" error={errors.title}><input value={form.title} onChange={(e) => handleChange('title', e.target.value)} className="input" placeholder="Precision Motor Assembly Kit" /></Field>
            <Field label="Buyer details" error={errors.buyerName}><input value={form.buyerName} onChange={(e) => handleChange('buyerName', e.target.value)} className="input" placeholder="Bharat Fabricators Ltd." /></Field>
            <Field label="Seller details" error={errors.sellerName}><input value={form.sellerName} onChange={(e) => handleChange('sellerName', e.target.value)} className="input" placeholder="Metro Components Works" /></Field>
            <Field label="Currency"><select value={form.currency} onChange={(e) => handleChange('currency', e.target.value)} className="input"><option>INR</option><option>USD</option></select></Field>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Product/service category" error={errors.category}><select value={form.category} onChange={(e) => handleChange('category', e.target.value)} className="input"><option value="">Select</option>{industries.map((industry) => <option key={industry} value={industry}>{industry}</option>)}</select></Field>
            <Field label="Supporting documents" className="md:col-span-2"><input value={form.supportingDocuments} onChange={(e) => handleChange('supportingDocuments', e.target.value)} className="input" placeholder="Spec sheet, quality certificate, etc." /></Field>
            <Field label="Product or service description" className="md:col-span-2" error={errors.description}><textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} className="input min-h-[120px]" placeholder="Describe the product or service" /></Field>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-5 md:grid-cols-3">
            <Field label="Quantity" error={errors.quantity}><input type="number" min="1" value={form.quantity} onChange={(e) => handleChange('quantity', e.target.value)} className="input" /></Field>
            <Field label="Unit price" error={errors.unitPrice}><input type="number" min="1" value={form.unitPrice} onChange={(e) => handleChange('unitPrice', e.target.value)} className="input" /></Field>
            <Field label="Total amount"><div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-lg font-semibold text-[#172B45]">{formatCurrency(totalAmount, form.currency)}</div></Field>
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Delivery method" error={errors.deliveryMethod}><select value={form.deliveryMethod} onChange={(e) => handleChange('deliveryMethod', e.target.value)} className="input"><option value="">Select</option><option>Courier delivery</option><option>In-person handover</option><option>Local pickup</option><option>Digital delivery</option><option>Service completion</option></select></Field>
            <Field label="Delivery address" error={errors.address}><input value={form.address} onChange={(e) => handleChange('address', e.target.value)} className="input" placeholder="Plot No. 18, Industrial Area, Bengaluru" /></Field>
            <Field label="Expected dispatch date" error={errors.expectedDispatchDate}><input type="date" value={form.expectedDispatchDate} onChange={(e) => handleChange('expectedDispatchDate', e.target.value)} className="input" /></Field>
            <Field label="Expected delivery date" error={errors.expectedDeliveryDate}><input type="date" value={form.expectedDeliveryDate} onChange={(e) => handleChange('expectedDeliveryDate', e.target.value)} className="input" /></Field>
          </div>
        )}

        {step === 5 && (
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Inspection period" error={errors.inspectionPeriod}><input value={form.inspectionPeriod} onChange={(e) => handleChange('inspectionPeriod', e.target.value)} className="input" placeholder="72 hours" /></Field>
            <Field label="Special conditions"><input value={form.specialConditions} onChange={(e) => handleChange('specialConditions', e.target.value)} className="input" placeholder="Destination quality checks, packaging notes" /></Field>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div><div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Buyer</div><div className="mt-2 font-semibold text-[#172B45]">{form.buyerName || 'Not provided'}</div></div>
                <div><div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Seller</div><div className="mt-2 font-semibold text-[#172B45]">{form.sellerName || 'Not provided'}</div></div>
                <div><div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Product / service</div><div className="mt-2 font-semibold text-[#172B45]">{form.description || 'Not provided'}</div></div>
                <div><div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Amount</div><div className="mt-2 font-semibold text-[#172B45]">{formatCurrency(totalAmount, form.currency)}</div></div>
              </div>
            </div>
            <Field label="Final agreement summary"><textarea value={`${form.specialConditions || 'No special conditions provided.'}\n\nInspection window: ${form.inspectionPeriod || 'Not specified'}\nDelivery method: ${form.deliveryMethod || 'Not specified'}`} readOnly className="input min-h-[150px]" /></Field>
            <label className="flex items-start gap-3 text-sm text-slate-600"><input type="checkbox" checked={form.reviewedAgreement} onChange={(e) => { setForm((prev) => ({ ...prev, reviewedAgreement: e.target.checked })); setErrors((prev) => ({ ...prev, reviewedAgreement: '' })) }} className="mt-1 h-4 w-4 accent-[#2563EB]" /><span>I reviewed this transaction summary for demo purposes. This checkbox is not an electronic signature or legal acceptance.</span></label>
            {errors.reviewedAgreement && <p className="text-xs text-red-600">{errors.reviewedAgreement}</p>}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button onClick={prev} disabled={step === 1} className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
            Back
          </button>
          {step < totalSteps ? (
            <button onClick={next} className="rounded-full bg-[#0B1F3A] px-5 py-2 text-sm font-semibold text-white hover:bg-[#163A63]">
              Continue
            </button>
          ) : (
            <button onClick={submit} className="rounded-full bg-[#16A34A] px-5 py-2 text-sm font-semibold text-white hover:bg-[#15803d]">
              Submit agreement
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function AgreementsPage({ agreements, role, onAccept }: { agreements: Agreement[]; role: UserRole; onAccept: (id: string, role: 'buyer' | 'seller') => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Agreement management</p>
          <h1 className="mt-3 text-4xl font-black text-[#0B1F3A]">Transaction agreement records</h1>
        </div>
        <button onClick={() => downloadAgreementPdf()} className="rounded-full bg-[#0B1F3A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#163A63]">
          Download sample agreement PDF
        </button>
      </div>

      <div className="grid gap-6">
        {agreements.map((agreement) => (
          <div key={agreement.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">{agreement.id}</div>
                <h3 className="mt-2 text-2xl font-bold text-[#172B45]">{agreement.title}</h3>
                <div className="mt-2 text-sm text-slate-500">Version {agreement.version} • Updated {agreement.updatedAt}</div>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700">Buyer acceptance: {agreement.buyerAccepted ? 'Yes' : 'Pending'}</div>
                <div className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700">Seller acceptance: {agreement.sellerAccepted ? 'Yes' : 'Pending'}</div>
                {role === 'buyer' && !agreement.buyerAccepted && <button onClick={() => onAccept(agreement.id, 'buyer')} className="rounded-full bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white">Record buyer acceptance (demo)</button>}
                {role === 'seller' && !agreement.sellerAccepted && <button onClick={() => onAccept(agreement.id, 'seller')} className="rounded-full bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white">Record seller acceptance (demo)</button>}
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Agreement summary: This transaction includes agreed quantity, pricing, delivery window and quality acceptance conditions. A checkbox or digital mark does not automatically constitute a legally valid electronic signature in a production setting.
            </div>
            <div className="mt-4"><h4 className="text-sm font-semibold text-[#172B45]">Acceptance history</h4><div className="mt-2"><TimelineList entries={agreement.history} /></div></div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function DeliveryPage({ transactions, role, onUpdate, onNotify }: { transactions: Transaction[]; role: UserRole; onUpdate: (id: string, update: Partial<Transaction>) => void; onNotify: (message: string) => void }) {
  const [selectedId, setSelectedId] = useState(transactions[0]?.id ?? '')
  const [trackingInput, setTrackingInput] = useState('')
  const [confirmation, setConfirmation] = useState<'delivery' | 'inspection' | null>(null)
  const selected = transactions.find((tx) => tx.id === selectedId)
  const confirmDelivery = () => {
    if (!selected) return
    const timestamp = getCurrentTimestamp()
    onUpdate(selected.id, { status: 'Delivered', deliveryStatus: 'Delivered', deliveredAt: `${timestamp} (demo)`, inspectionResult: 'Buyer inspection pending', activity: [...selected.activity, { date: timestamp, title: 'Delivery confirmed', detail: 'Confirmation recorded in the local demo only.' }] })
    setConfirmation(null)
    onNotify('Delivery confirmation recorded in the demo.')
  }
  const confirmInspection = () => {
    if (!selected) return
    onUpdate(selected.id, { status: 'Completed', deliveryStatus: 'Completed', inspectionResult: 'Buyer accepted the delivery in the demo.', activity: [...selected.activity, makeActivityEntry('Buyer inspection completed', 'Inspection confirmation recorded locally; it does not initiate a settlement.')] })
    setConfirmation(null)
    onNotify('Inspection result recorded in the demo.')
  }
  const updateTracking = () => {
    if (!selected || !trackingInput.trim()) return
    onUpdate(selected.id, { trackingNumber: trackingInput.trim(), dispatchEvidence: selected.dispatchEvidence === 'No dispatch evidence recorded' ? 'Dispatch reference recorded in demo' : selected.dispatchEvidence, activity: [...selected.activity, makeActivityEntry('Tracking reference updated', 'Tracking information saved in local demo state.')] })
    setTrackingInput('')
    onNotify('Tracking reference saved in demo mode.')
  }
  const uploadEvidence = (file?: File) => {
    if (!selected || !file) return
    onUpdate(selected.id, { dispatchEvidence: `${file.name} (local demo reference)`, activity: [...selected.activity, makeActivityEntry('Dispatch evidence added', `${file.name} referenced locally; file was not uploaded.`)] })
    onNotify('Evidence reference recorded locally; no file was uploaded.')
  }
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Delivery management</p>
        <h1 className="mt-3 text-4xl font-black text-[#0B1F3A]">Shipment and evidence tracking</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-[#172B45]">Tracking timeline</h2>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="input max-w-sm" aria-label="Select transaction for delivery tracking">{transactions.map((tx) => <option key={tx.id} value={tx.id}>{tx.id} · {tx.title}</option>)}</select>
          </div>
          {selected ? <div className="space-y-5">
            {[...selected.activity].reverse().map((event) => (
              <div key={event.title} className="flex gap-4">
                <div className="relative mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#2563EB]">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
                <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-semibold text-[#172B45]">{event.title}</div>
                    <div className="text-xs text-slate-500">{event.date}</div>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{event.detail}</p>
                </div>
              </div>
            ))}
          </div> : <EmptyState title="No shipment data" message="Create a demo transaction to start tracking." />}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-[#EAF1FA] p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-[#172B45]">Shipment summary</h3>
          <div className="mt-5 space-y-3 text-sm text-slate-600"><div className="flex justify-between gap-3"><span>Method</span><strong className="text-[#172B45]">{selected?.deliveryMethod ?? 'Not recorded'}</strong></div><div className="flex justify-between gap-3"><span>Tracking reference</span><strong className="text-[#172B45]">{selected?.trackingNumber ?? 'Not assigned'}</strong></div><div className="flex justify-between gap-3"><span>Delivery timestamp</span><strong className="text-[#172B45]">{selected?.deliveredAt ?? 'Not delivered'}</strong></div><div className="flex justify-between gap-3"><span>Inspection</span><strong className="text-[#172B45]">{selected?.inspectionResult ?? 'Not started'}</strong></div><div className="pt-2"><div className="text-xs font-medium uppercase text-slate-500">Dispatch evidence</div><p className="mt-1 break-words">{selected?.dispatchEvidence ?? 'No evidence'}</p></div></div>
          {role === 'seller' && selected && <div className="mt-5 space-y-3 border-t border-slate-200 pt-5"><label className="block text-xs font-semibold text-slate-600">Add tracking reference<input value={trackingInput} onChange={(e) => setTrackingInput(e.target.value)} className="input mt-2" placeholder="Enter a demo tracking reference" /></label><button onClick={updateTracking} disabled={!trackingInput.trim()} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-[#0B1F3A] disabled:opacity-50">Save tracking</button><label className="block text-xs font-semibold text-slate-600">Reference dispatch evidence<input type="file" onChange={(e) => uploadEvidence(e.target.files?.[0])} className="mt-2 block w-full text-sm" /></label></div>}
          {role === 'buyer' && selected && selected.status === 'In Transit' && <button onClick={() => setConfirmation('delivery')} className="mt-6 w-full rounded-2xl bg-[#0B1F3A] px-4 py-3 text-sm font-semibold text-white hover:bg-[#163A63]">Confirm delivery (demo)</button>}
          {role === 'buyer' && selected && ['Delivered', 'Under Inspection'].includes(selected.status) && <button onClick={() => setConfirmation('inspection')} className="mt-3 w-full rounded-2xl bg-[#0B1F3A] px-4 py-3 text-sm font-semibold text-white hover:bg-[#163A63]">Confirm inspection (demo)</button>}
          <p className="mt-4 text-xs leading-5 text-slate-500">Sample shipment references only. No courier, delivery provider or payment partner is contacted.</p>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 text-xl font-semibold text-[#172B45]">Active transactions</div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {transactions.length ? transactions.map((tx) => (
            <button key={tx.id} onClick={() => setSelectedId(tx.id)} className={`rounded-2xl border p-4 text-left transition hover:border-[#2563EB] ${selectedId === tx.id ? 'border-[#2563EB] bg-[#EAF1FA]' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div className="font-semibold text-[#172B45]">{tx.id}</div>
                {renderStatusPill(tx.status)}
              </div>
              <div className="mt-3 text-sm text-slate-600">{tx.product}</div>
            </button>
          )) : <EmptyState title="No transactions" message="Create a transaction to see it in delivery management." />}
        </div>
      </div>
      {confirmation && <ConfirmDialog title={confirmation === 'delivery' ? 'Confirm delivery?' : 'Confirm inspection?'} message={confirmation === 'delivery' ? 'This records a delivery milestone in local demo data only.' : 'This records an inspection result in local demo data; it does not trigger a payment or settlement.'} confirmLabel={confirmation === 'delivery' ? 'Confirm delivery' : 'Confirm inspection'} onCancel={() => setConfirmation(null)} onConfirm={confirmation === 'delivery' ? confirmDelivery : confirmInspection} />}
      {role !== 'buyer' && role !== 'seller' && <RoleNotice expected="seller" />}
    </motion.div>
  )
}

function DisputesPage({ disputes, setDisputes, transactions, role, onNotify, onCreate }: { disputes: Dispute[]; setDisputes: React.Dispatch<React.SetStateAction<Dispute[]>>; transactions: Transaction[]; role: UserRole; onNotify: (message: string) => void; onCreate: (dispute: Dispute) => void }) {
  const [form, setForm] = useState({ title: '', category: disputeCategories[0], issue: '', priority: 'Medium' })
  const [transactionId, setTransactionId] = useState(standardInitialTransactions[0]?.id ?? '')
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [disputeToResolve, setDisputeToResolve] = useState<Dispute | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.issue.trim()) return
    onCreate({
      id: `DSP-${Math.floor(Math.random() * 9000 + 1000)}`,
      title: form.title.trim(),
      category: form.category,
      issue: form.issue.trim(),
      status: 'Open',
      createdAt: new Date().toISOString().slice(0, 10),
      priority: form.priority as Dispute['priority'],
      transactionId,
      sellerResponse: 'Response not yet recorded.',
    })
    setForm({ title: '', category: disputeCategories[0], issue: '', priority: 'Medium' })
    onNotify('Dispute created and saved in demo mode.')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Dispute management</p>
        <h1 className="mt-3 text-4xl font-black text-[#0B1F3A]">Issue resolution workflow</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Disputes and responses are sample records for workflow demonstration only; they do not represent adjudication or payment decisions.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
        {role === 'buyer' ? <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-xl font-semibold text-[#172B45]">Create dispute</h3>
          <div className="space-y-4">
            <Field label="Transaction"><select value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className="input">{transactions.map((tx) => <option key={tx.id} value={tx.id}>{tx.id} · {tx.title}</option>)}</select></Field>
            <Field label="Dispute title"><input required value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="input" /></Field>
            <Field label="Dispute category"><select value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} className="input">{disputeCategories.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Priority"><select value={form.priority} onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))} className="input"><option>High</option><option>Medium</option><option>Low</option></select></Field>
            <Field label="Issue details"><textarea required value={form.issue} onChange={(e) => setForm((prev) => ({ ...prev, issue: e.target.value }))} className="input min-h-[120px]" placeholder="Describe the issue, contract expectation and supporting evidence." /></Field>
            <button type="submit" className="w-full rounded-2xl bg-[#0B1F3A] px-4 py-3 text-sm font-semibold text-white hover:bg-[#163A63]">Create dispute</button>
          </div>
        </form> : <div className="rounded-3xl border border-slate-200 bg-[#EAF1FA] p-6 shadow-sm"><h3 className="font-semibold text-[#172B45]">{role === 'seller' ? 'Seller response workspace' : 'Admin review workspace'}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{role === 'seller' ? 'Respond to buyer-raised issues with a demo note. Responses are saved locally.' : 'Review and resolve sample disputes with explicit demo status updates.'}</p></div>}

        <div className="space-y-4">
          {disputes.length ? disputes.map((item) => (
            <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">{item.id}</div>
                  <h3 className="mt-2 text-xl font-bold text-[#172B45]">{item.title}</h3>
                </div>
                {renderStatusPill(item.status)}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{item.category}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{item.priority}</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{item.issue}</p>
              <div className="mt-3 text-xs text-slate-500">Transaction: {item.transactionId} · Created {item.createdAt}</div>
              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Seller response: {item.sellerResponse}</div>
              {role === 'seller' && !['Resolved', 'Closed'].includes(item.status) && <div className="mt-4 space-y-3"><textarea value={responses[item.id] ?? ''} onChange={(e) => setResponses((prev) => ({ ...prev, [item.id]: e.target.value }))} className="input min-h-20" placeholder="Enter a response for the buyer" aria-label={`Seller response for ${item.id}`} /><button disabled={!responses[item.id]?.trim()} onClick={() => { const response = responses[item.id].trim(); setDisputes((prev) => prev.map((dispute) => dispute.id === item.id ? { ...dispute, sellerResponse: response, status: 'Under Review' } : dispute)); setResponses((prev) => ({ ...prev, [item.id]: '' })); onNotify('Seller response saved in demo mode.') }} className="rounded-xl bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Submit seller response</button></div>}
              {role === 'admin' && !['Resolved', 'Closed'].includes(item.status) && <div className="mt-4 flex flex-wrap gap-3"><button onClick={() => { setDisputes((prev) => prev.map((dispute) => dispute.id === item.id ? { ...dispute, status: 'Under Review' } : dispute)); onNotify('Dispute moved to review in demo mode.') }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-[#172B45]">Mark under review</button><button onClick={() => setDisputeToResolve(item)} className="rounded-xl bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white">Mark resolved</button></div>}
            </div>
          )) : <EmptyState title="No disputes" message="Disputes created in this demo will be listed here." />}
        </div>
      </div>
      {disputeToResolve && <ConfirmDialog title="Resolve this demo dispute?" message={`Mark ${disputeToResolve.id} as resolved in local demo data? This does not represent an external or legal resolution.`} confirmLabel="Resolve dispute" onCancel={() => setDisputeToResolve(null)} onConfirm={() => { setDisputes((prev) => prev.map((dispute) => dispute.id === disputeToResolve.id ? { ...dispute, status: 'Resolved' } : dispute)); setDisputeToResolve(null); onNotify('Dispute marked resolved in demo mode.') }} />}
    </motion.div>
  )
}

function AdminPage({ transactions, disputes }: { transactions: Transaction[]; disputes: Dispute[] }) {
  const [statusFilter, setStatusFilter] = useState('All')
  const pendingCount = transactions.filter((tx) => !['Completed', 'Disputed', 'Cancelled'].includes(tx.status)).length
  const completedCount = transactions.filter((tx) => tx.status === 'Completed').length
  const openDisputeCount = disputes.filter((item) => !['Resolved', 'Closed'].includes(item.status)).length
  const sampleValue = transactions.reduce((sum, tx) => sum + tx.amount, 0)
  const monthlyValue = Object.entries(transactions.reduce<Record<string, number>>((totals, tx) => {
    const month = tx.createdAt.slice(0, 7)
    totals[month] = (totals[month] ?? 0) + tx.amount
    return totals
  }, {})).sort(([a], [b]) => a.localeCompare(b)).map(([month, amount]) => ({ name: month, amount }))
  const filteredTransactions = statusFilter === 'All' ? transactions : transactions.filter((tx) => tx.status === statusFilter)
  const data = [
    { title: 'Total transactions', value: transactions.length.toString(), icon: GanttChartSquare },
    { title: 'Pending transactions', value: pendingCount.toString(), icon: ClipboardCheck },
    { title: 'Completed transactions', value: completedCount.toString(), icon: BadgeCheck },
    { title: 'Open disputes', value: openDisputeCount.toString(), icon: MessageSquareWarning },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Admin dashboard</p>
        <h1 className="mt-3 text-4xl font-black text-[#0B1F3A]">Operational oversight</h1>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        {data.map((item) => (
          <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EAF1FA] text-[#2563EB]">
              <item.icon className="h-5 w-5" />
            </div>
            <div className="text-3xl font-black text-[#0B1F3A]">{item.value}</div>
            <div className="mt-1 text-sm text-slate-600">{item.title}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 text-xl font-semibold text-[#172B45]">Transaction value trend</div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyValue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dfeaf5" />
                <XAxis dataKey="name" stroke="#64748B" />
                <YAxis stroke="#64748B" />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="amount" fill="#2563EB" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-[#EAF1FA] p-6 shadow-sm">
          <div className="mb-5 text-xl font-semibold text-[#172B45]">Quick review</div>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3"><span>Sample buyer accounts</span><strong>{new Set(transactions.map((tx) => tx.buyerName)).size}</strong></div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3"><span>Sample seller accounts</span><strong>{new Set(transactions.map((tx) => tx.sellerName)).size}</strong></div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3"><span>Business verification</span><strong>Not performed in demo</strong></div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3"><span>Sample transaction value</span><strong>{formatCurrency(sampleValue)}</strong></div>
          </div>
        </div>
      </div>
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold text-[#172B45]">Transaction review</h2><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input max-w-xs" aria-label="Filter admin transactions by status"><option value="All">All statuses</option>{Object.keys(statusClasses).map((status) => <option key={status}>{status}</option>)}</select></div>
        {filteredTransactions.length ? <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase text-slate-500"><th className="px-3 py-3">Transaction</th><th className="px-3 py-3">Parties</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">Status</th></tr></thead><tbody>{filteredTransactions.map((tx) => <tr key={tx.id} className="border-b border-slate-100"><td className="px-3 py-3">{tx.id} · {tx.title}</td><td className="px-3 py-3">{tx.buyerName}<br />{tx.sellerName}</td><td className="px-3 py-3 font-semibold">{formatCurrency(tx.amount, tx.currency)}</td><td className="px-3 py-3">{renderStatusPill(tx.status)}</td></tr>)}</tbody></table></div> : <EmptyState title="No transactions in this status" message="Change the filter to review other demo records." />}
      </div>
    </motion.div>
  )
}

function PaymentArchitecturePage() {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Payment architecture</p>
        <h1 className="mt-3 text-4xl font-black text-[#0B1F3A]">Proposed payment architecture</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600">Proposed only; subject to regulatory review and payment partner approval. No integration is active and no funds are handled by PactPal in this prototype.</p>
      </div>
      <PaymentFlowDiagram />

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-[#172B45]">Platform role</h3>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            PactPal intends to act as a transaction-management and technology platform. The financial partner would handle funds under its authorised and approved arrangements. This prototype does not imply any regulatory approval or current operational payment capability.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-[#172B45]">Proposed requirements</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>• Payment collection</li>
            <li>• Seller linked accounts</li>
            <li>• Seller onboarding</li>
            <li>• Permitted delayed settlement</li>
            <li>• Conditional settlement, if supported</li>
            <li>• Refunds and reversals</li>
            <li>• Payment webhooks and reconciliation</li>
            <li>• Transaction status updates</li>
          </ul>
        </div>
      </div>
      <IntegrationQuestions />
    </motion.div>
  )
}

function PaymentFlowDiagram() {
  const stages = [
    { title: 'Buyer', detail: 'Creates a transaction and reviews terms' },
    { title: 'PactPal transaction coordination', detail: 'Records agreement, milestones and evidence' },
    { title: 'Authorised payment partner', detail: 'Handles funds only under approved arrangements' },
    { title: 'Seller fulfilment', detail: 'Dispatches goods or completes services' },
    { title: 'Buyer inspection', detail: 'Confirms delivery against agreed terms' },
    { title: 'Partner-managed settlement / refund', detail: 'According to approved partner arrangements' },
  ]
  return <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold text-[#172B45]">Proposed transaction and payment flow</h2><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Proposed · pending approval</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{stages.map((stage, index) => <div key={stage.title} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start gap-3"><span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#0B1F3A] text-xs font-bold text-white">{index + 1}</span><div><h3 className="font-semibold text-[#172B45]">{stage.title}</h3><p className="mt-2 text-sm leading-5 text-slate-600">{stage.detail}</p></div></div></div>)}</div><p className="mt-5 rounded-xl border border-sky-100 bg-[#EAF1FA] p-4 text-sm leading-6 text-slate-700">PactPal is a proposed technology and transaction-coordination layer. It does not independently hold customer funds; any collection, settlement or refund would be performed by an authorised partner under arrangements approved for the use case.</p></div>
}

function IntegrationQuestions() {
  return <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="text-xl font-semibold text-[#172B45]">Payment partner requirements and integration questions</h3><ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-600 md:grid-cols-2"><li>• Which seller onboarding and linked-account models are available for the intended marketplace flow?</li><li>• Are delayed or conditional settlements permitted for this business model and transaction category?</li><li>• Which authorization, capture, refund and reversal flows are supported?</li><li>• What webhook signing, retry and reconciliation requirements apply?</li><li>• Which legal, compliance and operational prerequisites must be satisfied before launch?</li><li>• How should order disputes map to permitted payment-state transitions?</li></ul></div>
}

function PartnershipPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Partnership</p>
        <h1 className="mt-3 text-4xl font-black text-[#0B1F3A]">Let’s build a more trusted B2B transaction ecosystem.</h1>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
          <div>
            <p className="text-base leading-7 text-slate-600">
              PactPal is addressing a persistent gap in B2B trade: buyers and sellers working across fragmented processes, inconsistent documentation and uncertain fulfilment. We propose a trusted transaction-management platform for agreements, delivery evidence and settlement readiness.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ['Problem statement', 'Business-to-business transactions often struggle with incomplete evidence, delayed settlements and unclear obligations.'],
                ['Proposed solution', 'A centralised transaction workflow that records agreement terms, tracks compliance and supports professional dispute management.'],
                ['Target market', 'Manufacturing, infrastructure, wholesale, industrial supply, healthcare procurement and similar B2B sectors.'],
                ['Partnership expectations', 'Preliminary feasibility evaluation, integration discussions and architectural review with partner teams.'],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-semibold text-[#172B45]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl bg-[#EAF1FA] p-6">
            <h3 className="text-xl font-semibold text-[#172B45]">Startup status</h3>
            <ul className="mt-5 space-y-3 text-sm text-slate-700">
              <li><strong>Business Stage:</strong> Pre-incorporation startup concept.</li>
              <li><strong>Company Incorporation:</strong> Not yet completed.</li>
              <li><strong>GST Registration:</strong> Not yet completed.</li>
              <li><strong>Payment Integration:</strong> Not yet activated.</li>
              <li><strong>Partnership Status:</strong> Seeking preliminary feasibility evaluation.</li>
            </ul>
            <button onClick={downloadBusinessProposal} className="mt-6 inline-flex rounded-full bg-[#0B1F3A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#163A63]">
              Download Business Proposal
            </button>
          </div>
        </div>
        <div className="mt-8"><PaymentFlowDiagram /><IntegrationQuestions /></div>
      </div>
    </motion.div>
  )
}

function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', enquiryType: 'Partnership', message: '' })

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Contact</p>
        <h1 className="mt-3 text-4xl font-black text-[#0B1F3A]">Get in touch</h1>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        {!submitted ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setSubmitted(true)
            }}
            className="grid gap-5 md:grid-cols-2"
          >
            <Field label="Name"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" /></Field>
            <Field label="Business email"><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" /></Field>
            <Field label="Company name"><input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="input" /></Field>
            <Field label="Phone number"><input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" /></Field>
            <Field label="Enquiry type" className="md:col-span-2"><select value={form.enquiryType} onChange={(e) => setForm({ ...form, enquiryType: e.target.value })} className="input"><option>Partnership</option><option>Product discussion</option><option>Business inquiry</option><option>Support</option></select></Field>
            <Field label="Message" className="md:col-span-2"><textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input min-h-[150px]" /></Field>
            <button type="submit" className="md:col-span-2 rounded-2xl bg-[#0B1F3A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#163A63]">
              Submit enquiry
            </button>
          </form>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <h3 className="mt-4 text-2xl font-bold text-[#172B45]">Demo enquiry received</h3>
            <p className="mt-3 text-slate-600">This prototype simulates a contact submission and does not send an actual email notification.</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function Field({ label, children, error, className = '' }: { label: string; children: React.ReactNode; error?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-[#172B45]">{label}</span>
      {children}
      {error && <span className="mt-2 block text-xs text-red-600">{error}</span>}
    </label>
  )
}

function downloadAgreementPdf() {
  downloadFormattedPdf('Sample Agreement Summary', [
    'This sample agreement demonstrates the transaction workflow and commercial terms for a demo B2B transaction.',
    ' ',
    '1. Buyer and seller agree on product details, pricing and quantity terms.',
    '2. Payment coordination would use an authorised partner under approved arrangements; no payments are active in this prototype.',
    '3. Delivery evidence, inspection and dispute review are recorded in the PactPal workflow.',
    '4. A checkbox or digital mark does not automatically constitute a legally valid electronic signature in a production setting.',
    ' ',
    'Prepared for demonstration purposes only.',
  ], 'pactpal-sample-agreement.pdf')
}

function downloadBusinessProposal() {
  downloadFormattedPdf('Business Proposal', [
    'BUSINESS MODEL',
    'PactPal is a proposed B2B transaction-management platform focused on shared agreement visibility, milestone tracking, delivery evidence and structured dispute workflows.',
    'PactPal does not independently hold customer funds. No payments, settlement or refunds are active in this prototype.',
    ' ',
    'PROPOSED TRANSACTION WORKFLOW',
    'Buyer → PactPal transaction coordination → Authorised payment partner → Seller fulfilment → Buyer inspection → Partner-managed settlement or refund under approved arrangements.',
    ' ',
    'PROPOSED PAYMENT PARTNER REQUIREMENTS',
    'Payment collection under permitted partner arrangements; seller onboarding and linked accounts; delayed or conditional settlement if allowed; refunds and reversals; signed webhooks; reconciliation; and transaction status updates.',
    ' ',
    'TECHNICAL AND FEASIBILITY QUESTIONS',
    'Confirm onboarding models, permissible settlement flows, supported payment state transitions, webhook security and retry practices, reconciliation formats, and required legal, compliance, risk and operational prerequisites.',
    ' ',
    'CURRENT STARTUP STATUS',
    'Business stage: Pre-incorporation startup concept.',
    'Company incorporation: Not yet completed.',
    'GST registration: Not yet completed.',
    'Payment integration: Not yet activated.',
    'Partnership status: Seeking preliminary feasibility evaluation.',
    ' ',
    'Proposed architecture only. Subject to regulatory review and payment partner approval. No partner approval or regulatory authorisation is claimed.',
  ], 'pactpal-business-proposal.pdf')
}

function downloadFormattedPdf(title: string, lines: string[], filename: string) {
  const doc = new jsPDF()
  const drawHeader = (pageTitle: string) => {
    doc.setFillColor(11, 31, 58)
    doc.rect(0, 0, 210, 27, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('PactPal', 14, 17)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Trade with Confidence. Every Transaction Matters.', 196, 17, { align: 'right' })
    doc.setTextColor(23, 43, 69)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(pageTitle, 14, 42)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
  }
  drawHeader(title)
  let y = 52
  for (const line of lines) {
    const isHeading = line === line.toUpperCase() && line.trim().length > 0
    if (isHeading) {
      y += 3
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(37, 99, 235)
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(55, 65, 81)
    }
    const wrapped = doc.splitTextToSize(line, 180) as string[]
    const blockHeight = Math.max(6, wrapped.length * 5.5)
    if (y + blockHeight > 278) {
      doc.addPage()
      drawHeader(title)
      y = 52
    }
    if (line.trim()) doc.text(wrapped, 14, y)
    y += blockHeight + (line.trim() ? 2 : 1)
  }
  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setDrawColor(226, 232, 240)
    doc.line(14, 285, 196, 285)
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text('PactPal · Demonstration only · No live payment or partner approval', 14, 291)
    doc.text(`${page} / ${pageCount}`, 196, 291, { align: 'right' })
  }
  const url = URL.createObjectURL(doc.output('blob'))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default App
