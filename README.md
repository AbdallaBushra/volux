<p align="center">
  <img src="src/assets/volux-logo2.png" alt="Volux Logo" width="220" />
</p>

<h1 align="center">Volux</h1>

<p align="center">
  <strong>The first Sudanese digital volunteering platform built to connect volunteers, organizations, teams, and administrators in one trusted ecosystem.</strong>
</p>

<p align="center">
  <a href="https://volux.live"><strong>volux.live</strong></a>
</p>

---

## Overview

Volux is a web-based volunteering platform designed for Sudan. It brings volunteers, registered organizations, volunteer teams, and platform administrators into one organized digital space where volunteering opportunities can be published, discovered, managed, completed, and verified.

The platform was created to make volunteering easier to access, easier to manage, and easier to document. Instead of relying on scattered announcements, manual follow-ups, and untracked participation, Volux provides a structured workflow for registration, approval, opportunity publishing, applications, completion tracking, rewards, certificates, and administrative oversight.

Volux is positioned as the first Sudanese digital platform dedicated to organizing volunteering through a full online system.

## Live Website

- Website: https://volux.live
- Repository: https://github.com/AbdallaBushra/volux
- Firebase project: `volux-db1`

## Project Goals

- Centralize volunteering opportunities in Sudan.
- Help volunteers find opportunities that match their skills and location.
- Give organizations and volunteer teams a reliable way to publish and manage opportunities.
- Document volunteer participation through hours, points, badges, levels, and certificates.
- Support administrative review, approval, reporting, and quality control.
- Encourage a culture of transparent, measurable, and trusted volunteering.

## User Roles

### Volunteers

Volunteers can create an account, browse available opportunities, apply for suitable opportunities, track their participation history, collect points, earn badges, download certificates, and view their ranking on the leaderboard.

### Organizations

Organizations can register institutional accounts, submit license and contact details, wait for admin approval, publish volunteering opportunities, manage applicants, accept or reject applications, complete opportunities, and document volunteer participation.

### Volunteer Teams

Volunteer teams can register team profiles, define their fields of work, publish opportunities within their approved scope, manage volunteers, and track team activity.

### Administrators

Administrators manage users, organizations, teams, opportunities, pending registrations, reports, complaints, platform statistics, and system settings through a dedicated admin dashboard.

## Core Features

- Volunteer, organization, team, and admin authentication.
- Arabic and English language support.
- Role-based routing and protected pages.
- Email verification flow.
- Admin approval workflow for organizations and teams.
- Organization license expiry validation during registration.
- Public opportunities page with search and details.
- Opportunity creation with Arabic and English content.
- Field and virtual volunteering opportunity types.
- State, location, date, duration, hours, and volunteer count fields.
- Volunteer applications and application tracking.
- Applicant approval and rejection by organizations or teams.
- Opportunity completion workflow.
- Automatic volunteer points calculation based on completed hours.
- Volunteer levels, badges, and leaderboard.
- PDF certificate generation.
- In-app notifications.
- Complaint and reporting system.
- Admin reports and data export.
- Firebase Authentication, Firestore, Storage, Hosting, and Functions integration.

## Brand Assets

The official Volux logo is included in the project:

<p align="center">
  <img src="src/assets/volux-logo2.png" alt="Volux Logo" width="260" />
</p>

Important visual assets are stored in:

- `src/assets/volux-logo.png`
- `src/assets/volux-logo2.png`
- `src/assets/volunteer.jpg`
- `public/images/`
- `public/icons/`
- `public/badges/`
- `public/levels/`

## Application Routes

| Route | Description |
| --- | --- |
| `/` | Home page and platform introduction |
| `/about` | About Volux |
| `/opportunities` | Public volunteering opportunities |
| `/leaderboard` | Volunteer leaderboard |
| `/register` | Volunteer registration |
| `/institution-register` | Organization registration |
| `/team-register` | Volunteer team registration |
| `/login` | Volunteer login |
| `/institution-login` | Organization login |
| `/team-login` | Team login |
| `/admin-login` | Admin login |
| `/profile` | Volunteer profile |
| `/institution-profile` | Organization profile |
| `/team-profile` | Team profile |
| `/opportunities-management` | Opportunity management for organizations and teams |
| `/admin/dashboard` | Admin dashboard |
| `/admin/users` | User management |
| `/admin/organizations` | Organization management |
| `/admin/teams` | Team management |
| `/admin/opportunities` | Opportunity management |
| `/admin/pending-registrations` | Pending registration review |
| `/admin/reports` | Reports and analytics |
| `/admin/settings` | Admin settings |
| `/faq` | FAQ page |
| `/guidelines` | Platform guidelines |
| `/privacy` | Privacy information |
| `/terms` | Terms and conditions |

## Gamification System

Volux uses a gamification model to recognize and motivate volunteers.

### Points

- Each completed volunteering hour gives the volunteer `+2` points.
- Points are added after an opportunity is completed and participation is verified.

### Levels

| Level | Required Points |
| --- | --- |
| Bronze | 0 - 199 |
| Silver | 200 - 599 |
| Gold | 600 - 1199 |
| Platinum | 1200+ |

### Badges

- `First Opportunity`: awarded after the first completed opportunity.
- `Active Volunteer`: awarded after completing 3 opportunities.
- `Opportunity Finisher`: awarded after completing 10 opportunities.
- `Impact Maker`: awarded after reaching 500 points.
- `Trusted Volunteer`: awarded after completing 15 opportunities.
- `Elite Member`: awarded after reaching 1000 points.

## Technology Stack

### Frontend

- React 19
- React Router
- React Icons
- Chart.js
- Recharts
- i18next
- react-i18next
- CSS stylesheets

### Backend and Cloud

- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase Hosting
- Firebase Functions
- Express.js
- PDFKit

### Development Tools

- Create React App
- react-scripts
- npm
- TypeScript for Firebase Functions and selected API files
- Firestore rules tests

## Project Structure

```text
volux/
├── public/
│   ├── images/
│   ├── icons/
│   ├── badges/
│   └── levels/
├── src/
│   ├── admin/
│   ├── api/
│   ├── assets/
│   ├── auth/
│   ├── components/
│   ├── constants/
│   ├── context/
│   ├── database/
│   ├── firebase/
│   ├── gamification/
│   ├── i18n/
│   ├── storage/
│   └── styles/
├── functions/
│   ├── src/
│   ├── tests/
│   └── scripts/
├── server/
├── dataconnect/
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
└── package.json
```

## Getting Started

### Requirements

- Node.js
- npm
- Firebase project
- Firebase Email/Password authentication enabled
- Firestore and Storage configured with the project rules

### Install Dependencies

```bash
npm install
```

### Run the Frontend

```bash
npm start
```

Open the app at:

```text
http://localhost:3000
```

### Build for Production

```bash
npm run build
```

The production build is generated in:

```text
build/
```

## Express Backend

The `server/` directory contains a small Express backend used for backend utilities such as certificate generation.

```bash
cd server
npm install
npm start
```

Default backend URL:

```text
http://localhost:5000
```

Available certificate endpoint:

```text
GET /api/certificates/generate
```

## Firebase Functions

The `functions/` directory contains Firebase Cloud Functions code, Firestore rules tests, and utility scripts.

```bash
cd functions
npm install
npm run build
```

Run Firestore rules tests:

```bash
npm run test:rules
```

## Firebase Setup

Firebase configuration is located in:

```text
src/firebase/firebase.js
```

The project uses:

- Authentication
- Firestore
- Storage
- Hosting
- Functions

Security notes:

- Firebase web configuration is public by design, but it must be protected with proper Firestore and Storage security rules.
- Do not commit service account files, private keys, or secret environment files.
- `node_modules/`, `build/`, `.firebase/`, temporary files, and local project folders are ignored by `.gitignore`.

## Deployment

Official domain:

```text
https://volux.live
```

Firebase Hosting deployment flow:

```bash
npm run build
firebase deploy
```

The hosting configuration in `firebase.json` serves the production app from:

```text
build/
```

## Included Documentation

The repository also includes supporting project notes:

- `FIREBASE_STRUCTURE.md`
- `gamification_rules.md`
- `CHANGES.md`
- `README_UPDATES.md`

## Repository Scope

This repository is intended to contain the Volux project only. The following local folders are ignored and are not part of this repository:

- `company_agent/`
- `personal-site/`
- `power-plus/`
- `node_modules/`
- `build/`
- `.firebase/`
- `tmp/`

## Ownership

Volux is a Sudanese volunteering platform developed to organize and improve digital volunteering workflows in Sudan. All branding, source code, documentation, and project assets belong to the Volux project owner unless stated otherwise.
