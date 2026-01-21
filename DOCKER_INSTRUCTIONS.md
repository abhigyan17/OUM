# Docker Instructions

## Prerequisites
- Docker and Docker Compose installed on your machine.

## Running the Application

1.  Open a terminal in the project root.
2.  Run the following command to build and start the services:
    ```bash
    docker compose up --build
    ```
    (Note: If you have an older version of Docker, you might need `docker-compose up --build`)

3.  Access the application:
    - **Frontend**: [http://localhost:8080](http://localhost:8080)
    - **Backend API**: [http://localhost:3001](http://localhost:3001)

## Stopping the Application

Press `Ctrl+C` in the terminal or run:
```bash
docker compose down
```

## specific Notes
- The **Backend** is mapped to port `3001` on your host machine because the frontend currently expects the API at `http://localhost:3001/api`.
- The **Frontend** can be accessed at port `8080`.
