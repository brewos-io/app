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

  // Banner is always 56px in demo mode (minimize functionality removed)
  const bannerOffset = isDemo ? "56px" : "0px";

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

  // PORTRAIT / DESKTOP LAYOUT
  return (
    <div
      ref={mainScrollRef}
      className={cn(
        // FIX 1: Use 'fixed inset-0' - with viewport-fit=cover this extends into safe areas
        // This should eliminate the bottom gap on iOS PWA
        "fixed inset-0 flex flex-col overflow-y-auto overflow-x-hidden bg-theme",
        // Force the container to handle scrolling for proper sticky behavior
        "scroll-smooth"
      )}
      style={{
        // With viewport-fit=cover, inset-0 already extends into safe areas
        // Just ensure no gaps by explicitly setting bottom to 0
        ...(isPWA && {
          bottom: 0,
          // Use 100vh to fill viewport (viewport-fit=cover makes this include safe areas)
          height: "100vh",
          // Prevent overscroll bounce
          overscrollBehavior: "none",
          // Ensure background extends fully
          minHeight: "100vh",
        }),
      }}
    >
      {/* FIX #2: Unified Sticky Container
         Wraps Curtain, Header, and Nav into ONE sticky element.
         This eliminates the gap between Header and Nav during scroll.
      */}
      <div
        className="sticky z-50 flex flex-col header-glass border-b border-theme"
        style={{ top: bannerOffset }}
      >
        {/* Safe Area Spacer (Visual Curtain) */}
        <div
          className="w-full"
          style={{ height: "env(safe-area-inset-top)" }}
        />

        {/* Header Section */}
        <header
          className={cn(
            "w-full transition-all duration-300 ease-in-out overflow-hidden",
            // Logic: Collapse height via negative margin to slide up smoothly
            // We use mt instead of transform so the Nav (below) naturally slides up to fill the space
            isMobile && !isMobileLandscape && !headerVisible
              ? "-mt-16 opacity-0 pointer-events-none" // -mt-16 matches h-16
              : "mt-0 opacity-100"
          )}
        >
          <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Logo & Mode */}
            <div className="flex items-center gap-4">
              <Logo size="md" className="hidden xs:flex" />
              <Logo size="md" iconOnly className="xs:hidden" />

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

              {!isCloud && deviceName && (
                <span className="hidden sm:block text-sm font-medium text-theme-secondary">
                  {deviceName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 xs:gap-3">
              <StatusBar />
              {(isCloud && user) || isDemo ? (
                <UserMenu onExitDemo={onExitDemo} />
              ) : null}
            </div>
          </div>
        </header>

        {/* Separator line (optional, but good for visual clarity when header hides) */}
        <div
          className={cn(
            "w-full h-px bg-theme transition-opacity",
            isMobile && !isMobileLandscape && !headerVisible
              ? "opacity-0"
              : "opacity-100"
          )}
        />

        {/* Navigation Section */}
        {/* This sits naturally inside the sticky container, so it pulls up automatically when header hides */}
        {!isDeviceOffline && (
          <nav className="w-full nav-bg border-b border-theme">
            <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
              {/* Mobile Nav */}
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

              {/* Desktop Nav */}
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
      </div>

      {/* Install Banner */}
      {showInstallBanner && isMobile && !isDemo && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <InstallPrompt
            variant="banner"
            onInstalled={dismissInstallBanner}
            onDismiss={dismissInstallBanner}
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <VersionWarning />
      </div>

      {/* Main Content */}
      <main
        className={cn(
          "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1",
          // FIX 2: Top Gap - Consistent spacing with web
          // Always use "pt-6" (24px) instead of the tighter "pt-2" for PWA.
          !isDemo && "pt-6",
          // FIX 3: Bottom Gap - Remove extra padding
          // "pb-0" allows the content/background to extend to the very bottom edge.
          // "pb-[env(safe-area-inset-bottom)]" would stop it right above the home bar.
          // Use "pb-0" to eliminate the visual gap completely.
          isPWA ? "pb-0" : "pb-6"
        )}
        style={{
          // In demo mode, add padding-top to account for sticky header/nav height
          // This ensures the page title isn't covered when the sticky header is active
          paddingTop: isDemo ? "calc(4.75rem)" : undefined,
        }}
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
