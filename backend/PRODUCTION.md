<!-- backend PRODUCTION>md -->

# Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables
- [ ] Copy `.env.production` and fill in all values
- [ ] Generate strong secrets using: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database URL
- [ ] Set production frontend URL with HTTPS

### 2. Database
- [ ] Ensure PostgreSQL is running
- [ ] Run migrations: `npx sequelize-cli db:migrate`
- [ ] Create initial admin user (see below)

### 3. Security
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS with production domain only
- [ ] Review rate limiting settings
- [ ] Enable helmet CSP in production
- [ ] Rotate all secrets from development

### 4. File Storage
- [ ] Configure AWS S3 with production bucket
- [ ] Set proper IAM permissions
- [ ] Enable bucket versioning
- [ ] Configure lifecycle policies

### 5. Monitoring
- [ ] Set up application monitoring (e.g., Sentry)
- [ ] Configure log aggregation
- [ ] Set up uptime monitoring
- [ ] Configure database backups

---

## Deployment Steps

### Step 1: Prepare Application
```bash
# Install dependencies
npm ci --production

# Run migrations
npx sequelize-cli db:migrate

# Verify database connection
node -e "const { connectDB } = require('./src/config/database'); connectDB().then(() => console.log('✅ Connected')).catch(err => console.error('❌', err));"
```

### Step 2: Create Initial Admin User
```bash
# Start Node REPL
node

# In REPL, run:
const { User } = require('./src/models');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('YOUR_SECURE_PASSWORD', salt);
  
  const admin = await User.create({
    email: 'admin@yourdomain.com',
    password: hashedPassword,
    role: 'admin',
    isActive: true
  });
  
  console.log('✅ Admin user created:', admin.email);
}

createAdmin().then(() => process.exit(0));
```

### Step 3: Start Application
```bash
# Production start
NODE_ENV=production npm start

# Or with PM2 (recommended)
pm2 start index.js --name umhw-backend --env production
pm2 save
pm2 startup
```

---

## Platform-Specific Deployment

### Heroku
```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret
heroku config:set FRONTEND_URL=https://your-frontend.com

# Deploy
git push heroku main

# Run migrations
heroku run npx sequelize-cli db:migrate
```

### Railway

1. Connect GitHub repository
2. Add PostgreSQL database
3. Set environment variables in dashboard
4. Deploy automatically on push

### AWS EC2
```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone your-repo-url
cd backend

# Install dependencies
npm ci --production

# Set up environment
cp .env.production .env
nano .env  # Fill in values

# Run migrations
npx sequelize-cli db:migrate

# Start with PM2
pm2 start index.js --name umhw-backend
pm2 startup
pm2 save

# Set up Nginx reverse proxy
sudo apt install nginx
# Configure Nginx (see nginx.conf example below)
```

---

## Nginx Configuration Example
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Post-Deployment

### Verify Deployment
```bash
# Health check
curl https://api.yourdomain.com/api/health

# Status check
curl https://api.yourdomain.com/api/status
```

### Monitor Logs
```bash
# PM2 logs
pm2 logs umhw-backend

# Application logs
tail -f logs/combined-$(date +%Y-%m-%d).log

# Error logs
tail -f logs/error-$(date +%Y-%m-%d).log
```

### Database Backups
```bash
# Manual backup
pg_dump -h your-host -U your-user -d your-db > backup-$(date +%Y%m%d).sql

# Restore
psql -h your-host -U your-user -d your-db < backup-file.sql
```

---

## Troubleshooting

### Application won't start
1. Check environment variables are set correctly
2. Verify database connection
3. Check logs: `pm2 logs umhw-backend`
4. Verify port is not in use: `lsof -i :5000`

### Database connection fails
1. Check DATABASE_URL format
2. Verify PostgreSQL is running
3. Check firewall/security group rules
4. Test connection: `psql $DATABASE_URL`

### CORS errors
1. Verify FRONTEND_URL is set correctly (with protocol)
2. Check CORS configuration in index.js
3. Ensure frontend is using correct API URL

---

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Enable HTTPS** - Use Let's Encrypt for free SSL
3. **Regular updates** - Keep dependencies updated
4. **Database backups** - Automated daily backups
5. **Monitor logs** - Set up alerts for errors
6. **Rate limiting** - Already configured, verify in production
7. **Input validation** - Already implemented
8. **SQL injection protection** - Sequelize provides this
9. **XSS protection** - Helmet provides this
10. **CSRF protection** - Already configured

---

## Maintenance

### Update Dependencies
```bash
# Check for updates
npm outdated

# Update non-breaking
npm update

# Update all (carefully!)
npm install package@latest
```

### Database Migrations
```bash
# Create new migration
npx sequelize-cli migration:generate --name description

# Run migrations
npx sequelize-cli db:migrate

# Rollback
npx sequelize-cli db:migrate:undo
```