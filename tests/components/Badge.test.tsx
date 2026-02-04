import Badge from '@app/components/Common/Badge';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    legacyBehavior,
  }: {
    children: React.ReactNode;
    href: string;
    legacyBehavior?: boolean;
  }) => {
    // With legacyBehavior, the child is the anchor, so we clone and add href
    if (legacyBehavior && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement, { href });
    }
    return <a href={href}>{children}</a>;
  },
}));

describe('Badge Component', () => {
  describe('rendering', () => {
    it('should render children correctly', () => {
      render(<Badge>Test Badge</Badge>);

      expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('should render as a span by default', () => {
      render(<Badge>Default Badge</Badge>);

      const badge = screen.getByText('Default Badge');
      expect(badge.tagName).toBe('SPAN');
    });

    it('should render as an anchor for internal links', () => {
      render(<Badge href="/test">Internal Link Badge</Badge>);

      const badge = screen.getByText('Internal Link Badge');
      expect(badge.tagName).toBe('A');
      expect(badge).toHaveAttribute('href', '/test');
    });

    it('should render as an external link with target _blank', () => {
      render(<Badge href="https://example.com">External Link Badge</Badge>);

      const badge = screen.getByText('External Link Badge');
      expect(badge.tagName).toBe('A');
      expect(badge).toHaveAttribute('href', 'https://example.com');
      expect(badge).toHaveAttribute('target', '_blank');
      expect(badge).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('badge types', () => {
    it('should apply default badge styles', () => {
      render(<Badge badgeType="default">Default</Badge>);

      const badge = screen.getByText('Default');
      expect(badge.className).toContain('bg-indigo-500');
    });

    it('should apply primary badge styles', () => {
      render(<Badge badgeType="primary">Primary</Badge>);

      const badge = screen.getByText('Primary');
      expect(badge.className).toContain('bg-indigo-500');
    });

    it('should apply danger badge styles', () => {
      render(<Badge badgeType="danger">Danger</Badge>);

      const badge = screen.getByText('Danger');
      expect(badge.className).toContain('bg-red-600');
    });

    it('should apply warning badge styles', () => {
      render(<Badge badgeType="warning">Warning</Badge>);

      const badge = screen.getByText('Warning');
      expect(badge.className).toContain('bg-yellow-500');
    });

    it('should apply success badge styles', () => {
      render(<Badge badgeType="success">Success</Badge>);

      const badge = screen.getByText('Success');
      expect(badge.className).toContain('bg-green-500');
    });

    it('should apply dark badge styles', () => {
      render(<Badge badgeType="dark">Dark</Badge>);

      const badge = screen.getByText('Dark');
      expect(badge.className).toContain('bg-gray-900');
    });

    it('should apply light badge styles', () => {
      render(<Badge badgeType="light">Light</Badge>);

      const badge = screen.getByText('Light');
      expect(badge.className).toContain('bg-gray-700');
    });
  });

  describe('custom classes', () => {
    it('should apply custom className', () => {
      render(<Badge className="custom-class">Custom</Badge>);

      const badge = screen.getByText('Custom');
      expect(badge.className).toContain('custom-class');
    });

    it('should preserve base styles with custom className', () => {
      render(<Badge className="custom-class">With Base</Badge>);

      const badge = screen.getByText('With Base');
      expect(badge.className).toContain('px-2');
      expect(badge.className).toContain('rounded-full');
      expect(badge.className).toContain('custom-class');
    });
  });

  describe('link behavior', () => {
    it('should have cursor-pointer for link badges', () => {
      render(<Badge href="/test">Clickable</Badge>);

      const badge = screen.getByText('Clickable');
      expect(badge.className).toContain('cursor-pointer');
    });

    it('should have cursor-default for non-link badges', () => {
      render(<Badge>Not Clickable</Badge>);

      const badge = screen.getByText('Not Clickable');
      expect(badge.className).toContain('cursor-default');
    });

    it('should add transition for link badges', () => {
      render(<Badge href="/test">Animated</Badge>);

      const badge = screen.getByText('Animated');
      expect(badge.className).toContain('transition');
    });
  });

  describe('base styles', () => {
    it('should always have base badge classes', () => {
      render(<Badge>Base Styles</Badge>);

      const badge = screen.getByText('Base Styles');
      expect(badge.className).toContain('px-2');
      expect(badge.className).toContain('inline-flex');
      expect(badge.className).toContain('text-xs');
      expect(badge.className).toContain('leading-5');
      expect(badge.className).toContain('font-semibold');
      expect(badge.className).toContain('rounded-full');
      expect(badge.className).toContain('whitespace-nowrap');
    });
  });
});
