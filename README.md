# DealerTrack Pro Clone
## Parts, Accounts & Service Management System

A comprehensive dealership management system inspired by DealerTrack from Cox Automotive, focusing on Parts Inventory, Customer Accounts, and Service Orders (RO) management.

## Features

### 📦 Parts Inventory Management
- Complete parts catalog with SKU tracking
- Real-time inventory levels
- Low stock alerts and notifications
- Cost and pricing management
- Location tracking (bin/shelf locations)
- Category-based organization
- Advanced search and filtering

### 👥 Customer Accounts
- Retail, Wholesale, Fleet, and Internal account types
- Complete customer contact information
- Credit limit tracking
- Tax exemption status
- Account balance management
- Customer notes and history

### 🔧 Service Orders (RO)
- Repair order creation and tracking
- Customer and vehicle information
- Service advisor and technician assignment
- Status workflow management (Open → In Progress → Completed → Closed)
- Parts and labor tracking
- Automatic tax calculation
- Promised date tracking
- Multi-status filtering

### 📊 Dashboard Analytics
- Real-time statistics
- Total parts inventory count
- Low stock alerts
- Open service orders tracking
- Total revenue calculation
- Recent orders overview
- Inventory alerts

## Technology Stack

**Backend:**
- Node.js with Express.js
- File-based JSON storage (can be easily migrated to PostgreSQL/MongoDB)
- RESTful API architecture

**Frontend:**
- Vanilla JavaScript (ES6+)
- Modern CSS3 with CSS Variables
- Responsive design
- Dark theme optimized for long work sessions

## Installation

### Prerequisites
- Node.js 14+ and npm

### Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Start the server:**
```bash
npm start
```

3. **Access the application:**
Open your browser and navigate to:
```
http://localhost:3000
```

### Development Mode

For auto-restart on file changes:
```bash
npm run dev
```

## Project Structure

```
dealertrack-clone/
├── server.js              # Express server and API endpoints
├── package.json           # Project dependencies
├── data/                  # JSON data storage (auto-created)
│   ├── parts.json
│   ├── customers.json
│   ├── service_orders.json
│   └── ...
└── public/
    ├── index.html        # Main application interface
    ├── styles.css        # Complete styling
    └── app.js            # Client-side application logic
```

## API Endpoints

### Parts Management
- `GET /api/parts` - Get all parts
- `POST /api/parts` - Create new part
- `PUT /api/parts/:id` - Update part
- `DELETE /api/parts/:id` - Delete part

### Customer Accounts
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Service Orders
- `GET /api/service-orders` - Get all service orders
- `POST /api/service-orders` - Create new service order
- `PUT /api/service-orders/:id` - Update service order
- `DELETE /api/service-orders/:id` - Delete service order

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

## Usage Guide

### Adding a Part
1. Navigate to "Parts Inventory"
2. Click "Add Part" button
3. Fill in part details:
   - Part number (required)
   - Description (required)
   - Manufacturer
   - Category
   - Quantity and minimum stock level
   - Cost and retail price
   - Storage location
4. Click "Save Part"

### Creating a Service Order
1. Navigate to "Service Orders (RO)"
2. Click "New RO" button
3. Enter customer and vehicle information
4. Add service advisor and technician
5. Enter customer concerns
6. Set promised completion date
7. Click "Save Service Order"

### Managing Customer Accounts
1. Navigate to "Accounts"
2. Click "New Account" button
3. Select account type (Retail/Wholesale/Fleet/Internal)
4. Fill in customer information
5. Set credit limit if applicable
6. Mark as tax exempt if needed
7. Click "Save Account"

## Customization

### Changing the Port
Edit `server.js`:
```javascript
const PORT = 3000; // Change to your desired port
```

### Tax Rate Configuration
Edit the tax calculation in `server.js`:
```javascript
newOrder.tax = newOrder.subtotal * 0.0825; // Change tax rate here
```

### Color Scheme
Edit CSS variables in `public/styles.css`:
```css
:root {
    --primary-color: #0066cc;
    --bg-primary: #1a1d23;
    /* ... customize other colors */
}
```

## Data Persistence

Currently uses JSON file storage in the `data/` directory. For production use, consider migrating to:
- PostgreSQL
- MongoDB
- MySQL
- SQLite

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

Optimized for desktop use, responsive for tablets and mobile devices.

## Security Considerations

⚠️ **Important for Production:**
- Add authentication/authorization
- Implement input validation
- Add HTTPS support
- Set up CORS properly
- Add rate limiting
- Implement audit logging

## Future Enhancements

Potential additions:
- [ ] Invoicing system
- [ ] Parts ordering/PO management
- [ ] Email notifications
- [ ] Reporting and analytics
- [ ] Barcode scanning
- [ ] Multi-location support
- [ ] User roles and permissions
- [ ] Appointment scheduling
- [ ] Vehicle history tracking

## License

MIT License - feel free to use and modify for your needs.

## Support

For issues or questions, please create an issue in the repository.

## Credits

Inspired by DealerTrack from Cox Automotive. This is an independent implementation and is not affiliated with or endorsed by Cox Automotive.
