# Backend Docker Setup

Local infrastructure guide for `apps/backend`.

## Purpose

Run PostgreSQL locally for development and Prisma migrations.

## Prerequisites

- Docker Desktop running
- Ports `5432` and `5050` available

## Commands

```bash
# Start PostgreSQL only
pnpm docker:up

# Stop containers
pnpm docker:down

# Destroy containers + volumes (data loss)
pnpm docker:down -v
```

If you use compose directly:

```bash
docker-compose up -d
docker-compose down
docker-compose logs -f postgres
```

## Default Local Connection

- Host: `localhost`
- Port: `5432`
- Database: `matbett_db`
- User: `matbett_user`
- Password: `matbett_password_dev`

Connection string:

```text
postgresql://matbett_user:matbett_password_dev@localhost:5432/matbett_db
```
