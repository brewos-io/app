# BrewOS App

<p align="center">
  <img src="https://raw.githubusercontent.com/brewos-io/.github/main/assets/1080/horizontal/full-color/Brewos-1080.png" alt="BrewOS Logo" width="300">
</p>

<p align="center">
  <strong>Progressive Web App (PWA) for BrewOS espresso machine control</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#build-modes">Build Modes</a> •
  <a href="#development">Development</a> •
  <a href="#deployment">Deployment</a>
</p>

---

## Overview

BrewOS App is a Progressive Web App (PWA) built with React and TypeScript that provides a modern interface for monitoring and controlling BrewOS espresso machines. It supports both local (ESP32) and cloud-hosted deployments.

### Key Features

- 📱 **Progressive Web App** - Install on any device, works offline
- 🔄 **Real-time Updates** - WebSocket connection for live data
- 📊 **Temperature Monitoring** - Real-time graphs and statistics
- ⚙️ **Device Configuration** - WiFi, MQTT, schedules, and more
- 🎯 **Brew by Weight** - Integrated scale support
- 📈 **Shot Statistics** - Track your espresso history
- 🔔 **Push Notifications** - Get alerts when your machine needs attention
- 🌐 **Multi-mode Support** - Works locally (ESP32) and remotely (cloud)

---

## Build Modes

The app supports multiple build modes for different deployment targets:

### Cloud Mode (Default)

```bash
npm run build
# or
npm run build:cloud
```

- Builds for cloud deployment at `cloud.brewos.io`
- Enables demo mode for website visitors
- Sets `__CLOUD__=true`, `__ESP32__=false`
- Outputs to `dist/`

### ESP32 Mode

```bash
npm run build:esp32
```

- Builds for local ESP32 deployment
- Demo mode disabled (real hardware)
- Sets `__ESP32__=true`, `__CLOUD__=false`
- Aggressive minification and code splitting
- Outputs to configured ESP32 data directory (via `ESP32_DATA_DIR` env var)

**Note:** For ESP32 builds, set the `ESP32_DATA_DIR` environment variable to specify where to output the build:

```bash
ESP32_DATA_DIR=../firmware/src/esp32/data npm run build:esp32
```

---

## Development

### Prerequisites

- Node.js 18+ and npm
- For ESP32 builds: Access to firmware repository

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Development Modes

**Local Cloud Development:**
- Proxy configured to `localhost:3001` (cloud service)
- WebSocket proxy to `ws://localhost:3001`

**Local ESP32 Development:**
- Set `VITE_TARGET=esp32` environment variable
- Proxy configured to `brewos.local` (ESP32 device)
- WebSocket proxy to `ws://brewos.local`

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for cloud deployment |
| `npm run build:cloud` | Build for cloud deployment |
| `npm run build:esp32` | Build for ESP32 deployment |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |
| `npm run storybook` | Start Storybook |
| `npm run build-storybook` | Build Storybook |

---

## Architecture

### Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Project Structure

```
app/
├── src/
│   ├── components/    # React components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities and helpers
│   └── styles/        # Global styles
├── public/            # Static assets
├── vite.config.ts     # Vite configuration
└── package.json
```

### Build-time Constants

The app uses compile-time constants to enable/disable features:

- `__CLOUD__` - Cloud deployment mode
- `__ESP32__` - ESP32 deployment mode
- `__VERSION__` - App version
- `__ENVIRONMENT__` - Environment (development/production)

---

## Deployment

### Cloud Deployment

The cloud service serves the built app. Build the app and the cloud service will serve it:

```bash
npm run build
# Cloud service will serve from dist/
```

### ESP32 Deployment

1. Build the app for ESP32:

```bash
ESP32_DATA_DIR=../firmware/src/esp32/data npm run build:esp32
```

2. Upload to ESP32 using PlatformIO:

```bash
cd ../firmware/src/esp32
pio run -t uploadfs
```

Or use the sync script from the firmware repository:

```bash
cd ../firmware/src/scripts
./sync_web_to_esp32.sh --build
```

---

## Integration with Other Repositories

### Firmware Repository

The app is built and deployed to ESP32 devices via the firmware repository:

- ESP32 builds output to `firmware/src/esp32/data`
- Use `sync_web_to_esp32.sh` script for deployment

### Cloud Repository

The cloud service serves the app for remote access:

- Cloud builds output to `dist/`
- Cloud service serves static files from build output

---

## Documentation

Comprehensive documentation is available in the [`docs/`](docs/) directory:

- **[App Development Guide](docs/README.md)** - Complete development documentation
- **[PWA Features](docs/PWA.md)** - Progressive Web App setup and offline support
- **[Push Notifications](docs/Push_Notifications.md)** - Push notification setup and usage
- **[Power Metering](docs/Power_Metering.md)** - Power monitoring configuration
- **[WebSocket Protocol](docs/WebSocket_Protocol.md)** - Message format reference

---

## Related Repositories

- **[wiki](https://github.com/brewos-io/wiki)** - Complete user documentation and guides
- **[firmware](https://github.com/brewos-io/firmware)** - ESP32 and Pico firmware
- **[cloud](https://github.com/brewos-io/cloud)** - Cloud service for remote access
- **[web](https://github.com/brewos-io/web)** - Marketing website
- **[homeassistant](https://github.com/brewos-io/homeassistant)** - Home Assistant integration

---

## License

This project is licensed under the **Apache License 2.0 with Commons Clause** - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <sub>Built with ☕ by espresso enthusiasts, for espresso enthusiasts</sub>
</p>

