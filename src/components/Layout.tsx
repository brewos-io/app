import { useState, useEffect, useRef } from "react";
import {
  Outlet,
  NavLink,
  useParams,
  Link,
  useLocation,
} from "react-router-dom";
import { useStore } from "@/lib/store";
import { useAppStore } from "@/lib/mode";
import { useMobileLandscape } from "@/lib/useMobileLandscape";
import { isRunningAsPWA } from "@/lib/pwa";
import { Logo } from "./Logo";
import { InstallPrompt, usePWAInstall } from "./InstallPrompt";
import { ConnectionOverlay } from "./ConnectionOverlay";
import { VersionWarning } from "./VersionWarning";
import { UserMenu } from "./UserMenu";
import { BrewingModeOverlay } from "./BrewingModeOverlay";
import { StatusBar } from "./StatusBar";
import { isDemoMode } from "@/lib/demo-mode";
import {
  LayoutGrid,
  Coffee,
  Settings,
  Calendar,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Navigation items - adjust based on mode
const getNavigation = (isCloud: boolean, deviceId?: string) => {
  const basePath = isCloud && deviceId ? `/machine/${deviceId}` : "";

  const items = [
    { name: "Dashboard", href: basePath || "/", icon: LayoutGrid },
    { name: "Brewing", href: `${basePath}/brewing`, icon: Coffee },
    { name: "Stats", href: `${basePath}/stats`, icon: BarChart3 },
    { name: "Schedules", href: `${basePath}/schedules`, icon: Calendar },
    { name: "Settings", href: `${basePath}/settings`, icon: Settings },
  ];

  return items;
};

interface LayoutProps {
  onExitDemo?: () => void;
}

export function Layout({ onExitDemo }: LayoutProps) {
  const { deviceId } = useParams();
  const location = useLocation();
  const deviceName = useStore((s) => s.device.deviceName);
  const { mode, user, getSelectedDevice } = useAppStore();
  const { isMobile } = usePWAInstall();
  const isMobileLandscape = useMobileLandscape();
  const isPWA = isRunningAsPWA();
  const [showInstallBanner, setShowInstallBanner] = useState(() => {
    // Check if user previously dismissed the banner
    return localStorage.getItem("brewos-install-dismissed") !== "true";
  });

  const isCloud = mode === "cloud";
  const isDemo = isDemoMode();
  // Don't use real cloud device data in demo mode - demo has its own mock device
  const selectedDevice = isDemo ? null : getSelectedDevice();

  // Scroll-aware header visibility (portrait mode only)
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const hasScrolled = useRef(false); // Track if user has actually scrolled
  const mainScrollRef = useRef<HTMLDivElement>(null); // Ref for the main scroll container
  const scrollThreshold = 10; // Minimum scroll delta to trigger hide/show

  useEffect(() => {
    // Only apply scroll behavior on mobile devices in portrait mode
    // Desktop should always show header/nav
    if (!isMobile || isMobileLandscape) return;

    const scrollContainer = mainScrollRef.current;

    if (scrollContainer) {
      // Ensure header is visible on initial load/mount
      setHeaderVisible(true);
      lastScrollY.current = scrollContainer.scrollTop || 0;
      hasScrolled.current = false;
    }

    const handleScroll = () => {
      if (!scrollContainer) return;

      const currentScrollY = scrollContainer.scrollTop;

      // Always show header when at top (bouncing area included)
      if (currentScrollY <= 0) {
        setHeaderVisible(true);
        lastScrollY.current = 0;
        hasScrolled.current = false; // Reset when back at top
        return;
      }

      // Mark that user has scrolled (prevents hiding on initial load quirks)
      if (!hasScrolled.current && currentScrollY > 0) {
        hasScrolled.current = true;
      }

      const delta = currentScrollY - lastScrollY.current;

      // Only trigger if scroll delta exceeds threshold AND user has actually scrolled
      if (Math.abs(delta) > scrollThreshold && hasScrolled.current) {
        if (delta > 0 && currentScrollY > 80) {
          // Scrolling down & past header + nav height - hide
          setHeaderVisible(false);
        } else if (delta < 0) {
          // Scrolling up - show
          setHeaderVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }
    };

    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll, {
        passive: true,
      });
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, [isMobile, isMobileLandscape]);

  // Reset header visibility on route change
  useEffect(() => {
    setHeaderVisible(true);
    hasScrolled.current = false; // Reset scroll tracking on route change
    // Reset scroll position tracking on route change
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
      lastScrollY.current = 0;
    }
  }, [location.pathname]);

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem("brewos-install-dismissed", "true");
  };

  const navigation = getNavigation(isCloud, deviceId || selectedDevice?.id);

  // Check if device is offline (for hiding navigation and status indicator)
  // Use the same logic as ConnectionOverlay - check machine state from store
  // This is the source of truth for real-time connection status
  const machineState = useStore((s) => s.machine.state);
  const isDeviceOffline = isCloud && machineState === "offline";

  // Determine if device is truly online for the status indicator
  // Use real-time machine state as source of truth, fallback to selectedDevice.isOnline
  const isDeviceOnline = isCloud
    ? machineState !== "offline" &&
      machineState !== "unknown" &&
      selectedDevice?.isOnline
    : true;

  // Get current page title from navigation
  const currentPageTitle =
    navigation.find((item) => {
      const currentPath = location.pathname;
      // Dashboard: exact match for root or machine root
      if (item.href === "/" || item.href === "") {
        return currentPath === "/" || currentPath === `/machine/${deviceId}`;
      }
      // Other routes: exact match or sub-route (path continues with /)
      return (
        currentPath === item.href || currentPath.startsWith(item.href + "/")
      );
    })?.name || "Dashboard";

  // Mobile Landscape Layout - Sidebar navigation
  if (isMobileLandscape) {
    return (
      <div className="h-[100dvh] bg-theme flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-16 flex-shrink-0 bg-card border-r border-theme flex flex-col">
          {/* Logo - icon only */}
          <div className="h-12 flex items-center justify-center border-b border-theme">
            <Logo size="sm" iconOnly />
          </div>

          {/* Navigation - hidden when device is offline */}
          {!isDeviceOffline && (
            <nav className="flex-1 flex flex-col items-center py-2 gap-1 overflow-y-auto">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={
                    item.href === "/" ||
                    item.href.endsWith(`/${deviceId || selectedDevice?.id}`)
                  }
                  className={({ isActive }) =>
                    cn(
                      "w-11 h-11 flex items-center justify-center rounded-xl transition-all",
                      isActive ? "nav-active" : "nav-inactive"
                    )
                  }
                  title={item.name}
                >
                  <item.icon className="w-5 h-5" />
                </NavLink>
              ))}
            </nav>
          )}
        </aside>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Compact header */}
          <header className="h-12 flex-shrink-0 header-glass border-b border-theme px-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {/* Page title */}
              <h1 className="text-base font-bold text-theme">
                {currentPageTitle}
              </h1>

              {/* Cloud: machine name with real-time status indicator */}
              {isCloud && selectedDevice && (
                <Link
                  to="/machines"
                  className="flex items-center gap-2 px-2 py-1 rounded-lg bg-theme-tertiary hover:bg-theme-secondary transition-colors group"
                >
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
                      isDeviceOnline ? "bg-emerald-500" : "bg-theme-muted"
                    }`}
                  />
                  <span className="text-xs font-medium text-theme-secondary group-hover:text-theme truncate max-w-[100px]">
                    {selectedDevice.name}
                  </span>
                </Link>
              )}
              {/* Local: device name */}
              {!isCloud && deviceName && (
                <span className="text-xs text-theme-muted truncate">
                  {deviceName}
                </span>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Machine Status Icons */}
              <StatusBar />

              {(isCloud && user) || isDemo ? (
                <UserMenu onExitDemo={onExitDemo} />
              ) : null}
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto px-4 py-3">
            <Outlet />
          </main>
        </div>

        {/* Connection Overlay - handles connection issues and OTA for all modes */}
        {!isDemo && <ConnectionOverlay />}

        {/* Brewing Mode Overlay */}
        <BrewingModeOverlay />
      </div>
    );
  }

  // Portrait / Desktop Layout
  // Status Bar Curtain: Fixed element that covers the status bar area
  // This ensures content never scrolls behind the clock/battery icons
  const StatusBarCurtain = () => (
    <div
      className="fixed top-0 left-0 right-0 z-[60] header-glass border-b-0"
      style={{ height: "env(safe-area-inset-top)" }}
    />
  );

  return (
    // FIX #2: Use fixed inset-0 to force container to fit viewport exactly.
    // This resolves iOS PWA "bottom gap" and overscroll issues.
    <div
      ref={mainScrollRef}
      className={cn(
        "fixed inset-0 overflow-y-auto overflow-x-hidden bg-theme"
        // Using 'fixed' creates a new stacking context and defines the viewport
        // exactly, preventing body-height mismatch issues on iOS.
      )}
    >
      <StatusBarCurtain />

      {/* 2. UPDATE HEADER: 
          - Stick to top-0
          - Keep pt-[env...] to push content down below the status bar
          - The curtain covers the gap visually
      */}
      {/* Header */}
      <header
        className={cn(
          "sticky z-50 header-glass border-b border-theme transition-transform duration-300 ease-in-out",
          "top-0",
          "pt-[env(safe-area-inset-top)]",
          // Only hide on mobile portrait
          isMobile && !isMobileLandscape && !headerVisible
            ? "-translate-y-full"
            : "translate-y-0"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Mode */}
            <div className="flex items-center gap-4">
              {/* Hide full logo on very small screens, show icon only */}
              <Logo size="md" className="hidden xs:flex" />
              <Logo size="md" iconOnly className="xs:hidden" />

              {/* Cloud: Clickable machine indicator with real-time status */}
              {isCloud && selectedDevice && (
                <Link
                  to="/machines"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-theme-tertiary hover:bg-theme-secondary transition-colors group"
                >
                  <div
                    className={`w-2 h-2 rounded-full transition-colors ${
                      isDeviceOnline ? "bg-emerald-500" : "bg-theme-muted"
                    }`}
                  />
                  <span className="text-sm font-medium text-theme-secondary group-hover:text-theme max-w-[150px] truncate">
                    {selectedDevice.name}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-theme-muted group-hover:text-theme-secondary transition-colors" />
                </Link>
              )}

              {/* Local: Machine Name */}
              {!isCloud && deviceName && (
                <span className="hidden sm:block text-sm font-medium text-theme-secondary">
                  {deviceName}
                </span>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 xs:gap-3">
              {/* Machine Status Icons */}
              <StatusBar />

              {/* User menu - Cloud mode or Demo mode */}
              {(isCloud && user) || isDemo ? (
                <UserMenu onExitDemo={onExitDemo} />
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Install App Banner - shown to mobile users only, not in demo mode */}
      {showInstallBanner && isMobile && !isDemo && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <InstallPrompt
            variant="banner"
            onInstalled={dismissInstallBanner}
            onDismiss={dismissInstallBanner}
          />
        </div>
      )}

      {/* Version Compatibility Warning - shown if backend/firmware version mismatch */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <VersionWarning />
      </div>

      {/* Navigation */}
      {!isDeviceOffline && (
        <nav
          // FIX #1: Gap Removal Logic
          // 1. We keep '-mt-px' in BOTH states to ensuring constant border overlap.
          // 2. We use specific calc() for exact positioning relative to the sticky header.
          className={cn(
            "sticky z-40 nav-bg border-b border-theme transition-all duration-300 ease-in-out",
            // Always pull up by 1px to prevent sub-pixel gaps
            "-mt-px",
            // Conditional sticky positioning
            isMobile && !isMobileLandscape && !headerVisible
              ? "top-[env(safe-area-inset-top)]" // Stick to top safe area when header is gone
              : "top-[calc(4rem+env(safe-area-inset-top))]" // Stick below header (16 + safe area)
          )}
        >
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            {/* Mobile: evenly distributed icons with labels */}
            {/* Nav height on mobile: py-1 (0.25rem top + 0.25rem bottom) + icon (1.25rem) + text (~1rem) + gap (0.125rem) = ~2.75rem */}
            <div className="flex sm:hidden justify-around py-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={
                    item.href === "/" ||
                    item.href.endsWith(`/${deviceId || selectedDevice?.id}`)
                  }
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-medium transition-all min-w-0 flex-1 max-w-20",
                      isActive ? "nav-active" : "nav-inactive"
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="truncate">{item.name}</span>
                </NavLink>
              ))}
            </div>
            {/* Desktop: horizontal tabs with full labels */}
            <div className="hidden sm:flex gap-1 py-2">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={
                    item.href === "/" ||
                    item.href.endsWith(`/${deviceId || selectedDevice?.id}`)
                  }
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                      isActive ? "nav-active" : "nav-inactive"
                    )
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main
        className={cn(
          "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
          "pt-6",
          // Extra padding at bottom for Home Indicator (PWA) or simple spacing
          isPWA ? "pb-[calc(2rem+env(safe-area-inset-bottom))]" : "pb-6"
        )}
      >
        <Outlet />
      </main>

      {/* Connection Overlay - handles connection issues and OTA for all modes */}
      {!isDemo && <ConnectionOverlay />}

      {/* Brewing Mode Overlay - Shows full-screen brewing UI during extraction */}
      <BrewingModeOverlay />
    </div>
  );
}
