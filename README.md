# Surveyor - Generalized Multi-Stakeholder Survey Platform

A comprehensive Next.js-based survey platform designed for multi-stakeholder assessments with real-time analytics, benchmarking, and detailed reporting capabilities.

## Overview

Surveyor is a flexible, scalable survey platform that enables organizations to conduct comprehensive assessments across different stakeholder groups. The platform provides sophisticated analytics, benchmarking capabilities, and detailed reporting to help organizations understand their current state and identify areas for improvement.

### Key Features

- **Multi-Stakeholder Surveys**: Support for different stakeholder types (CEO, Tech Lead, Staff, Board Members, etc.)
- **Dynamic Survey Engine**: Flexible survey schema system supporting various question types
- **Real-time Analytics**: Live dashboard with comprehensive metrics and visualizations
- **Benchmarking**: Compare results against peer organizations and industry standards
- **Detailed Reporting**: Export capabilities with PDF reports and data visualization
- **Admin Dashboard**: Complete administrative interface for managing surveys and responses
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS
- **TypeScript**: Full type safety throughout the application

## Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **Recharts**: Data visualization library
- **React Hook Form**: Form management with validation
- **Zod**: Runtime type validation

### Backend & Data
- **Next.js API Routes**: Serverless API endpoints
- **Vercel Blob**: File storage for production
- **Local File System**: Development data storage
- **NextAuth.js**: Authentication system

### Development & Testing
- **Biome**: Code formatting and linting
- **Vitest**: Unit testing framework
- **Testing Library**: React component testing
- **TypeScript**: Static type checking

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/surveyor.git
cd surveyor
```

2. Install dependencies:
```bash
npm install
```

3. Initialize sample data:
```bash
npm run init-data
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Database/Storage (for production)
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# Optional: Custom configuration
SURVEY_ADMIN_EMAIL=admin@example.com
```

## Project Structure

```
surveyor/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── survey/            # Survey interface
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── admin/             # Admin-specific components
│   ├── survey/            # Survey components
│   └── ui/                # Reusable UI components
├── lib/                   # Utility libraries
│   ├── analytics-generator.ts
│   ├── data-validator.ts
│   ├── sample-data-generator.ts
│   ├── storage.ts
│   ├── survey-engine.ts
│   └── types.ts
├── data/                  # Data storage (development)
│   ├── schemas/           # Survey schemas
│   ├── responses/         # Survey responses
│   └── results/           # Calculated results
├── scripts/               # Utility scripts
├── docs/                  # Documentation
└── tests/                 # Test files
```

## Core Features

### Survey System

The platform supports flexible survey schemas with the following question types:
- **Multiple Choice**: Single or multiple selection
- **Likert Scale**: 1-5 rating scales
- **Text Input**: Short and long text responses
- **Number Input**: Numeric responses
- **Boolean**: Yes/no questions

### Analytics & Reporting

- **Real-time Dashboard**: Live metrics and visualizations
- **Benchmarking**: Compare against industry standards
- **Stakeholder Analysis**: Breakdown by respondent type
- **Domain Analysis**: Category-based scoring
- **Export Capabilities**: PDF reports and CSV data export

### Multi-Stakeholder Support

Configure surveys for different stakeholder groups:
- **CEO/Executive**: Strategic perspective
- **Technical Lead**: Technical implementation view
- **Staff**: Operational perspective
- **Board Members**: Governance oversight
- **External Consultants**: Expert assessment

## API Documentation

### Survey API
- `GET /api/surveys` - List all surveys
- `GET /api/surveys/[id]` - Get survey details
- `POST /api/surveys/[id]/responses` - Submit survey response
- `GET /api/surveys/[id]/results` - Get survey results

### Admin API
- `GET /api/admin/responses` - List all responses
- `GET /api/admin/analytics` - Get analytics data
- `POST /api/admin/surveys` - Create new survey

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run Biome linting
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Biome
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage
- `npm run init-data` - Initialize sample data

### Testing

The project uses Vitest for unit testing and React Testing Library for component testing:

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Code Quality

The project uses Biome for code formatting and linting:

```bash
# Check code quality
npm run lint

# Fix issues automatically
npm run lint:fix

# Format code
npm run format
```

## Sample Data

The platform includes a comprehensive sample data system for development and testing:

### Organizations
- 8 realistic organization profiles across different sectors
- Various sizes (small, medium, large)
- Different maturity levels (Building, Emerging, Thriving)

### Survey Schemas
- **Jim Joseph Technology Maturity Assessment**: 8 questions across 5 domains
- **Digital Transformation Readiness**: 11 questions across 5 domains

### Generated Data
- Complete survey responses from all stakeholder types
- Calculated results with maturity level assessments
- Benchmark data and comparative analytics
- Detailed organization analyses with recommendations

## Deployment

### PM2 Local Deployment (Recommended for Local Development)

PM2 provides stable, persistent local deployment that survives terminal sessions and provides robust process management.

#### Quick Start with PM2

```bash
# Install PM2 globally (if not already installed)
npm install -g pm2

# Start development server
./pm2-scripts/start-dev.sh

# Start production server
./pm2-scripts/start-prod.sh

# Access application at http://localhost:3002
```

#### PM2 Management Commands

```bash
# Monitor application status
./pm2-scripts/monitor.sh

# View application logs
./pm2-scripts/logs.sh --follow

# Restart application
./pm2-scripts/restart.sh

# Stop application
./pm2-scripts/stop.sh
```

#### PM2 Features

- **Persistent Deployment**: Survives terminal sessions and system restarts
- **Auto-restart**: Automatic restart on crashes or memory limits
- **Process Monitoring**: Real-time monitoring with PM2 dashboard
- **Log Management**: Centralized logging with rotation
- **Zero Downtime**: Graceful restarts without service interruption
- **Health Checks**: Automatic health monitoring and recovery

For detailed PM2 configuration and troubleshooting, see [PM2_DEPLOYMENT_GUIDE.md](PM2_DEPLOYMENT_GUIDE.md).

### Vercel (Recommended for Production)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy the `.next` folder to your hosting provider

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Use Biome for code formatting
- Write tests for new features
- Update documentation for significant changes
- Follow the existing code structure and patterns

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Acknowledgments

- Built with Next.js and modern React patterns
- Inspired by multi-stakeholder assessment methodologies
- Designed for nonprofit and organizational assessment use cases

---

**Version**: 1.0.0  
**Author**: Claude PM Framework  
**Last Updated**: July 2025