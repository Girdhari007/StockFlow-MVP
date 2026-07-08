# StockFlow MVP

A full-stack stock portfolio management system built for demonstrating SDE skills.

## Features

✅ User Authentication (Register/Login with JWT)  
✅ Portfolio Management (View holdings)  
✅ Transaction Tracking (Buy/Sell stocks)  
✅ Responsive UI with Tailwind CSS  
✅ Type-safe backend with TypeScript  
✅ Database with Prisma ORM  

## Tech Stack

### Backend
- **Node.js** + **Express.js** - REST API
- **TypeScript** - Type safety
- **Prisma** - ORM with SQLite
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin requests

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling

## Project Structure

```
StockFlow-MVP/
├── backend/
│   ├── src/
│   │   ├── server.ts           # Express app entry point
│   │   ├── middleware/
│   │   │   └── auth.ts         # JWT authentication middleware
│   │   └── routes/
│   │       ├── auth.ts         # Authentication endpoints
│   │       ├── portfolio.ts    # Portfolio endpoints
│   │       └── transaction.ts  # Transaction endpoints
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                    # Environment variables
├── frontend/
│   ├── src/
│   │   ├── main.tsx            # React entry point
│   │   ├── App.tsx             # Main app component
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Page components
│   │   └── index.css           # Global styles
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy and update environment variables
cp .env.example .env

# Setup database
npm run prisma:generate
npm run prisma:migrate

# Start development server
npm run dev
# Server runs on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# App runs on http://localhost:5173
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Portfolio (Protected)
- `GET /api/portfolio` - Get user portfolio
- `GET /api/portfolio/holdings` - Get all holdings

### Transactions (Protected)
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions/buy` - Buy stock
- `POST /api/transactions/sell` - Sell stock

## Database Schema

- **User** - Stores user information
- **Portfolio** - One portfolio per user
- **Holding** - Stocks held in portfolio
- **Stock** - Stock information
- **Transaction** - Buy/sell transactions

## Development Notes

### Key Features Implemented

1. **Authentication**
   - JWT-based auth with 24-hour expiry
   - Password hashing with bcryptjs
   - Token stored in localStorage on client

2. **Portfolio Management**
   - User-specific portfolios
   - Holdings tracking with average cost
   - Automatic portfolio creation on registration

3. **Transactions**
   - Buy/sell functionality
   - Transaction history
   - Holding updates on transactions

4. **UI/UX**
   - Clean, responsive design
   - Protected routes for authenticated pages
   - Real-time token validation

## Future Enhancements

- Real-time stock price updates via WebSocket
- Advanced portfolio analytics
- Email notifications
- Two-factor authentication
- Watchlist feature
- Mobile app

## Testing

### Manual Testing

1. **Register a new account**
2. **Login with credentials**
3. **View portfolio (empty initially)**
4. **Add mock stocks and transactions**
5. **Check transaction history**

## Deployment

Ready to deploy to:
- Vercel (Frontend)
- Railway/Render (Backend)
- Any Node.js hosting

## Performance Considerations

- JWT for stateless authentication
- Indexed database queries
- Efficient React rendering with hooks
- CSS optimization with Tailwind

## Author

Girdhari007

## License

MIT
