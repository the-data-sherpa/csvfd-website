# Cool Springs VFD Website

This is the official website for the Cool Springs Volunteer Fire Department. Built with React, TypeScript, and Tailwind CSS.

## Features

- Modern, responsive design optimized for all devices
- Content Management System (CMS) for department members
- Google Authentication for secure member access
- Dynamic page creation and editing with rich text capabilities
- Call statistics tracking and visualization with Chart.js
- Interactive event calendar with FullCalendar integration
- Weather information display
- Live Facebook feed integration
- Booking calendar for facility reservations
- Volunteer sign-up system with automated confirmations
- Announcements management system
- Member application form with multi-step process
- Admin dashboard for site management
- SEO optimization for all pages

## Tech Stack

- React 18
- TypeScript
- Tailwind CSS
- Vite
- Supabase (Database and Authentication)
- CKEditor 5 (Rich Text Editing)
- FullCalendar (Event Calendar)
- Chart.js (Data Visualization)
- React Router DOM (Routing)
- Framer Motion (Animations)
- Google OAuth 2.0
- React Hot Toast (Notifications)
- Date-fns (Date Utilities)
- Radix UI (Accessible UI Components)
- Lucide React (Icons)
- Tailwind CSS Typography
- Google Maps API Integration

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `/src` - Source code
  - `/components` - Reusable React components
    - `/ui` - UI components
    - `/application-steps` - Application form steps
  - `/contexts` - React context providers
  - `/lib` - Utility functions and configurations
  - `/pages` - Page components
  - `/services` - API and service integrations
  - `/types` - TypeScript type definitions
  - `/styles` - CSS and style definitions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - See LICENSE file for details