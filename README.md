
# InnovateSphere | Orange Edition

This is a NextJS + Firebase application built in Firebase Studio.

## 🛠 Web vs Android (Important!)
Agar aap tutorials dekh rahe hain toh dhyan dein:
- **Android**: `google-services.json` use karta hai.
- **Web (This App)**: Saari configuration `src/firebase/config.ts` mein hoti hai. Aapko is project mein `.json` file dhundne ki zaroorat nahi hai.

## 🚀 Mobile Posting & Deployment Guide (Live kaise karein?)

### 1. GitHub par code bhejein (Sync)
Terminal ki zaroorat nahi hai. Mobile par ye karein:
- **Left Sidebar**: 3rd icon par click karein (Source Control - branch jaisa dikhta hai).
- **Message**: Box mein "Update app" likhein.
- **Commit & Push**: 'Commit' dabayein, phir teen dots (...) par click karke 'Push' select karein.
- **Check**: Apne GitHub account par jaakar dekhein, code wahan aa jayega.

### 2. Firebase App Hosting Setup
- [Firebase Console](https://console.firebase.google.com/) mein jayein.
- **Build > App Hosting** select karein.
- **Get Started** par click karke apni `studio` repository ko connect karein.
- Har baar jab aap IDE se "Push" karenge, aapki site automatically update ho jayegi!

## 🛠 Features
- **Innovation Feed**: Share and discover ideas.
- **AI Analysis**: Get insights on your projects.
- **Real-time Hub**: Chat with other innovators.
- **Safe Environment**: Built-in reporting and moderation.

## 📱 Tech Stack
- Next.js 15 (App Router)
- Firebase (Auth, Firestore, Hosting)
- Tailwind CSS & ShadCN UI
