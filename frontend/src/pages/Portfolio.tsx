import { useEffect, useState } from 'react'
import axios from 'axios'
import Navbar from '../components/Navbar'

const Portfolio = () => {
  const [holdings, setHoldings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('http://localhost:5000/api/portfolio/holdings', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setHoldings(response.data)
      } catch (error) {
        console.error('Failed to fetch holdings', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHoldings()
  }, [])

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-6">My Portfolio</h1>
        {loading ? (
          <p>Loading...</p>
        ) : holdings.length === 0 ? (
          <p className="text-gray-600">No holdings yet. Start trading!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Symbol</th>
                  <th className="border p-2">Quantity</th>
                  <th className="border p-2">Avg Cost</th>
                  <th className="border p-2">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding: any) => (
                  <tr key={holding.id}>
                    <td className="border p-2">{holding.stock.symbol}</td>
                    <td className="border p-2">{holding.quantity}</td>
                    <td className="border p-2">${holding.avgCost.toFixed(2)}</td>
                    <td className="border p-2">${(holding.quantity * holding.avgCost).toFixed(2)}</td>
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

export default Portfolio
