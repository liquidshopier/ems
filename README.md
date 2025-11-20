# Enterprise Management System (EMS)

A comprehensive enterprise management system built with React, Material-UI, Node.js, Express, and SQLite.

## Quick Start

### 1. Start Backend
```bash
cd backend
node server.js
```

### 2. Start Frontend  
```bash
cd frontend
npm start
```

### 3. Login
- **Admin:** `admin` / `123`
- **Developer:** `dev` / `securitykis0428#` (hidden)

### 4. Access
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

---

## Features

### Dashboard
- Real-time statistics and charts
- Sales and purchase trends
- Top-selling products
- Low stock alerts
- Date range filtering

### Products Management
- Add, edit, delete products
- Track inventory
- Add quantity with purchase history
- Unit management

### Sales Management
- Multi-product sales
- Customer selection
- Automatic stock updates
- Payment tracking

### Customer Management
- Customer database
- Contact details
- Payment tracking

### Settings
- **Unit Management:** Add/edit/delete units
- **User Management:** User CRUD with permissions
- **Text Configuration:** Customize all UI texts
- **Appearance:** Customize fonts and colors

### Log History
- Tracks all database operations
- Shows user, action, timestamp
- View old/new data for changes

---

## User Management

### Permissions System
Users can have granular permissions:
- `dashboard` - Access dashboard
- `products` - Manage products  
- `sales` - Manage sales
- `customers` - Manage customers
- `settings.units` - Manage units
- `settings.users` - Manage users
- `settings.textConfig` - Configure texts
- `settings.appearance` - Configure appearance
- `logs` - View log history

### Protected Users
- **Admin:** Cannot delete, only admin can change password
- **Dev:** Hidden from users, cannot delete, only dev can change password

### Default Permissions for New Users
- Products, Sales, Customers, Settings.units

---

## Configuration

### Text Configuration
- **Location:** Settings → Text Configuration
- **Storage:** Browser localStorage
- **Scope:** Per browser/device
- **Includes:** All UI texts (buttons, labels, messages, etc.)
- **Sections:** App Info, Navigation, Dashboard, Products, Sales, Customers, Settings, Auth, Common

### Appearance Configuration
- **Location:** Settings → Appearance  
- **Storage:** Browser localStorage
- **Scope:** Per browser/device
- **Includes:** Fonts, colors, spacing
- **Real-time:** Changes apply immediately

---

## Technology Stack

### Backend
- Node.js + Express
- SQLite (better-sqlite3)
- JWT authentication
- bcryptjs password hashing

### Frontend
- React 18
- Material-UI (MUI)
- Recharts for charts
- Axios for API calls
- React Router for navigation

---

## Project Structure

```
├── backend/
│   ├── config/          # Database config
│   ├── database/        # SQLite DB and schema
│   ├── middleware/      # Auth middleware
│   ├── routes/          # API routes
│   ├── utils/           # Logger
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── config/      # Text config
│   │   ├── context/     # Auth context
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── utils/       # Utilities
│   └── public/
└── README.md
```

---

## Troubleshooting

### Frontend Won't Load
1. Hard refresh: `Ctrl + Shift + R`
2. Clear browser cache
3. Check console (F12) for errors
4. Restart frontend server

### Backend Errors
1. Check if port 5000 is available
2. Verify `backend/database/ems.db` exists
3. Check server console

### Reset Database
1. Stop backend server
2. Delete `backend/database/ems.db`
3. Restart backend (recreates with defaults)

### Text/Appearance Changes Not Persisting
- Changes are per-browser (localStorage)
- Clear localStorage: F12 → Application → Local Storage
- Not shared across devices/browsers

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout  
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all
- `POST /api/products` - Create
- `PUT /api/products/:id` - Update
- `DELETE /api/products/:id` - Delete
- `POST /api/products/:id/add-quantity` - Add quantity

### Sales
- `GET /api/sales` - Get all
- `POST /api/sales` - Create
- `DELETE /api/sales/:id` - Delete

### Customers
- `GET /api/customers` - Get all
- `POST /api/customers` - Create
- `PUT /api/customers/:id` - Update
- `DELETE /api/customers/:id` - Delete

### Units
- `GET /api/units` - Get all
- `POST /api/units` - Create
- `PUT /api/units/:id` - Update
- `DELETE /api/units/:id` - Delete

### Users
- `GET /api/users` - Get all
- `POST /api/users` - Create
- `PUT /api/users/:id` - Update
- `DELETE /api/users/:id` - Delete

### Logs
- `GET /api/logs` - Get activity logs

### Dashboard
- `GET /api/dashboard/stats` - Get statistics

---

## License

MIT License - Feel free to use for personal or commercial projects.
