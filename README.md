# DevOS Hub

DevOS Project Context

I'm building a full-stack DevOS (Developer Operating System) in Replit. It is a productivity dashboard for developers with multiple modules like Notes, Learning, Coding Profiles, Projects, Jobs, Resume, AI Prompts, Calendar, Goals, Analytics, Focus Timer, Settings, etc.

The project already has a working frontend and backend. I do not want a redesign. I only want improvements, bug fixes, CRUD operations, API fixes, and better UX while keeping the existing black modern UI.

Current Stack

 Frontend: React + TypeScript

 Backend: Node/Express

 Database: Live database (no hardcoded data)

 Authentication already exists

 Everything should remain connected to the backend.

Major Features Already Present

 Dashboard

 Notes

 Learning Hub

 Coding Profiles

 Projects

 Job Tracker

 Resume

 AI Prompts

 Calendar

 Goals

 Habits

 Focus Timer

 Analytics

 Settings

 Network

 Dev Tools

Main Issues To Fix

Notes

Problems

 Cannot delete folders.

 Cannot edit folders.

 Confusing hierarchy.

 Clicking one note sometimes opens another.

 Subject/folder selection is confusing.

 No edit note.

 No delete note.

Need hierarchy

Subject

→ Folder

→ Note

Need

 Create

 Edit

 Delete

 Rename

 Move note

 Duplicate note

 Markdown

 Autosave

Learning Hub

Organize into

Subject

→ Folder

→ Resource

Resources

 Youtube

 Docs

 PDF

 Course

 GitHub

Need

 Edit

 Delete

 Favorite

 Progress

 Completed

Coding Profiles

Need proper fetching.

Leetcode

 Rating

 Ranking

 Solved

 Easy

 Medium

 Hard

 Contest Rating

 Contest History

Codeforces

Need

 Solved count

 Rating

 Max Rating

 Rank

 Contribution

 Last Contest

CodeChef

Currently doesn't fetch.

Need

 Rating

 Stars

 Solved

 Global Rank

 Country Rank

 Contest History

Also

Github

Need

 Followers

 Following

 Stars

 Contributions

 Activity Graph

 Languages

Also

Hackerrank

GeeksforGeeks

AtCoder

Need proper fetching.

Replace profile pictures with official platform logos.

Example

Leetcode logo

Github logo

Codeforces logo

CodeChef logo

Hackerrank logo

AtCoder logo

GeeksforGeeks logo

Improve DevOS ranking calculation.

Projects

Problems

Cannot add links.

Description not editable.

Planning not editable.

Delete task missing.

Progress bar broken.

Need

Github

Frontend

Backend

Database

Deployment

Figma

Documentation

Need

 Edit

 Delete

 Progress

 Drag tasks

 Kanban

Progress should calculate automatically.

Job Tracker

Need

Company logo

Application link

Pipeline

Wishlist

↓

Applied

↓

OA

↓

Interview

↓

HR

↓

Offer

↓

Rejected

Need progress bar.

Resume

Current page mostly static.

Need

 Upload resume

 Multiple resumes

 Resume dropdown

 Rename

 Delete

 ATS Score

 AI Analysis

 Missing keywords

 Suggestions

 Tailored Resume

 Resume version history

AI Prompts

Need logos beside every AI.

ChatGPT

Claude

Gemini

Cursor

Copilot

Perplexity

DeepSeek

Le Chat

Grok

Need

 Categories

 Search

 Favorite

 Duplicate

 Delete

 Usage Counter

Dev Tools

Current integrations use API Keys.

Need Email-based connections wherever supported.

Need

Github

Vercel

Netlify

Railway

Render

Supabase

Cloudinary

Docker Hub

MongoDB Atlas

Firebase

VS Code Integration

Need button

Open in VS Code

Launch VS Code

Open Current Project

Network

Need

Github

LinkedIn

Twitter/X

Instagram

Reddit

Medium

Dev.to

Hashnode

Portfolio

Need

Followers

Following

Posts

Bio

Sync

Proper fetching.

Calendar

Need auto sync from

Projects

Coding Contests

Learning

Goals

Jobs

Deadlines

Focus Sessions

Need

Edit

Delete

Drag & Drop

Month

Week

Agenda

Goals

Need categories

Academic

Coding

DSA

Development

Reading

Exercise

Custom

Need

Daily

Weekly

Monthly

Progress

Progress Bar

Edit

Delete

Reorder

Focus Timer

Need

Edit

Delete

Rename

Notes

Tags

Pomodoro

Stopwatch

Countdown

Distraction Counter

Daily Summary

Weekly Summary

Analytics

Current graphs broken.

Need

Daily Bar Chart

Hours

Coding

Study

Projects

Subjects

Focus

Weekly

Monthly

Heatmap

Pie Charts

Graphs should work.

Settings

Need

Light Theme

Dark Theme

System Theme

Accent Colors

Profile

Account

Notifications

Privacy

Backup

Export

Import

Connected Devices

Login

Logout

Delete Account

Global Improvements

Everything should support

Create

Edit

Delete

Search

Sort

Filter

Confirmation before delete

Loading

Empty State

Error State

Toast Messages

Real backend.

No hardcoded values.

Every CRUD operation should work.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1bb0af76-ad00-45ba-8543-0f76e4ce7d84).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
