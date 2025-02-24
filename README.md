# Cool Springs VFD Website

This is the official website for the Cool Springs Volunteer Fire Department. Built with React, TypeScript, and Tailwind CSS.

## Features

- Modern, responsive design
- Content Management System (CMS) for department members
- Google Authentication for member access
- Dynamic page creation and editing
- Rich text editing capabilities
- SEO optimization for all pages

## Tech Stack

- React 18
- TypeScript
- Tailwind CSS
- Vite
- Supabase
- CKEditor 5
- Google OAuth 2.0

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
  - `/contexts` - React context providers
  - `/lib` - Utility functions and configurations
  - `/pages` - Page components
  - `/types` - TypeScript type definitions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - See LICENSE file for details