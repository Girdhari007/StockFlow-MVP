import { Link, useNavigate } from 'react-router-dom'

const Navbar = () => {
  const navigate = useNavigate()
  const userName = localStorage.getItem('userName')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userName')
    navigate('/login')
  }

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/dashboard" className="text-2xl font-bold">
          📈 StockFlow
        </Link>
        <div className="flex gap-4 items-center">
          <Link to="/dashboard" className="hover:text-blue-200">Dashboard</Link>
          <Link to="/portfolio" className="hover:text-blue-200">Portfolio</Link>
          <Link to="/transactions" className="hover:text-blue-200">Transactions</Link>
          <span className="text-sm">{userName}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
