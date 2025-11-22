# Deployment Instructions (VPS with Docker)

Running your app in a Docker container is the most robust way to deploy. It ensures your environment is exactly the same as development.

## Prerequisites

-   A VPS with **Docker** and **Docker Compose** installed.
-   Your `.env` file with the `GEMINI_API_KEY`.

## 1. Clone & Configure

SSH into your VPS:

```bash
git clone https://github.com/bilbo-22/familist.git
cd familist
```

Create your `.env` file:
```bash
nano .env
```
Paste your key:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

## 2. Run with Docker Compose

We use `docker-compose` to build and run the container. It automatically mounts your `database.json` so your data persists even if you rebuild the container.

```bash
# Build and start in detached mode (background)
docker-compose up -d --build
```

That's it! Your app is running on port **3000**.

## 3. Updates

When you push new code to Git, updating is easy:

```bash
git pull
docker-compose up -d --build
```

## 4. Accessing the App

-   **Direct IP**: `http://YOUR_VPS_IP:3000`
-   **Reverse Proxy**: You can still use Nginx (as described below) to proxy traffic to port 3000 for a custom domain and HTTPS.

### Quick Nginx Setup (Optional)

```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/familist
```

Config:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable it:
```bash
sudo ln -s /etc/nginx/sites-available/familist /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```
