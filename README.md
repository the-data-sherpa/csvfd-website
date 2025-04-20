# CSVFD Website

A modern web application for the Cool Springs Volunteer Fire Department, built with React, TypeScript, and Supabase.

## Features

- Member management system
- Event calendar
- Weather information
- Facebook feed integration
- Announcements display
- Call statistics
- Application form
- Admin dashboard

## Tech Stack

- Frontend: React with TypeScript
- Styling: Tailwind CSS
- State Management: React Context + Local State
- Backend: Supabase
- Authentication: Supabase Auth
- Forms: React Hook Form + Yup
- Maps: Google Maps API
- Weather: OpenWeatherMap API
- Social Media: Facebook Graph API

## Recent Updates

### Completed Enhancements
- ✅ UX-001: Added loading states and skeleton screens for all components
  - Implemented in WeatherInfo, FacebookFeed, AnnouncementsDisplay, CallStatistics
  - Added to AdminDashboard for user data and role updates
  - Enhanced ApplicationForm steps with loading states and validation indicators

### In Progress
- UX-002: Form validation with real-time feedback
- PERF-001: Code splitting and lazy loading
- SEC-001: Rate limiting for API endpoints

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Start development server: `npm run dev`

## Development

- Follow the enhancement plan in `plan.md`
- Use feature branches for new enhancements
- Follow the established coding standards
- Update documentation as needed

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request
4. Ensure all tests pass
5. Update documentation if needed

## License

MIT License - see LICENSE file for details