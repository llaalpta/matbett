# 🐳 Docker Setup para MatBett Backend

## 📋 Requisitos Previos

- Docker Desktop instalado y corriendo
- WSL2 configurado (ya lo tienes)
- Puertos 5432 y 5050 libres

## 🚀 Comandos Principales

### Iniciar PostgreSQL (solo DB)

```bash
docker-compose up -d
```

### Iniciar PostgreSQL + pgAdmin (administración visual)

```bash
docker-compose --profile tools up -d
```

### Ver logs

```bash
# Todos los servicios
docker-compose logs -f

# Solo PostgreSQL
docker-compose logs -f postgres

# Solo pgAdmin
docker-compose logs -f pgadmin
```

### Detener servicios

```bash
docker-compose down
```

### Detener y eliminar volúmenes (CUIDADO: borra todos los datos)

```bash
docker-compose down -v
```

### Reiniciar servicios

```bash
docker-compose restart
```

### Ver estado de servicios

```bash
docker-compose ps
```

## 🔍 Acceso a Servicios

### PostgreSQL

- **Host**: `localhost`
- **Puerto**: `5432`
- **Base de datos**: `matbett_db`
- **Usuario**: `matbett_user`
- **Contraseña**: `matbett_password_dev`

**Connection String**:

```
postgresql://matbett_user:matbett_password_dev@localhost:5432/matbett_db
```

### pgAdmin (opcional)

- **URL**: http://localhost:5050
- **Email**: admin@matbett.local
- **Password**: admin

#### Configurar conexión en pgAdmin:

1. Abrir http://localhost:5050
2. Click derecho en "Servers" → "Register" → "Server"
3. **General Tab**:
   - Name: `MatBett Local`
4. **Connection Tab**:
   - Host: `postgres` (nombre del servicio Docker)
   - Port: `5432`
   - Database: `matbett_db`
   - Username: `matbett_user`
   - Password: `matbett_password_dev`
   - Save password: ✓

## 🧪 Verificar Conexión desde WSL2

### Usando psql (si está instalado)

```bash
psql postgresql://matbett_user:matbett_password_dev@localhost:5432/matbett_db -c "SELECT version();"
```

### Usando Docker exec

```bash
docker exec -it matbett-postgres psql -U matbett_user -d matbett_db -c "SELECT version();"
```

### Test de conexión simple

```bash
docker exec -it matbett-postgres pg_isready -U matbett_user -d matbett_db
```

## 🛠️ Comandos Útiles

### Acceder a terminal PostgreSQL

```bash
docker exec -it matbett-postgres psql -U matbett_user -d matbett_db
```

### Backup de la base de datos

```bash
docker exec -t matbett-postgres pg_dump -U matbett_user matbett_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar backup

```bash
docker exec -i matbett-postgres psql -U matbett_user -d matbett_db < backup.sql
```

### Ver tablas desde terminal

```bash
docker exec -it matbett-postgres psql -U matbett_user -d matbett_db -c "\dt"
```

### Reset completo (elimina todo y crea DB limpia)

```bash
docker-compose down -v
docker-compose up -d
```

## ⚠️ Troubleshooting

### Puerto 5432 ya está en uso

```bash
# Ver qué está usando el puerto
sudo lsof -i :5432

# O en Windows
netstat -ano | findstr :5432

# Matar proceso o cambiar puerto en docker-compose.yml
```

### Contenedor no inicia

```bash
# Ver logs detallados
docker-compose logs postgres

# Verificar que Docker Desktop está corriendo
docker ps
```

### No se puede conectar desde WSL2

```bash
# Verificar que el contenedor está corriendo
docker ps | grep postgres

# Verificar que el puerto está expuesto
docker port matbett-postgres

# Ping al contenedor
docker exec matbett-postgres ping -c 3 localhost
```

### Credenciales incorrectas

```bash
# Las credenciales están en docker-compose.yml
# Si cambias las credenciales, debes recrear el volumen:
docker-compose down -v
docker-compose up -d
```

## 📝 Notas de Desarrollo

- Los datos persisten en volumen Docker `postgres_data`
- Cambios en `docker-compose.yml` requieren `docker-compose down && docker-compose up -d`
- pgAdmin solo se levanta con `--profile tools` para no consumir recursos innecesarios
- En producción (Railway), no necesitarás Docker - Railway provee PostgreSQL managed
