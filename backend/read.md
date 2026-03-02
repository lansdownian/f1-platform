# Creating root level project and creating apps
poetry run django-admin startproject config . 
- for creating a project level config project in the root directory only and not inside another folder level 

poetry run python manage.py startapp f1 apps/core
- for creating django apps inside the apps/ folder 

# Database Setup 
brew install postgresql@14, 14 is the major version for postgresql 
ps aux | grep postmaster to checl which postgres is being used 
brew services start postgresql@14

brew services list - for seeing all services 
Name          Status  User        File
postgresql@14 started lansdownian ~/Library/LaunchAgents/homebrew.mxcl.postgresql@14.plist

postgresql also creates a postgres cluster 
it is done via initdb and brew runs it automatically 

brew services start postgresql@14
- this is for starting postgres server as it is independent of django 
- it loads cluster data, opens the port and listens for connections 

ps aux | grep postgres
this is for confirming 

# .env setup 
we need to import and load dotenv and os 
then use os.getenv in the DATABASES section inside settings.py 

# CLI
for now we are using poetry run python manage.py startapp/migrate/runserver/
later if we dockarise the application we can use docker compose commands to start the servers 

# frontend setup with vite : 
vite is a frontend build tool which replaces manual npm build setup 
vite only transforms what's needed rather than changing entire thing 
npm run dev - for starting frontend server 
⚡ Why Vite Is Better Than Create React App

Create React App:

Uses Webpack

Slow rebuilds

Hard to customize

Now largely deprecated

Vite:

Faster dev server

Simpler config

ESM-first

Smaller bundle sizes

Better DX (developer experience)

Modern industry standard.
flow : 
Browser
   ↓
Django route
   ↓
Inertia render()
   ↓
React page name
   ↓
Vite loads component
   ↓
Axios calls Ninja API
   ↓
Django ORM → Postgres

