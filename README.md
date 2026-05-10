# Winning Numbers

A modern, SEO-optimized web application for displaying lottery results including Powerball, Mega Millions, and state-specific games.

## Features

- Real-time lottery results from all US states
- Powerball and Mega Millions national games
- Game family grouping (Day/Night sessions)
- Number frequency statistics
- Historical results with CSV export
- SEO-optimized with sitemaps and structured data
- Fully responsive design
- VPS-ready with Docker support

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Deployment**: Docker, Nginx

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm/yarn

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your settings:

```env
API_BASE_URL=https://winningnumbers.us
NEXT_PUBLIC_API_BASE_URL=https://winningnumbers.us
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NODE_ENV=production
```

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Build for Production

```bash
pnpm build
```

### 5. Start Production Server

```bash
pnpm start
```

---

## VPS Deployment

### Option 1: Docker (Recommended)

#### Build and Run with Docker

```bash
# Build the image
docker build -t winning-numbers .

# Run the container
docker run -d \
  --name winning-numbers-app \
  -p 3000:3000 \
  -e API_BASE_URL=https://winningnumbers.us \
  -e NEXT_PUBLIC_API_BASE_URL=https://winningnumbers.us \
  -e NEXT_PUBLIC_SITE_URL=https://yourdomain.com \
  winning-numbers
```

#### Using Docker Compose

```bash
# Create .env file with your settings
cp .env.example .env

# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Option 2: Manual Deployment

```bash
# Install dependencies
pnpm install

# Build for production
pnpm build

# The standalone output is in .next/standalone
# Copy static files
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

# Start the server
cd .next/standalone
node server.js
```

---

## Nginx Reverse Proxy Setup

### 1. Copy Nginx Configuration

```bash
sudo cp nginx.example.conf /etc/nginx/sites-available/winning-numbers
```

### 2. Edit Configuration

Update `yourdomain.com` with your actual domain:

```bash
sudo nano /etc/nginx/sites-available/winning-numbers
```

### 3. Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/winning-numbers /etc/nginx/sites-enabled/
```

### 4. Test and Reload

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL with Certbot

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
```

---

## Coolify Deployment

1. Create a new service in Coolify
2. Connect your Git repository
3. Set build pack to "Dockerfile"
4. Add environment variables:
   - `API_BASE_URL=https://winningnumbers.us`
   - `NEXT_PUBLIC_API_BASE_URL=https://winningnumbers.us`
   - `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`
5. Deploy

---

## Dokploy Deployment

1. Create a new application in Dokploy
2. Select "Docker Compose" as deployment method
3. Point to your repository
4. Add environment variables in the Dokploy UI
5. Deploy

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `API_BASE_URL` | Server-side API URL | Yes |
| `NEXT_PUBLIC_API_BASE_URL` | Client-side API URL | Yes |
| `NEXT_PUBLIC_SITE_URL` | Your production domain (for SEO) | Yes |
| `NODE_ENV` | Environment (production/development) | Yes |

---

## Verification Checklist

After deployment, verify:

- [ ] Homepage loads correctly at `https://yourdomain.com`
- [ ] States list displays with all states
- [ ] Powerball/Mega Millions results show
- [ ] Individual state pages work (e.g., `/states/fl`)
- [ ] Game pages display results
- [ ] `/sitemap.xml` returns valid XML sitemap index
- [ ] `/sitemaps/static.xml` returns valid XML
- [ ] `/sitemaps/states.xml` returns valid XML
- [ ] `/robots.txt` is accessible
- [ ] API connection works (check browser console for errors)
- [ ] SSL certificate is valid
- [ ] Mobile responsiveness

---

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── games/             # National games (Powerball, Mega Millions)
│   ├── states/            # State-specific pages
│   ├── sitemaps/          # XML sitemap routes
│   ├── sitemap.xml/       # Sitemap index route
│   └── robots.ts          # robots.txt configuration
├── components/
│   ├── cards/             # Result cards
│   ├── feedback/          # Loading, error, empty states
│   ├── filters/           # State/game selectors
│   ├── layout/            # Header, footer, breadcrumbs
│   ├── numbers/           # Number ball components
│   ├── seo/               # JSON-LD, FAQ components
│   ├── tables/            # Data tables
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── api/               # API client functions
│   ├── seo/               # SEO metadata helpers
│   └── utils/             # Utility functions
├── types/                 # TypeScript types
├── content/               # Static content (FAQs, guides)
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose configuration
├── nginx.example.conf     # Nginx reverse proxy config
└── .env.example           # Environment variables template
```

---

## License

MIT
