# Ling Lenz 🍎

**An AI-Powered Dashboard for Private Language Tutors.**

Ling Lenz is a specialized CRM and classroom management tool designed for independent language teachers. It streamlines the workflow of managing students, tracking mistakes during live sessions, and automatically generating personalized homework assignments.

## 🚀 Key Features

* **Student Management:** Track students, languages, and proficiency levels.
* **Live Session Tracking:** Log mistakes in real-time during 1-on-1 classes.
* **AI Homework Generation:** Automatically convert session mistakes into "Fix the Sentence" exercises.
* **Public Student Portal:** Generate unique, secure links for students to complete homework without logging in.
* **Progress Tracking:** Visual badges for "Needs Review" (Teacher) and "Homework Sent" (Student).

## 🛠️ Tech Stack

* **Frontend:** React, Vite, Tailwind CSS, Lucide React
* **Backend / Database:** Supabase (PostgreSQL, Auth, Realtime)
* **State Management:** React Context API & Hooks
* **Routing:** React Router DOM

## 🚦 Getting Started

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/gkalvarog/linglenz.git](https://github.com/gkalvarog/linglenz.git)
    cd linglenz
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_key
    ```

4.  **Run the App**
    ```bash
    npm run dev
    ```

## 📸 Project Status

* [x] Teacher Dashboard (CRUD Students)
* [x] Live Class Session Interface
* [ ] Embedded Video for Videoconference
* [ ] AI Powered Listening Feature
* [x] Mistake Logging System
* [ ] AI Templates for Methodological Application
* [x] Homework Generator & Public Student Link
* [ ] Student Analytics & Charts (Coming Soon)
* [ ] Teacher Notifications (Coming Soon)

---
*Built by Alvaro*
