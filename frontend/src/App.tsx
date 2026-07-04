import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

type View = 'dashboard' | 'products' | 'settings'
type AuthMode = 'login' | 'signup'

interface UserInfo {
  id: string
  email: string
  organizationId: string
  organizationName: string
}

interface Product {
  id: string
  name: string
  sku: string
  description: string | null
  quantityOnHand: number
  costPrice: number | null
  sellingPrice: number | null
  lowStockThreshold: number | null
  updatedAt: string
}

interface DashboardData {
  totalProducts: number
  totalQuantity: number
  lowStockItems: Array<{
    id: string
    name: string
    sku: string
    quantityOnHand: number
    lowStockThreshold: number
  }>
  defaultThreshold: number
}

interface ProductFormState {
  name: string
  sku: string
  description: string
  quantityOnHand: string
  costPrice: string
  sellingPrice: string
  lowStockThreshold: string
}

const emptyProductForm: ProductFormState = {
  name: '',
  sku: '',
  description: '',
  quantityOnHand: '0',
  costPrice: '',
  sellingPrice: '',
  lowStockThreshold: '',
}

const api = axios.create({ baseURL: 'http://localhost:4000/api' })

function App() {
  const [view, setView] = useState<View>('dashboard')
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [authForm, setAuthForm] = useState({ email: '', password: '', confirmPassword: '', organizationName: '' })
  const [user, setUser] = useState<UserInfo | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [settings, setSettings] = useState({ defaultLowStockThreshold: 5 })
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const authHeaders = () => {
    const token = localStorage.getItem('stockflow-token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const loadSession = async () => {
    const token = localStorage.getItem('stockflow-token')
    if (!token) {
      return
    }

    try {
      const response = await api.get('/auth/me', { headers: authHeaders() })
      setUser(response.data.user)
      await Promise.all([loadDashboard(), loadProducts()])
    } catch {
      localStorage.removeItem('stockflow-token')
      setUser(null)
    }
  }

  const loadDashboard = async () => {
    try {
      const response = await api.get('/dashboard', { headers: authHeaders() })
      setDashboard(response.data)
      setSettings({ defaultLowStockThreshold: response.data.defaultThreshold })
    } catch {
      setMessage('Unable to load dashboard right now.')
    }
  }

  const loadProducts = async (value = search) => {
    try {
      const response = await api.get(`/products?search=${encodeURIComponent(value)}`, { headers: authHeaders() })
      setProducts(response.data)
    } catch {
      setMessage('Unable to load products right now.')
    }
  }

  const loadSettings = async () => {
    try {
      const response = await api.get('/settings', { headers: authHeaders() })
      setSettings(response.data)
    } catch {
      setMessage('Unable to load settings right now.')
    }
  }

  useEffect(() => {
    void loadSession()
  }, [])

  useEffect(() => {
    if (user) {
      void loadProducts(search)
    }
  }, [search, user])

  const handleAuthSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/signup'
      const payload = authMode === 'login'
        ? { email: authForm.email, password: authForm.password }
        : { email: authForm.email, password: authForm.password, organizationName: authForm.organizationName }

      if (authMode === 'signup' && authForm.password !== authForm.confirmPassword) {
        setMessage('Passwords do not match.')
        return
      }

      const response = await api.post(endpoint, payload)
      localStorage.setItem('stockflow-token', response.data.token)
      setUser(response.data.user)
      setView('dashboard')
      await Promise.all([loadDashboard(), loadProducts(), loadSettings()])
      setMessage(authMode === 'login' ? 'Welcome back!' : 'Account created. You can start adding products.')
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleProductSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const payload = {
        name: productForm.name,
        sku: productForm.sku,
        description: productForm.description || null,
        quantityOnHand: Number(productForm.quantityOnHand),
        costPrice: productForm.costPrice ? Number(productForm.costPrice) : null,
        sellingPrice: productForm.sellingPrice ? Number(productForm.sellingPrice) : null,
        lowStockThreshold: productForm.lowStockThreshold ? Number(productForm.lowStockThreshold) : null,
      }

      if (editingProductId) {
        await api.put(`/products/${editingProductId}`, payload, { headers: authHeaders() })
        setMessage('Product updated.')
      } else {
        await api.post('/products', payload, { headers: authHeaders() })
        setMessage('Product added.')
      }

      setProductForm(emptyProductForm)
      setEditingProductId(null)
      await Promise.all([loadProducts(), loadDashboard()])
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Unable to save product.')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (product: Product) => {
    setEditingProductId(product.id)
    setProductForm({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      quantityOnHand: String(product.quantityOnHand),
      costPrice: product.costPrice === null ? '' : String(product.costPrice),
      sellingPrice: product.sellingPrice === null ? '' : String(product.sellingPrice),
      lowStockThreshold: product.lowStockThreshold === null ? '' : String(product.lowStockThreshold),
    })
    setView('products')
  }

  const deleteProduct = async (productId: string) => {
    if (!window.confirm('Delete this product?')) {
      return
    }

    try {
      await api.delete(`/products/${productId}`, { headers: authHeaders() })
      setMessage('Product deleted.')
      await Promise.all([loadProducts(), loadDashboard()])
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Unable to delete product.')
    }
  }

  const updateSettings = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await api.put('/settings', {
        defaultLowStockThreshold: Number(settings.defaultLowStockThreshold),
      }, { headers: authHeaders() })
      setSettings(response.data)
      setMessage('Default threshold updated.')
      await loadDashboard()
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Unable to update settings.')
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('stockflow-token')
    setUser(null)
    setDashboard(null)
    setProducts([])
    setView('dashboard')
    setMessage('You have been logged out.')
  }

  if (!user) {
    return (
      <div className="app-shell">
        <div className="card auth-card">
          <h1>StockFlow MVP</h1>
          <p className="subtitle">A simple inventory app for small teams and demo use.</p>
          <div className="toggle-row">
            <button className={authMode === 'login' ? 'toggle active' : 'toggle'} onClick={() => setAuthMode('login')}>
              Login
            </button>
            <button className={authMode === 'signup' ? 'toggle active' : 'toggle'} onClick={() => setAuthMode('signup')}>
              Sign up
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="form-stack">
            <input
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
              required
            />
            {authMode === 'signup' && (
              <>
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={authForm.confirmPassword}
                  onChange={(event) => setAuthForm({ ...authForm, confirmPassword: event.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Organization name"
                  value={authForm.organizationName}
                  onChange={(event) => setAuthForm({ ...authForm, organizationName: event.target.value })}
                  required
                />
              </>
            )}
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Please wait…' : authMode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          {message ? <p className="message">{message}</p> : null}
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h2>StockFlow MVP</h2>
          <p>{user.organizationName}</p>
        </div>
        <div className="topbar-actions">
          <button className={view === 'dashboard' ? 'toggle active' : 'toggle'} onClick={() => setView('dashboard')}>Dashboard</button>
          <button className={view === 'products' ? 'toggle active' : 'toggle'} onClick={() => setView('products')}>Products</button>
          <button className={view === 'settings' ? 'toggle active' : 'toggle'} onClick={() => setView('settings')}>Settings</button>
          <button className="secondary-btn" onClick={logout}>Log out</button>
        </div>
      </header>

      {message ? <p className="message">{message}</p> : null}

      {view === 'dashboard' && (
        <div className="content-stack">
          <section className="card">
            <h3>Inventory overview</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <span>Total products</span>
                <strong>{dashboard?.totalProducts ?? 0}</strong>
              </div>
              <div className="stat-card">
                <span>Total stock</span>
                <strong>{dashboard?.totalQuantity ?? 0}</strong>
              </div>
              <div className="stat-card">
                <span>Default threshold</span>
                <strong>{dashboard?.defaultThreshold ?? settings.defaultLowStockThreshold}</strong>
              </div>
            </div>
          </section>

          <section className="card">
            <h3>Low stock items</h3>
            {dashboard?.lowStockItems?.length ? (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Qty</th>
                    <th>Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.lowStockItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.sku}</td>
                      <td>{item.quantityOnHand}</td>
                      <td>{item.lowStockThreshold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No low stock items right now.</p>
            )}
          </section>
        </div>
      )}

      {view === 'products' && (
        <div className="content-stack">
          <section className="card">
            <div className="section-head">
              <h3>{editingProductId ? 'Edit product' : 'Add product'}</h3>
              {editingProductId ? <button className="secondary-btn" onClick={() => { setEditingProductId(null); setProductForm(emptyProductForm) }}>Cancel</button> : null}
            </div>
            <form onSubmit={handleProductSubmit} className="form-grid">
              <input placeholder="Product name" value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} required />
              <input placeholder="SKU" value={productForm.sku} onChange={(event) => setProductForm({ ...productForm, sku: event.target.value })} required />
              <input placeholder="Description" value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} />
              <input type="number" placeholder="Quantity" value={productForm.quantityOnHand} onChange={(event) => setProductForm({ ...productForm, quantityOnHand: event.target.value })} required />
              <input type="number" step="0.01" placeholder="Cost price" value={productForm.costPrice} onChange={(event) => setProductForm({ ...productForm, costPrice: event.target.value })} />
              <input type="number" step="0.01" placeholder="Selling price" value={productForm.sellingPrice} onChange={(event) => setProductForm({ ...productForm, sellingPrice: event.target.value })} />
              <input type="number" placeholder="Low stock threshold" value={productForm.lowStockThreshold} onChange={(event) => setProductForm({ ...productForm, lowStockThreshold: event.target.value })} />
              <button type="submit" className="primary-btn" disabled={loading}>{loading ? 'Saving…' : editingProductId ? 'Update product' : 'Add product'}</button>
            </form>
          </section>

          <section className="card">
            <div className="section-head">
              <h3>Products</h3>
              <input className="search-box" placeholder="Search by name or SKU" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>{product.quantityOnHand}</td>
                    <td>{product.sellingPrice ?? '—'}</td>
                    <td>
                      <div className="action-row">
                        <button className="secondary-btn" onClick={() => startEdit(product)}>Edit</button>
                        <button className="danger-btn" onClick={() => deleteProduct(product.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}

      {view === 'settings' && (
        <section className="card settings-card">
          <h3>Settings</h3>
          <p>Use this default threshold when a product does not have its own threshold.</p>
          <form onSubmit={updateSettings} className="inline-form">
            <input
              type="number"
              min="0"
              value={settings.defaultLowStockThreshold}
              onChange={(event) => setSettings({ defaultLowStockThreshold: Number(event.target.value) })}
            />
            <button type="submit" className="primary-btn" disabled={loading}>Save</button>
          </form>
        </section>
      )}
    </div>
  )
}

export default App
