# OpenWrt Update Manager (OUM)

A web-based tool to manage OpenWrt package updates. This application allows you to connect to your OpenWrt router via SSH, view installed packages, check for updates, and perform upgrades directly from a modern dashboard.

## Features

-   **SSH Connection**: Securely connect to your router using IP, username, and password.
-   **Package Monitoring**: View a list of all installed packages.
-   **Update Checking**: Automatically check for available upgrades.
-   **Batch Upgrades**: Select multiple packages and upgrade them in one go.
-   **Dockerized**: Easy deployment using Docker.

## Screenshots

### Login Screen
![Login Screen](screenshots/login.png)

### Dashboard
![Dashboard](screenshots/dashboard.png)

## Docker Deployment (Recommended)

The application is fully Dockerized and available on Docker Hub.

### Prerequisites

-   Docker and Docker Compose installed on your machine.

### Quick Start

1.  Clone this repository or download the `docker-compose.yml` file.
2.  Run the following command in the directory containing `docker-compose.yml`:

    ```bash
    docker compose up
    ```

3.  Access the application:
    -   **Frontend**: [http://localhost:8080](http://localhost:8080)
    -   **Backend**: [http://localhost:3001](http://localhost:3001)

### Using Docker Hub Images Directly

You can also pull the images directly from Docker Hub:

```bash
docker pull hacksmith/oum-backend:latest
docker pull hacksmith/oum-frontend:latest
```

## Manual Development Setup

If you want to run the application locally without Docker:

### Backend

1.  Navigate to the `backend` directory.
2.  Install dependencies: `npm install`
3.  Start the server: `npm run dev`
4.  The server runs on port 3001.

### Frontend

1.  Navigate to the `frontend` directory.
2.  Install dependencies: `npm install`
3.  Start the development server: `npm run dev`
4.  Access the app at the URL provided by Vite (usually http://localhost:5173).
