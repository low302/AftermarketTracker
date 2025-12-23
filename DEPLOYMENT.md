# DealerTrack Pro - Quick Deployment Guide

## 🚀 Option 1: Standard Deployment (Recommended)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start the Server
```bash
npm start
```

### Step 3: Access the Application
Open your browser to: **http://localhost:3000**

---

## 🐳 Option 2: Docker Deployment

### Using Docker Compose (Easiest)
```bash
docker-compose up -d
```

### Using Docker Directly
```bash
# Build the image
docker build -t dealertrack-pro .

# Run the container
docker run -d -p 3000:3000 -v dealertrack-data:/app/data --name dealertrack dealertrack-pro
```

---

## 📋 System Requirements

- **Node.js**: Version 14 or higher
- **npm**: Comes with Node.js
- **Browser**: Modern browser (Chrome, Firefox, Safari, Edge)
- **RAM**: Minimum 512MB
- **Disk Space**: ~50MB + data storage

---

## 🔧 Configuration

### Change Port
Edit `server.js`, line 5:
```javascript
const PORT = 3000; // Change to your port
```

### Change Tax Rate
Edit `server.js`, lines with tax calculation:
```javascript
newOrder.tax = newOrder.subtotal * 0.0825; // 8.25% default
```

---

## 📂 Default Data Location

All data is stored in JSON files:
- `data/parts.json` - Parts inventory
- `data/customers.json` - Customer accounts
- `data/service_orders.json` - Service orders
- `data/invoices.json` - Invoices (future use)

---

## 🎨 Features Overview

### Dashboard
- Real-time statistics
- Low stock alerts
- Recent service orders
- Revenue tracking

### Parts Management
- Full CRUD operations
- Search and filter
- Low stock notifications
- Cost/price tracking
- Location management

### Service Orders (RO)
- Create and track repair orders
- Customer/vehicle information
- Status workflow
- Parts and labor tracking
- Automatic calculations

### Customer Accounts
- Multiple account types
- Contact management
- Credit limits
- Tax exemption status

---

## 🔐 Security Note

**For Production Use:**
- Add authentication (JWT, OAuth, etc.)
- Implement HTTPS
- Add input validation
- Set up rate limiting
- Configure CORS properly
- Add audit logging

---

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Cannot Connect
- Check firewall settings
- Verify Node.js is running
- Check server logs for errors

### Data Not Saving
- Ensure `data/` directory has write permissions
- Check available disk space

---

## 📞 Quick Reference

**Start Development Mode:**
```bash
npm run dev
```

**View Logs:**
```bash
# Standard
tail -f logs/app.log

# Docker
docker logs -f dealertrack
```

**Stop Docker:**
```bash
docker-compose down
```

---

## 💡 Tips

1. **Backup Data**: Regularly backup the `data/` folder
2. **Use Dev Mode**: During development for auto-restart
3. **Monitor Stock**: Set appropriate minimum stock levels
4. **Test First**: Try with sample data before production use

---

## 🎯 Getting Started Tutorial

1. **Add Your First Part**
   - Click "Parts Inventory"
   - Click "Add Part"
   - Fill in part details
   - Save

2. **Create a Customer Account**
   - Click "Accounts"
   - Click "New Account"
   - Enter customer information
   - Save

3. **Create a Service Order**
   - Click "Service Orders (RO)"
   - Click "New RO"
   - Fill in service details
   - Save

4. **View Dashboard**
   - Click "Dashboard" to see overview
   - Monitor low stock alerts
   - Track open orders

---

**Ready to Deploy!** 🎉

For detailed information, see the main README.md file.
