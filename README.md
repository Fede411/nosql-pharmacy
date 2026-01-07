# 💊 Pharmacy Management System

A comprehensive web application for managing pharmacy dispensing programs, accumulated consumption, and pharmaceutical interventions. Built with Node.js, Express, MongoDB, and EJS.

## 🌟 Features

- **Dispensing Programs Management**: Track medication dispensing with detailed patient and prescription information.
- **Accumulated Consumption Tracking**: Monitor medication usage over time with comprehensive analytics.
- **Pharmaceutical Interventions**: Record and manage pharmacist actions and interventions.
- **Advanced Statistics**: Visualize data with interactive charts and insights.
- **CSV Export**: Export filtered data for external analysis.
- **Search & Filter**: Advanced filtering by medication, active ingredient, date ranges, and more.

## 🚀 Live Demo

Visit the live application: [Pharmacy Management System](https://pharmacy-app-s2mw.onrender.com)

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (MongoDB Atlas)
- **Template Engine**: EJS
- **Styling**: Bootstrap, Custom CSS
- **Dependencies**:
  - mongoose: MongoDB object modelling
  - json2csv: CSV export functionality
  - papaparse: CSV parsing
  - body-parser: Request body parsing
  - method-override: HTTP method override
  - dotenv: Environment variable management

## 📋 Prerequisites

- Node.js 22.x or higher
- MongoDB Atlas account (or local MongoDB instance)
- npm or yarn package manager

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Fede411/nosql-pharmacy.git
   cd nosql-pharmacy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb+srv://your_user:your_password@cluster.mongodb.net/prueba_farma
   PORT=8001
   NODE_ENV=production
   ```

4. **Import data to MongoDB**
   
   If you have CSV data files, use the import script:
   ```bash
   node import_csvs.js
   ```

5. **Start the application**
   ```bash
   npm start
   ```

   The application will be available at `http://localhost:8001`

## 📁 Project Structure

```
nosql-pharmacy/
├── controllers/          # Business logic
│   ├── farma.js         # Pharmacy operations
│   └── estadisticas.js  # Statistics and analytics
├── models/              # MongoDB schemas
│   ├── dispensacion.js
│   ├── consumo_acumulado.js
│   ├── actuaciones.js
│   └── pa_medicamento.js
├── views/               # EJS templates
│   ├── dispensacion.ejs
│   ├── consumos_acumulados.ejs
│   ├── actuaciones.ejs
│   └── estadisticas.ejs
├── public/              # Static assets
│   ├── stylesheets/
│   └── javascripts/
├── rest_server.js       # Main server file
├── package.json
└── .env                 # Environment variables (not in repo)
```

## 🔑 API Endpoints

### Main Pages
- `GET /` - Redirect to dispensing programs
- `GET /dispensacion` - Dispensing programs list
- `GET /consumos_acumulados` - Accumulated consumption
- `GET /actuaciones` - Pharmaceutical interventions
- `GET /estadisticas` - Statistics dashboard

### Filtering & Export
- `POST /dispensacion/filterPatientsByUnionRegistrado` - Filter by medication
- `POST /consumos_acumulados/filterConsumoByUnionRegistrado` - Filter consumption
- `GET /dispensacion/export` - Export dispensing data to CSV
- `GET /consumos_acumulados/export` - Export consumption to CSV

### Statistics API
- `POST /estadisticas/api/resumen-general` - General summary
- `POST /estadisticas/api/top-medicamentos` - Top medications
- `POST /estadisticas/api/distribucion-actuaciones` - Intervention distribution
- And more...

## 📊 Database Collections

- **dispensacion**: Medication dispensing records
- **consumos_acumulados**: Accumulated medication consumption
- **actuaciones**: Pharmaceutical interventions
- **pa_medicamento**: Medication and active ingredient catalog

## 🔒 Security

- Environment variables for sensitive data
- MongoDB connection string stored securely
- Input validation and sanitization
- CORS configuration for production

## 🌐 Deployment

The application is deployed on [Render](https://render.com) with:
- Automatic deployments from GitHub
- MongoDB Atlas for database hosting
- Environment variables configured in Render dashboard

### Deploy to Render

1. Fork this repository
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Configure environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `NODE_ENV`: `production`
5. Deploy!

## 📝 Data Privacy

This application uses anonymized data for demonstration purposes. All patient and healthcare provider information has been de-identified.

## 📄 License

This project is licensed under the GNU License.

## 🙏 Acknowledgments

- Based on coursework from BBDD-ETSIT
- Realized for coursework for AIDM-ETSIT
- MongoDB Atlas for database hosting
- Render for application hosting

---

Made with ❤️ for pharmaceutical data management
