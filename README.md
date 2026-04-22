# Student Print Request Portal

A modern, full-stack web application designed to streamline student print requests and management. Built with React, Vite, Tailwind CSS, and Supabase.

## 🚀 Features

### For Students
- **Role-based Authentication**: Secure login for students.
- **Document Upload**: Optimized sequential file uploading for high reliability on mobile networks.
- **Automated Price Calculation**: Real-time ₹2/page cost calculation based on actual PDF page counts.
- **Order Tracking**: Track the status of print requests (Pending, Printing, Ready, etc.).
- **Dashboard**: Personal greeting and quick access to previous orders.

### For Xerox Staff
- **Order Management**: Real-time view of incoming print requests.
- **One-Click Printing**: Open documents directly in a new tab with automatic print dialog activation.
- **Direct Public Links**: Optimized for mock accounts using direct storage access.
- **Status Updates**: Update order status (Pending, Ready to Print, Completed, etc.) to notify students.
- **Inventory Monitoring**: Real-time stock tracking for paper, ink, and supplies.

### For Administrators
- **Inventory Management**: Maintain and update stock levels for all supplies with automated `upsert` logic.
- **Overview**: Complete visibility into system orders and inventory status.
- **Centralized Data**: Single source of truth for the entire campus print operations.

## 🛠️ Technology Stack
- **Frontend**: React.js (Vite), Tailwind CSS, Lucide React (Icons), Shadcn UI.
- **PDF Engine**: pdf-lib (for automated page counting).
- **Backend**: Supabase (PostgreSQL, Storage, Real-time).
- **Authentication**: Supabase Auth with safety timeouts for stable initialization.
- **Notifications**: Sonner (Toasts) with detailed progress feedback.

## 📋 Setup Instructions

### 1. Database Setup
Run the following SQL in your Supabase SQL Editor:
- Create the `profiles`, `orders`, and `inventory` tables.
- Create the `documents` storage bucket (Public).
- Set up RLS policies (as documented in the project fix notes).

### 2. Local Installation
```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```




## 📄 License
MIT License
