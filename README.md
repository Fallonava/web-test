# 🚀 n8n on Railway

Deploy your own **n8n automation server** easily on [Railway.app](https://railway.app).

## 🧩 Quick Deploy

1. Upload this folder to your GitHub repo.
2. Go to [Railway.app](https://railway.app) → “New Project” → “Deploy from GitHub”.
3. Connect this repository.
4. Add PostgreSQL plugin in Railway.
5. Wait until the deploy finishes.

Then open your app URL and log in using:
- **Username:** `admin`
- **Password:** `rahasia123`

---

### ⚙️ Environment Variables

| Key | Value |
|------|--------|
| N8N_BASIC_AUTH_ACTIVE | true |
| N8N_BASIC_AUTH_USER | admin |
| N8N_BASIC_AUTH_PASSWORD | rahasia123 |
| GENERIC_TIMEZONE | Asia/Jakarta |
| WEBHOOK_URL | https://${RAILWAY_STATIC_URL}/ |
| N8N_ENCRYPTION_KEY | your-generated-key |
| DB_TYPE | postgresdb |
| DB_POSTGRESDB_HOST | ${{PostgreSQL.HOST}} |
| DB_POSTGRESDB_PORT | ${{PostgreSQL.PORT}} |
| DB_POSTGRESDB_DATABASE | ${{PostgreSQL.DATABASE}} |
| DB_POSTGRESDB_USER | ${{PostgreSQL.USER}} |
| DB_POSTGRESDB_PASSWORD | ${{PostgreSQL.PASSWORD}} |

---

### 🧠 Notes
- PostgreSQL keeps your workflows persistent.
- Change your login password after first login.
- Set `N8N_ENCRYPTION_KEY` securely before deployment.
