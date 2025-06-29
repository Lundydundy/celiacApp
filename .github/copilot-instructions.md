<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Celiac Tax App - Copilot Instructions

This is a full-stack TypeScript application for helping celiac patients track gluten-free food expenses for tax deductions.

## Project Context
- **Purpose**: Help people with celiac disease track incremental costs of gluten-free foods for CRA tax filing
- **Backend**: Node.js + Express + Prisma + SQLite
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Database**: SQLite with Prisma ORM

## Code Style Guidelines
- Use TypeScript for all new code
- Follow React functional components with hooks
- Use Tailwind CSS for styling
- Implement proper error handling
- Add TypeScript interfaces for all data models
- Use async/await for asynchronous operations

## Key Business Logic
- Incremental cost = gluten-free price - regular price
- Tax calculations follow CRA guidelines for medical expenses
- Users must have medical certification to claim expenses
- Products must be specifically gluten-free to be eligible

## API Patterns
- RESTful endpoints with consistent response formats
- JWT authentication for protected routes
- Proper HTTP status codes
- Input validation and sanitization

## Database Schema
- Users, Products, Receipts, MedicalCertifications, TaxPeriods
- Use Prisma for database operations
- Follow proper relationships and constraints

## Frontend Components
- Create reusable UI components
- Use React Router for navigation
- Implement proper state management
- Handle loading and error states

When generating code, prioritize:
1. Type safety with TypeScript
2. User experience and accessibility
3. Tax calculation accuracy
4. Data validation and security
5. Clean, maintainable code structure
