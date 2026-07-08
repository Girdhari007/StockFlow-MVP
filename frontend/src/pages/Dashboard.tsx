import Navbar from '../components/Navbar'

const Dashboard = () => {
  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-6">Welcome to StockFlow</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-500 text-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold">Portfolio Value</h2>
            <p className="text-3xl font-bold">$0.00</p>
          </div>
          <div className="bg-green-500 text-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold">Total Gain/Loss</h2>
            <p className="text-3xl font-bold">+0%</p>
          </div>
          <div className="bg-purple-500 text-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold">Holdings</h2>
            <p className="text-3xl font-bold">0</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
