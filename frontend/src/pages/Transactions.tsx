import { useEffect, useState } from 'react'
import axios from 'axios'
import Navbar from '../components/Navbar'

const Transactions = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('http://localhost:5000/api/transactions', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setTransactions(response.data)
      } catch (error) {
        console.error('Failed to fetch transactions', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-6">Transactions</h1>
        {loading ? (
          <p>Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="text-gray-600">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Date</th>
                  <th className="border p-2">Stock</th>
                  <th className="border p-2">Type</th>
                  <th className="border p-2">Quantity</th>
                  <th className="border p-2">Price</th>
                  <th className="border p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn: any) => (
                  <tr key={txn.id}>
                    <td className="border p-2">{new Date(txn.createdAt).toLocaleDateString()}</td>
                    <td className="border p-2">{txn.stock.symbol}</td>
                    <td className={`border p-2 font-semibold ${txn.type === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                      {txn.type}
                    </td>
                    <td className="border p-2">{txn.quantity}</td>
                    <td className="border p-2">${txn.price.toFixed(2)}</td>
                    <td className="border p-2">${txn.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Transactions
