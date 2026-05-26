# 🚀 E-Commerce Book Store Backend API

A high-performance, modular backend API service designed to power the E-Commerce Book Store platform. Built on top of the NestJS (V11) framework and TypeScript.

---

## 🛠️ Infrastructure & Tech Stack

* **Framework**: NestJS (TypeScript) with modular design.
* **Database Access**: Prisma ORM for type-safe database queries.
* **Database Support**: Designed for MariaDB / PostgreSQL.
* **Authentication**: Passport JWT with secure cookie parsers and role guards.
* **Job Queue**: BullMQ powered by Redis for reliable background job execution.
* **Caching & Security**: Redis cache client, rate limits, and API throttlers.
* **Email System**: Nodemailer with beautiful Handlebars HTML email templates.
* **File Uploads**: Cloudinary integration for lightning-fast image delivery.
* **Push Notifications**: Firebase Admin SDK for push notifications.
* **Shipping Integration**: GHN (Giao Hàng Nhanh) API for dynamic shipping calculations and order tracking.

---

## 📂 Core Sub-Systems & Domain Modules

```
nestjs_e-commerce/
├── prisma/                    # Prisma DB Schema configuration and migrations
├── src/
│   ├── modules/               # Core Domain Modules
│   │   ├── auth/              # JWT auth and strategy validations
│   │   ├── users/             # User profiles, passwords, and accounts
│   │   ├── roles/             # RBAC role management
│   │   ├── book/              # Book catalogs, media management, and cover arts
│   │   ├── categories/        # Book category & genre engine
│   │   ├── author/            # Author registry
│   │   ├── carts/             # Cart state storage
│   │   ├── orders/            # Order creation, invoice, checkout
│   │   ├── shipments/         # Logistics, shipment stages
│   │   ├── address/           # Dynamic user addresses (GHN synced)
│   │   ├── vouchers/          # Discount vouchers, quotas, limit rules
│   │   ├── promotion/         # Campaign discount modifiers
│   │   ├── inventory/         # Stock adjustments & inventory sync
│   │   ├── mail/              # BullMQ queue-based email sending service
│   │   ├── notifications/     # Firebase messaging integration
│   │   └── redis/             # Global Redis caching client
│   ├── common/                # Shared decorators, exceptions, and filters
│   ├── main.ts                # Application entrypoint with cookie validation
│   └── prisma.config.ts       # Database connector bindings
```

---

## 🚀 Setup & Execution Guide

### Prerequisites
* **Node.js**: `v20` or higher
* **Redis Server**: Required for BullMQ job queueing and security rate limiting.
* **Database Server**: Local or remote instance of MariaDB / PostgreSQL.

### Installation
1. Install project dependencies:
   ```bash
   npm install
   ```
2. Configure your environment:
   * Create a `.env` file at the root of `/nestjs_e-commerce`.
   * Configure the following key properties:
     ```env
     DATABASE_URL="mariadb://user:password@localhost:3306/db_name"
     REDIS_HOST="localhost"
     REDIS_PORT=6379
     JWT_SECRET="your-ultra-secure-jwt-key"
     CLOUDINARY_CLOUD_NAME="..."
     CLOUDINARY_API_KEY="..."
     CLOUDINARY_API_SECRET="..."
     ```

### Database Initialization
Sync the database tables with the Prisma schema:
```bash
npx prisma db push
```

### Run the Application
* **Development Mode (with HMR watch)**:
  ```bash
  npm run start:dev
  ```
* **Production Build & Launch**:
  ```bash
  npm run build
  npm run start:prod
  ```
  *The API server will listen on [http://localhost:3000](http://localhost:3000).*

---

## 🧪 Testing API
Run local test suites to verify system modules:
```bash
# Unit tests
npm run test

# End-to-end integration tests
npm run test:e2e
```
