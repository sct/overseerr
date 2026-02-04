import { useEffect, useRef } from 'react';

/**
 * Hook to trap focus within a container element for accessibility.
 * When enabled, Tab key navigation will cycle within the trapped container.
 *
 * @param containerRef - React ref to the container element
 * @param enabled - Whether to enable focus trapping
 * @param returnFocusOnDeactivate - Whether to return focus to the element that activated the trap
 * @returns Object with activate/deactivate methods
 */
export const useFocusTrap = (
  containerRef: React.RefObject<HTMLElement>,
  enabled: boolean,
  returnFocusOnDeactivate = true
) => {
  const lastActiveElementRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    // Store the currently focused element
    lastActiveElementRef.current = document.activeElement;

    // Get all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      const focusableSelectors = [
        'button:not([disabled])',
        '[href]:not([rel="external"])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"]):not([disabled])',
        'details:not([disabled])',
        '[contenteditable="true"]:not([disabled])',
      ].join(', ');

      const elements = container.querySelectorAll(focusableSelectors);
      return Array.from(elements).filter(
        (el): el is HTMLElement =>
          el instanceof HTMLElement && el.offsetWidth > 0 && el.offsetHeight > 0
      );
    };

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab: Moving backwards
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: Moving forwards
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (container && !container.contains(e.target as Node)) {
        container.focus();
      }
    };

    // Focus first element on activation
    const focusFirstElement = () => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      } else {
        container.focus();
      }
    };

    // Set up event listeners
    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('click', handleClickOutside, true);

    // Focus first element after a small delay to ensure DOM is ready
    setTimeout(focusFirstElement, 0);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('click', handleClickOutside, true);

      // Return focus to the element that originally triggered the trap
      if (returnFocusOnDeactivate && lastActiveElementRef.current) {
        (lastActiveElementRef.current as HTMLElement).focus();
        lastActiveElementRef.current = null;
      }
    };
  }, [enabled, containerRef, returnFocusOnDeactivate]);
};

/**
 * Hook to manage keyboard interactions for modals and dialogs.
 * Handles Escape key to close and prevents body scroll.
 *
 * @param onClose - Function to call when modal should be closed
 * @param enabled - Whether keyboard handling is active
 * @param preventScroll - Whether to prevent body scrolling when active
 */
export const useModalKeyboard = (
  onClose: (() => void) | undefined,
  enabled: boolean,
  preventScroll = true
) => {
  useEffect(() => {
    if (!enabled || !onClose) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);

    // Prevent body scroll when modal/drawer is open
    if (preventScroll) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        window.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = originalStyle;
      };
    }

    return () => window.removeEventListener('keydown', handleEscape);
  }, [enabled, onClose, preventScroll]);
};

/**
 * Hook to manage skip links for screen readers.
 * Provides a way to skip navigation and go directly to main content.
 */
export const useSkipLink = () => {
  useEffect(() => {
    const handleSkipLink = (e: KeyboardEvent) => {
      if (
        e.key === 'Tab' &&
        e.shiftKey &&
        document.activeElement === document.body
      ) {
        const skipLink = document.getElementById('skip-to-content');
        if (skipLink) {
          skipLink.focus();
        }
      }
    };

    document.addEventListener('keydown', handleSkipLink);
    return () => document.removeEventListener('keydown', handleSkipLink);
  }, []);
};

/**
 * Hook to announce dynamic content changes to screen readers.
 * Useful for loading states, error messages, and dynamic updates.
 *
 * @param message - Message to announce
 * @param priority - Announcement priority ('polite' or 'assertive')
 */
export const useAriaLive = (message: string) => {
  const announcementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!message) return;

    const announcement = announcementRef.current;
    if (announcement) {
      announcement.textContent = message;

      // Clear after a delay to prevent repeat announcements
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = '';
        }
      }, 1000);
    }
  }, [message]);

  return announcementRef;
};

// CSS utilities for accessibility
declare global {
  interface Window {
    skipToContent: () => void;
  }
}

// Utility to add skip-to-content functionality
export const initializeSkipLink = () => {
  window.skipToContent = () => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  };
};
