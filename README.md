 🏫 Roomie Rooms – Campus Study Rooms Reservations

Roomie Rooms is a full-stack web app that lets students reserve and manage study rooms on campus, while staff can oversee room availability, blackout dates, and attendance reports. Built with **Next.js**, **Tailwind CSS**, and **Supabase**, the project streamlines campus room scheduling through a secure, role-based system.

---

## 🚀 Features

- 🔑 Authentication with Supabase (students & staff)
- 📅 View, book, and cancel room reservations
- 🧾 Staff dashboard for managing rooms, timeslots, and blackout dates
- 📊 Export reservations and attendance to CSV
- 💻 Responsive UI built with Tailwind CSS + HTMX
- 🌐 Deployed with Vercel + Supabase backend

---

## 🧱 Tech Stack

**Frontend:** Next.js 15, Tailwind CSS, HTMX  
**Backend:** Supabase (PostgreSQL + Auth + REST API)  
**Hosting:** Vercel (Frontend), Supabase Cloud (Backend)  
**Version Control:** Git + GitHub  
**Testing:** Pytest + Manual Cross-Browser Testing  

---

## 🗂️ Database Tables

- `Users` – student & staff profiles with roles  
- `Rooms` – room details (name, capacity, location)  
- `TimeSlots` – time blocks for reservations  
- `Reservations` – links users to rooms & timeslots  
- `Settings` – global app preferences & blackout dates  
