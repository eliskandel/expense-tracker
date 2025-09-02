# 💸 Rupaiyaa

**Rupaiyaa** is a mobile-first **expense tracker** designed specifically for students to budget, track expenses, and split bills with roommates or friends while traveling.  
Built with **React Native (frontend)** and **Django + PostgreSQL (backend)**, it also integrates an **AI chatbot powered by Gemini API** for personalized financial insights.

---

## 🚀 Features
- **Budgeting & Expense Tracking** – Track monthly spending and set budgets.
- **Authentication** – Secure login and account management.
- **Notifications** – Get reminders for due payments and expenses.
- **AI Chatbot (Gemini)** – Provides insights by fetching and analyzing data from the backend.
- **Group Bill Splitting** – Track shared expenses with roommates and friends, with clear visibility of unpaid and paid amounts.
- **Lend & Borrow Contracts** – Create agreements between lenders and borrowers, with request acceptance and payment confirmation.
- **Event Budgeting (Upcoming)** – Manage budgets for group events and activities.

---

## 🛠 Tech Stack
- **Frontend**: React Native
- **Backend**: Django + Django REST Framework
- **Database**: PostgreSQL
- **Containerization**: Docker + Docker Compose
- **AI Integration**: Gemini API

---

## 📂 Folder Structure
```

Rupaiyaa/
│
├── backend/               # Django backend
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── manage.py
│
└── frontend/              # React Native frontend
├── package.json
└── App.js

````

---

## ⚙️ Installation & Setup

### 🔹 Prerequisites
Make sure you have installed:
- [Node.js](https://nodejs.org/) (>= 16.x)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Python 3.10+](https://www.python.org/)

---
## ⚙️ Installation & Setup

### 🔹 Backend (Django + PostgreSQL with Docker)

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Build and start Docker containers:**
   ```bash
   docker-compose up --build
   ```

3. **Apply database migrations:**
   ```bash
   docker-compose exec web python manage.py migrate
   ```

4. **Create a superuser:**
   ```bash
   docker-compose exec web python manage.py createsuperuser
   ```

5. **Backend server will run at:**
   ```
   http://localhost:8000
   ```

### 🔹 Frontend (React Native)

1. **Navigate to frontend folder:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the app:**
   ```bash
   npm start
   ```

4. **Scan the QR code** in your Expo Go app (iOS/Android) to run the mobile app.

## ▶️ Running Locally

1. **Start the backend using Docker:**
   ```bash
   docker-compose up
   ```

2. **Run the frontend with:**
   ```bash
   npm start
   ```

3. **The app will connect to your backend APIs running on:**
   ```
   http://localhost:8000
   ```

> **Note:** Update API URLs in frontend config if needed.

## 📸 Screenshots / Demo

*Screenshots coming soon...*

You can generate UI mockups using Google AI Studio with this prompt:

```
Generate high-quality mobile UI screenshots for an app called "Rupaiyaa".
The app is an expense tracker for students with features like:
- Dashboard showing monthly budget vs expenses
- Group bill splitting screen with pending/paid amounts
- Lend & borrow contract confirmation UI
- AI chatbot screen for financial advice (powered by Gemini)
- Notifications for rent/electricity payments

Design should look clean, modern, and student-friendly with a financial theme (soft blues, greens).
Format outputs as app screenshots displayed on a smartphone mockup.
```

## 📅 Future Plans

- 🎯 **Hyper-Personalized Insights** – Tailored recommendations for each user
- 🏦 **Seamless Bank Integration** – Sync with mobile banking apps
- 🤖 **AI-Powered Financial Co-Pilot** – Advanced budget optimization with AI
- 🌐 **Decentralized Finance & Digital Assets** – Support for crypto and DeFi
- 🔐 **Enhanced Security** – Stronger authentication and fraud prevention

## 🚫 Contributing

This project is part of a hackathon, and we are not accepting contributions at the moment.

## ⚠️ License

No license is provided as this is a hackathon project.

---

**Made with ❤️ for students by students**
