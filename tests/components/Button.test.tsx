import Button from '@app/components/Common/Button';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('Button Component', () => {
  describe('rendering', () => {
    it('should render children correctly', () => {
      render(<Button>Click Me</Button>);

      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('should render as a button by default', () => {
      render(<Button>Default Button</Button>);

      const button = screen.getByRole('button', { name: 'Default Button' });
      expect(button.tagName).toBe('BUTTON');
    });

    it('should render as an anchor when as="a"', () => {
      render(
        <Button as="a" href="/test">
          Link Button
        </Button>
      );

      const link = screen.getByText('Link Button').closest('a');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
    });
  });

  describe('button types', () => {
    it('should apply default button styles', () => {
      render(<Button buttonType="default">Default</Button>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-gray-800');
      expect(button.className).toContain('text-gray-200');
    });

    it('should apply primary button styles', () => {
      render(<Button buttonType="primary">Primary</Button>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-indigo-600');
      expect(button.className).toContain('text-white');
    });

    it('should apply danger button styles', () => {
      render(<Button buttonType="danger">Danger</Button>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-red-600');
      expect(button.className).toContain('text-white');
    });

    it('should apply warning button styles', () => {
      render(<Button buttonType="warning">Warning</Button>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-yellow-500');
      expect(button.className).toContain('text-white');
    });

    it('should apply success button styles', () => {
      render(<Button buttonType="success">Success</Button>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-green-500');
      expect(button.className).toContain('text-white');
    });

    it('should apply ghost button styles', () => {
      render(<Button buttonType="ghost">Ghost</Button>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-transparent');
      expect(button.className).toContain('text-white');
    });
  });

  describe('button sizes', () => {
    it('should apply default (md) size styles', () => {
      render(<Button buttonSize="default">Default Size</Button>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('px-4');
      expect(button.className).toContain('py-2');
      expect(button.className).toContain('text-sm');
    });

    it('should apply small size styles', () => {
      render(<Button buttonSize="sm">Small</Button>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('px-2.5');
      expect(button.className).toContain('py-1.5');
      expect(button.className).toContain('text-xs');
    });

    it('should apply large size styles', () => {
      render(<Button buttonSize="lg">Large</Button>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('px-6');
      expect(button.className).toContain('py-3');
      expect(button.className).toContain('text-base');
    });

    it('should apply medium size styles', () => {
      render(<Button buttonSize="md">Medium</Button>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('px-4');
      expect(button.className).toContain('py-2');
      expect(button.className).toContain('text-sm');
    });
  });

  describe('click handling', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Clickable</Button>);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should pass event to onClick handler', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Clickable</Button>);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('disabled state', () => {
    it('should be disableable', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not fire onClick when disabled', () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should have reduced opacity when disabled', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('disabled:opacity-50');
    });
  });

  describe('custom classes', () => {
    it('should apply custom className', () => {
      render(<Button className="custom-class">Custom</Button>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
    });

    it('should preserve base styles with custom className', () => {
      render(<Button className="custom-class">With Base</Button>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('inline-flex');
      expect(button.className).toContain('rounded-md');
      expect(button.className).toContain('custom-class');
    });
  });

  describe('base styles', () => {
    it('should always have base button classes', () => {
      render(<Button>Base Styles</Button>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('inline-flex');
      expect(button.className).toContain('items-center');
      expect(button.className).toContain('justify-center');
      expect(button.className).toContain('border');
      expect(button.className).toContain('rounded-md');
      expect(button.className).toContain('cursor-pointer');
      expect(button.className).toContain('transition');
    });
  });

  describe('button type attribute', () => {
    it('should pass through type attribute', () => {
      render(<Button type="submit">Submit</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('children wrapping', () => {
    it('should wrap children in a flex span', () => {
      render(<Button>Child Content</Button>);

      const span = screen.getByText('Child Content');
      expect(span.tagName).toBe('SPAN');
      expect(span.className).toContain('flex');
      expect(span.className).toContain('items-center');
    });
  });
});
