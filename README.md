# Enterprise Management System (EMS)

A comprehensive enterprise management system built with React, Material-UI, Node.js, Express, and SQLite. Available as a web application or as a standalone Electron desktop application.

## Quick Start

### Web Application

#### 1. Start Backend
```bash
cd backend
node server.js
```

#### 2. Start Frontend  
```bash
cd frontend
npm start
```

#### 3. Login
- **Admin:** `admin` / `123`
- **Developer:** `dev` / `securitykis0428#` (hidden)

#### 4. Access
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Electron Desktop Application

#### Development Mode
Run the app in Electron with hot-reload:
```bash
npm run electron:dev
```
This will start the backend server and launch the Electron app.

#### Build Executable
Build a standalone executable for your platform:

**Windows Installer:**
```bash
npm run build:electron:installer
```
This creates a Windows installer (`.exe`) in the `dist/` folder.

**Windows (Directory Only):**
```bash
npm run build:electron:win
```

**All Platforms (Directory Only):**
```bash
npm run build:electron
```

The built executables will be in the `dist/` folder.

#### Running Built App
- **Windows:** Run the `.exe` installer from `dist/` folder to install the application
- The installer will create shortcuts on desktop and start menu

**Note:** The Electron app bundles both frontend and backend into a single executable. The backend server **automatically starts** when you launch the app - no separate server setup needed! The database is also included and persists between app sessions.

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
- Product descriptions
- Track inventory
- Add quantity with purchase history
- Unit management (unit column positioned next to quantity)

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
- **Session Management:** Enable/disable session timeout (24 hours), auto-logout on app close

### Log History
- Tracks all database operations
- Shows user, action, timestamp
- View old/new data for changes

### Database View (Dev Only)
- View all database tables and their structure
- Inspect table data with pagination
- Detailed row view with modal
- Accessible only to 'dev' user

---

## User Management

### Permissions System
Users can have granular permissions:
- `dashboard` - Access dashboard
- `products` - Manage products  
- `sales` - Manage sales
- `customers` - Manage customers
- `settings.units` - Manage units
- `settings.users` - Manage users (includes session management)
- `settings.textConfig` - Configure texts
- `settings.appearance` - Configure appearance
- `logs` - View log history
- `databaseView` - View database structure and data (dev user only)

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
- **Sections:** App Info, Navigation, Dashboard, Products, Sales, Customers, Settings, Auth, Common, Database View, License

### Session Management
- **Location:** Settings → Session Management
- **Features:**
  - Enable/disable session timeout
  - 24-hour automatic session expiration
  - Auto-logout when app is closed
  - Session status display
- **Storage:** Browser localStorage
- **Access:** Admin users only

### License System
- **License Validation:** Required on first launch
- **Device Number:** Auto-generated unique device identifier
- **License Storage:** System directory (`C:/EMS-license.txt` on Windows, `~/EMS-license.txt` on macOS/Linux)
- **Auto-validation:** Checks license on app startup
- **Bypass:** Valid license automatically redirects to login

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

### Desktop Application
- Electron (for desktop app packaging)
- electron-builder (for creating installers)

---

## Project Structure

```
├── backend/
│   ├── config/          # Database config
│   ├── database/        # SQLite DB and schema
│   ├── middleware/      # Auth middleware
│   ├── routes/          # API routes
│   ├── utils/           # Logger, license generator, device info, license storage
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components (Auth, Layout, Common)
│   │   ├── config/      # Text config
│   │   ├── context/     # Auth context
│   │   ├── pages/       # Page components (Dashboard, Products, Sales, Customers, Settings, Logs, License, DatabaseView)
│   │   ├── services/    # API services
│   │   └── utils/       # Utilities (textConfig, permissions, sessionManager)
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

### License
- `GET /api/license/device-number` - Get device number
- `POST /api/license/validate` - Validate license key
- `GET /api/license/check` - Check stored license

### Database View (Dev Only)
- `GET /api/database-view/all` - Get all tables with schema and preview data
- `GET /api/database-view/tables` - Get list of all tables
- `GET /api/database-view/table/:tableName` - Get table data with pagination

---

## License

MIT License - Feel free to use for personal or commercial projects.
