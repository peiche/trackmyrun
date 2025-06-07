# TrackMyRun

**TrackMyRun** is a comprehensive web application designed to help runners log, manage, and visualize their training data. Built with modern web technologies, it provides a fast and intuitive interface for tracking your progress and staying motivated.

## Features

- **Effortless Run Logging:** Easily record essential details for each run, including date, distance, duration, average pace, route notes, and more.
- **Detailed Run History:** Access a chronological list of all your recorded runs.
- **Performance Overview:** Get insights into your running performance over time, such as total distance, average pace trends, and cumulative duration.
- **User Authentication:** Securely manage your personal running data powered by Supabase Auth.
- **Intuitive User Interface:** A clean, responsive, and performant design for easy navigation and data entry.

## Technologies Used

- **Frontend:**
  - **React:** A JavaScript library for building user interfaces.
  - **Vite:** A fast build tool that provides an instant development server and bundles your code for production.
  - **TypeScript:** A superset of JavaScript that adds static types, enhancing code quality and maintainability.
  - **Tailwind CSS:** A utility-first CSS framework for rapidly building custom designs.
  - **Lucide Icons:** A collection of beautiful and customizable open-source icons.
  - **Recharts:** A composable charting library built with React and D3.
- **Backend & Database:**
  - **Supabase:** An open-source Firebase alternative providing a PostgreSQL database, authentication, instant APIs, and real-time subscriptions.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (LTS version recommended)
- **npm** (Node Package Manager, usually comes with Node.js) or **Yarn**

### Installation

1. **Clone the repository:**
   ```
   git clone https://github.com/peiche/trackmyrun.git
   cd trackmyrun
   ```
2. **Install the project dependencies:**
   ```
   npm install
   # OR
   yarn install
   ```
3. **Set up Supabase:**
   - **Create a Supabase Project:** If you don't have one, sign up at [Supabase](https://supabase.com/) and create a new project.
   - **Get your API Keys:** From your Supabase project settings, find your `Project URL` and `Anon Key`.
   - **Configure Environment Variables:** Create a `.env` file in the root of your `trackmyrun` directory with the following content:
      ```
      VITE_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
      VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
      ```
      (Replace `"YOUR_SUPABASE_PROJECT_URL"` and `"YOUR_SUPABASE_ANON_KEY"` with your actual Supabase credentials.)
   - **Database Schema:** You will need to set up the necessary tables and policies in your Supabase database. Refer to the project's `database/schema.sql` for the required SQL commands to set up your tables (e.g., `runs` table, `profiles` table).
4. **Run the development server:**
   ```
   npm run dev
   # OR
   yarn dev
   ```
   Once the server starts, the application will be accessible in your web browser, typically at `http://localhost:5173/` (Vite's default).

## Usage

- **Register or Log In:** Use the built-in authentication flow to create a new account or sign in with an existing one. All user data is managed by Supabase Auth.
- **Add a New Run**: Navigate to the "Add Run" page to input the details of your latest run. This data will be stored in your Supabase database.
- **View Your Runs:** Browse your complete run history on the main dashboard or a dedicated "My Runs" section.

## Contributing

I welcome contributions from the community! If you have suggestions for improvements, new features, or bug fixes, please feel free to contribute.

1. **Fork the Project**
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Don't forget to give the project a star if you find it useful!

## License

This project is distributed under the MIT License. See the LICENSE file in the repository for more details.

## Contact

For any questions or inquiries, please reach out via the GitHub issues page.

Project Link: https://github.com/peiche/trackmyrun