# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Access Monitor Suite backend application server** - a NestJS-based web accessibility monitoring and evaluation system. The application provides REST APIs for web accessibility evaluation using QualWeb, page monitoring, user management, and accessibility statement generation.

## Architecture

### Core System
- **Framework**: NestJS with TypeScript
- **Database**: MySQL with TypeORM
- **Authentication**: JWT-based with Passport strategies (local, admin, monitor, study)
- **Web Crawling**: Puppeteer with stealth plugin
- **Accessibility Engine**: QualWeb for WCAG evaluation
- **Logging**: Winston with daily rotating files
- **Process Management**: PM2 with cluster mode

### Key Components
- **Evaluation Module**: Core accessibility evaluation engine using QualWeb
- **Observatory Module**: Public accessibility monitoring dashboard
- **Accessibility Statement Module**: Automated accessibility statement generation
- **Crawler Module**: Web page crawling and discovery
- **Page/Website/Tag Modules**: Content organization and management
- **Auth Module**: Multi-tenant authentication system

### Database Architecture
- Database configuration loaded from `../monitor_db.json`
- Entity definitions in `*.entity.ts` files throughout modules
- TypeORM with synchronization disabled (manual migrations)

### Multi-Tenant Architecture
The application supports three namespaces via environment variables:
- `AMP`: Main monitoring platform
- `ADMIN`: Administrative interface  
- `USER`: User-specific functionality

## Development Commands

### Build & Development
```bash
npm run build          # Build the application
npm run start         # Start in production mode
npm run start:dev     # Start in watch mode for development
npm run start:debug   # Start with debug mode
```

### Testing
```bash
npm run test                    # Run all unit tests
npm run test:watch             # Run tests in watch mode
npm run test:cov               # Run tests with coverage
npm run test/govUser           # Run specific gov-user tests
npm run test:aStatement        # Run accessibility statement parser tests
```

### Code Quality
```bash
npm run lint           # Run ESLint with auto-fix
npm run format         # Format code with Prettier
```

### Database
```bash
npm run typeorm        # Run TypeORM CLI commands
```

## Production Deployment

The application uses PM2 for process management with cluster mode:
- **AMP namespace**: 2 instances
- **ADMIN namespace**: 3 instances  
- **USER namespace**: 3 instances

Start with: `pm2 start ecosystem.config.js`

## Key Configuration Files

- `ecosystem.config.js`: PM2 process configuration with environment variables
- `../monitor_db.json`: Database connection configuration (external)
- `public/crawlerConfig.json`: Web crawler configuration
- Log files: `action-log/` and `error-log/` directories

## Important Notes

- Database config is loaded from parent directory (`../monitor_db.json`)
- Application serves static files from `public/` directory
- Swagger API documentation available at `/api` endpoint
- Rate limiting enabled (1000 points per window)
- CORS enabled for all origins
- Security headers via Helmet middleware