# Cron Job Setup Guide

## Option 1: Vercel Cron Jobs (Recommended)

### 1. Add Environment Variable
Add this to your `.env.local` file:
```env
CRON_SECRET=your-secret-key-here
```

### 2. Deploy to Vercel
The cron job will automatically run daily at midnight UTC.

## Option 2: External Cron Service (cron-job.org)

### 1. Go to https://cron-job.org
### 2. Create a free account
### 3. Add a new cron job:
- **URL**: `https://your-domain.com/api/reset-daily-mints`
- **Schedule**: `0 0 * * *` (daily at midnight UTC)
- **Method**: POST

### 4. Test the cron job
Click "Test" to verify it works.

## Option 3: GitHub Actions (Free)

Create `.github/workflows/daily-reset.yml`:

```yaml
name: Daily Mint Reset

on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight UTC

jobs:
  reset-mints:
    runs-on: ubuntu-latest
    steps:
      - name: Reset Daily Mints
        run: |
          curl -X POST https://your-domain.com/api/reset-daily-mints
```

## Option 4: Local Server (for development)

### Windows Task Scheduler:
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger to daily at midnight
4. Action: Start a program
5. Program: `curl`
6. Arguments: `-X POST http://localhost:3000/api/reset-daily-mints`

### Linux/Mac Cron:
Add to crontab (`crontab -e`):
```bash
0 0 * * * curl -X POST http://localhost:3000/api/reset-daily-mints
```

## Testing Your Cron Job

You can manually trigger the reset:
```bash
curl -X POST http://localhost:3000/api/reset-daily-mints
```

## Monitoring

Check your application logs to see when the cron job runs:
- Vercel: Check Function Logs in dashboard
- External: Check your application's error logs
- GitHub Actions: Check Actions tab in your repository
