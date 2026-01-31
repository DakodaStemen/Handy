import { useEffect, useState, useRef, useCallback } from "react";
import { Toaster } from "sonner";
import "./App.css";
import AccessibilityPermissions from "./components/AccessibilityPermissions";
import Footer from "./components/footer";
import Onboarding, { AccessibilityOnboarding } from "./components/onboarding";
import { Sidebar, SidebarSection, SECTIONS_CONFIG } from "./components/Sidebar";
import { useSettings } from "./hooks/useSettings";
import { useSettingsStore } from "./stores/settingsStore";
import { commands } from "@/bindings";

type OnboardingStep = "accessibility" | "model" | "done";

const renderSettingsContent = (section: SidebarSection) => {
  const ActiveComponent =
    SECTIONS_CONFIG[section]?.component || SECTIONS_CONFIG.general.component;
  return <ActiveComponent />;
};

function App() {
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep | null>(
    null,
  );
  const [currentSection, setCurrentSection] =
    useState<SidebarSection>("general");
  const { settings, updateSetting } = useSettings();
  const refreshAudioDevices = useSettingsStore(
    (state) => state.refreshAudioDevices,
  );
  const refreshOutputDevices = useSettingsStore(
    (state) => state.refreshOutputDevices,
  );
  const hasCompletedPostOnboardingInit = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastWindowHeight = useRef<number>(window.innerHeight);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  // Handle window resize (including fullscreen transitions) to prevent scroll lock
  useEffect(() => {
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDiff = Math.abs(currentHeight - lastWindowHeight.current);

      // If height changed significantly (likely fullscreen toggle), reset scroll
      if (heightDiff > 100 && scrollContainerRef.current) {
        // Request animation frame to ensure DOM has updated
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            // Force a reflow to recalculate scroll bounds
            const scrollEl = scrollContainerRef.current;
            const currentScrollTop = scrollEl.scrollTop;
            const maxScrollTop = scrollEl.scrollHeight - scrollEl.clientHeight;

            // If scroll position is invalid (beyond max), reset to valid position
            if (currentScrollTop > maxScrollTop && maxScrollTop >= 0) {
              scrollEl.scrollTop = maxScrollTop;
            }
          }
        });
      }

      lastWindowHeight.current = currentHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize Enigo and refresh audio devices when main app loads
  useEffect(() => {
    if (onboardingStep === "done" && !hasCompletedPostOnboardingInit.current) {
      hasCompletedPostOnboardingInit.current = true;
      console.log("Initializing Enigo...");
      commands.initializeEnigo().catch((e) => {
        console.warn("Failed to initialize Enigo:", e);
      });
      refreshAudioDevices();
      refreshOutputDevices();
    }
  }, [onboardingStep, refreshAudioDevices, refreshOutputDevices]);

  // Handle keyboard shortcuts for debug mode toggle
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+Shift+D (Windows/Linux) or Cmd+Shift+D (macOS)
      const isDebugShortcut =
        event.shiftKey &&
        event.key.toLowerCase() === "d" &&
        (event.ctrlKey || event.metaKey);

      if (isDebugShortcut) {
        event.preventDefault();
        const currentDebugMode = settings?.debug_mode ?? false;
        updateSetting("debug_mode", !currentDebugMode);
      }
    };

    // Add event listener when component mounts
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup event listener when component unmounts
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [settings?.debug_mode, updateSetting]);

  const checkOnboardingStatus = async () => {
    try {
      // Check if they have any models available
      const result = await commands.hasAnyModelsAvailable();
      if (result.status === "ok") {
        // If they have models/downloads, they're done. Otherwise start permissions step.
        setOnboardingStep(result.data ? "done" : "accessibility");
      } else {
        setOnboardingStep("accessibility");
      }
    } catch (error) {
      console.error("Failed to check onboarding status:", error);
      setOnboardingStep("accessibility");
    }
  };

  const handleAccessibilityComplete = () => {
    setOnboardingStep("model");
  };

  const handleModelSelected = () => {
    // Transition to main app - user has started a download
    setOnboardingStep("done");
  };

  // Still checking onboarding status
  if (onboardingStep === null) {
    return null;
  }

  if (onboardingStep === "accessibility") {
    return <AccessibilityOnboarding onComplete={handleAccessibilityComplete} />;
  }

  if (onboardingStep === "model") {
    return <Onboarding onModelSelected={handleModelSelected} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col select-none cursor-default overflow-hidden">
      <Toaster
        theme="system"
        toastOptions={{
          unstyled: true,
          classNames: {
            toast:
              "bg-background border border-mid-gray/20 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 text-sm",
            title: "font-medium",
            description: "text-mid-gray",
          },
        }}
      />
      {/* Main content area: Grid layout for Sidebar + Scrollable Content */}
      <div className="flex-1 grid grid-cols-[160px_1fr] grid-rows-[1fr] min-h-0 overflow-hidden">
        <Sidebar
          activeSection={currentSection}
          onSectionChange={setCurrentSection}
        />

        {/* Scrollable content area */}
        <div
          ref={scrollContainerRef}
          className="overflow-y-auto h-full w-full relative scroll-container"
        >
          <div className="flex flex-col items-center p-4 gap-4 min-h-full">
            <AccessibilityPermissions />
            {renderSettingsContent(currentSection)}
          </div>
        </div>
      </div>

      {/* Fixed footer at bottom */}
      <Footer />
    </div>
  );
}

export default App;
