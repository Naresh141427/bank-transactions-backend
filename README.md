# Banking Backend API

A Node.js backend API for basic banking operations, including user management and money transfers, built with Express.js and MySQL.

## Features

- **User Management**: Retrieve user details including name and balance
- **Money Transfers**: Secure transfer of funds between users with transaction safety
- **Database Integration**: MySQL database with connection pooling
- **Error Handling**: Comprehensive error handling and validation
- **Concurrency Safety**: Deadlock handling for concurrent transactions

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **Database Driver**: mysql2
- **Environment Management**: dotenv

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd banking-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following environment variables:
   ```
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=your_database_name
   DB_PORT=3306
   PORT=5000
   ```

4. Set up the MySQL database:
   - Create a database with the name specified in `DB_NAME`
   - Create the required tables:

   ```sql
   CREATE TABLE users (
       id INT PRIMARY KEY AUTO_INCREMENT,
       name VARCHAR(255) NOT NULL,
       balance DECIMAL(10,2) NOT NULL DEFAULT 0.00
   );

   CREATE TABLE transactions (
       id INT PRIMARY KEY AUTO_INCREMENT,
       sender_id INT NOT NULL,
       receiver_id INT NOT NULL,
       amount DECIMAL(10,2) NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (sender_id) REFERENCES users(id),
       FOREIGN KEY (receiver_id) REFERENCES users(id)
   );
   ```

   - Insert some sample user data:

   ```sql
   INSERT INTO users (name, balance) VALUES
   ('Alice Johnson', 1000.00),
   ('Bob Smith', 500.00),
   ('Charlie Brown', 750.00);
   ```

## Usage

### Development

Start the development server with auto-reload:
```bash
npm run dev
```

### Production

Start the production server:
```bash
npm start
```

The server will start on the port specified in the `PORT` environment variable (default: 5000).

## API Endpoints

### Get User Details
- **URL**: `/psbank/user/:userId`
- **Method**: `GET`
- **Description**: Retrieve user information by user ID
- **Response**:
  ```json
  {
    "user": {
      "name": "Alice Johnson",
      "balance": 1000.00
    }
  }
  ```

### Transfer Money
- **URL**: `/psbank/transfer`
- **Method**: `POST`
- **Description**: Transfer money from one user to another
- **Request Body**:
  ```json
  {
    "senderId": 1,
    "receiverId": 2,
    "amount": 100.00
  }
  ```
- **Response**:
  ```json
  {
    "message": "Money transferred successfully"
  }
  ```

## API Response Codes

- `200`: Success
- `400`: Bad Request (invalid input, insufficient balance, etc.)
- `404`: User Not Found
- `500`: Internal Server Error
- `503`: Service Unavailable (persistent deadlocks)

## Project Structure

```
banking-backend/
├── db/
│   └── db.js              # Database connection and configuration
├── models/
│   └── user.model.js      # User data model functions
├── routes/
│   ├── user.routes.js     # User-related routes
│   └── transactions.routes.js  # Transaction routes
├── services/
│   ├── user.services.js   # User service logic
│   └── transaction.services.js # Transaction service logic
├── .env                   # Environment variables (not in repo)
├── .gitignore            # Git ignore rules
├── package.json          # Project dependencies and scripts
├── server.js             # Main application entry point
└── README.md             # This file
```

## Database Schema

### Users Table
- `id`: Primary key, auto-increment
- `name`: User's full name
- `balance`: User's account balance (decimal)

### Transactions Table
- `id`: Primary key, auto-increment
- `sender_id`: Foreign key to users table
- `receiver_id`: Foreign key to users table
- `amount`: Transfer amount (decimal)
- `created_at`: Timestamp of transaction

## Security Features

- **Transaction Safety**: All money transfers use database transactions to ensure atomicity
- **Deadlock Handling**: Automatic retry mechanism for database deadlocks
- **Input Validation**: Comprehensive validation of request data
- **Error Handling**: Proper error responses without exposing sensitive information

## Development Notes

- The application uses MySQL connection pooling for efficient database connections
- Environment variables are used for configuration to keep sensitive data secure
- The transfer functionality includes deadlock detection and retry logic for high concurrency scenarios
- All database operations use prepared statements to prevent SQL injection

## Testing

Currently, there are no automated tests configured. To add tests:

1. Install testing framework (e.g., Jest):
   ```bash
   npm install --save-dev jest supertest
   ```

2. Create test files and update package.json scripts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License