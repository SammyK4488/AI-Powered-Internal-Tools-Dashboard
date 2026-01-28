# AI-Powered Internal Tools Dashboard

## Overview

This project is an internal dashboard designed to automate and streamline manual workflows commonly found in online businesses.

The goal is to replace spreadsheet-heavy processes and manual reporting with a centralized, secure, and AI-assisted system.

---

## Problem

Many businesses rely on:

- Spreadsheets for internal tracking
- Manual data entry and updates
- Time-consuming reporting
- Reading and summarizing large amounts of information by hand

These processes are inefficient, error-prone, and difficult to scale.

---

## Solution

This dashboard provides:

- Secure user authentication
- A database-backed system for managing internal records
- An admin dashboard for viewing and updating data
- AI-powered summaries to reduce manual review and reporting time

This tool is designed to save teams **10–20 hours per week** by automating repetitive internal workflows.

---

## Tech Stack

- Backend: Node.js or AWS
- Frontend: React
- Database: PostgreSQL
- AI: OpenAI API
- Deployment: TBD

---

## Architecture Overview

This project is a backend-first internal tools dashboard designed to support workflow automation and AI-assisted reporting

- Backend
- Node.js + Express: Handles API routes, business logic, and integrations
- PostgreSQL (Supabase): Primary data store for users and records and Managed cloud Postgres with SSL-secured connections
- Environment-based configuration: Secrets and connection strings managed via .env

- Database
- Schema-driven design: SQL migrations stored in /schema and Explicit table definitions for users and records
- Connection pooling: Uses pg Pool for efficient query handling

- API Design
- Health and diagnostic endpoints for uptime monitoring
- Database test endpoint to verify live connectivity
- Designed for easy expansion into: Authentication, Admin dashboards, and AI-generated summaries

- Development Workflow
- Local development with Node’s built-in --watch mode
- Clean separation of client and server directories
- Production-ready structure with minimal dependencies

## Authorization

- Users can only CRUD their own records.

- Admins can update/delete any record.

## Status

This project is currently in early development. Core architecture and planning are complete, with implementation underway.

---

## Author

Built by Samuel Kleanthous
