# Rule Engine

A simple 3-tier rule engine application(Simple UI, API and Backend, Data) to determine
user eligibility based on attributes like age, department, income, spend etc.The system can use
Abstract Syntax Tree (AST) to represent conditional rules.

## Features

- create_rule: This function takes a string representing a rule and returns a Node object representing the corresponding AST.
- combine_rules(rules): This function takes a list of rule strings and combines them
into a single AST. The function returns the root node of the combined AST.
- evaluate_rule: This function takes a JSON representing the combined
rule's AST and a dictionary data containing attributes. The
function evaluates the rule against the provided data and return True if the user is
of that cohort based on the rule, False otherwise.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd rule-engine
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
MONGODB_URI=mongodb://localhost:27017/rule-engine
```

## Running the Application

1. Start MongoDB:
```bash
mongod
```

2. Start the application:
```bash
npm run dev
```

## API Endpoints

- POST `/rules`: Creates rules
- POST `/rules/combine`: Combines multiple rules
- POST `/evaluate`: Returns True if the user is of the given cohort based on the rule, False        otherwise.

## Design Choices

1. **Data Storage**: MongoDB was chosen for its flexibility with JSON-like documents and good support for time-series data.

2. **Architecture**:
   - Service-based architecture for separation of concerns
   - Express.js for API endpoints

## Testing

Run the tests using:
```bash
npx jest
```

## Dependencies

All dependencies can be installed via npm. Key dependencies include:
- express: Web framework
- mongoose: MongoDB ODM
- dotenv: Environment configuration
