import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { testUtils } from '@/tests/utils/unit-test-helpers';

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Default Button</Button>);
    
    const button = screen.getByRole('button', { name: 'Default Button' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Button variant="destructive">Destructive</Button>);
    
    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground');
    
    rerender(<Button variant="outline">Outline</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('border', 'border-input', 'bg-background');
    
    rerender(<Button variant="secondary">Secondary</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground');
    
    rerender(<Button variant="ghost">Ghost</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground');
    
    rerender(<Button variant="link">Link</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('text-primary', 'underline-offset-4');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    
    let button = screen.getByRole('button');
    expect(button).toHaveClass('h-9', 'rounded-md', 'px-3');
    
    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('h-11', 'rounded-md', 'px-8');
    
    rerender(<Button size="icon">Icon</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('h-10', 'w-10');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clickable</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
    expect(link).toHaveClass('inline-flex', 'items-center', 'justify-center');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Button ref={ref}>Button with ref</Button>);
    
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
  });

  it('accepts custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('passes through HTML button attributes', () => {
    render(
      <Button type="submit" form="test-form" data-testid="submit-btn">
        Submit
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('form', 'test-form');
    expect(button).toHaveAttribute('data-testid', 'submit-btn');
  });

  it('has proper accessibility attributes', () => {
    render(<Button aria-label="Accessible button">Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Accessible button');
  });

  it('supports keyboard navigation', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Keyboard Button</Button>);
    
    const button = screen.getByRole('button');
    
    // Focus the button
    button.focus();
    expect(button).toHaveFocus();
    
    // Press Enter
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
    
    // Press Space
    fireEvent.keyDown(button, { key: ' ', code: 'Space' });
  });

  it('has focus ring styles', () => {
    render(<Button>Focus Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
  });

  it('combines variant and size classes correctly', () => {
    render(<Button variant="outline" size="lg">Large Outline</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border', 'border-input'); // outline variant
    expect(button).toHaveClass('h-11', 'rounded-md', 'px-8'); // lg size
  });

  // Loading state test (if you add loading prop in future)
  it('handles loading state gracefully', () => {
    // This test is for future loading state implementation
    render(<Button disabled>Loading...</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Loading...');
  });

  // Performance test
  it('renders quickly', async () => {
    const renderTime = await testUtils.createPerformanceTestHelpers().measureRenderTime(
      () => render(<Button>Performance Test</Button>)
    );
    
    // Should render in under 100ms
    expect(renderTime).toBeLessThan(100);
  });

  // Edge cases
  it('handles empty children', () => {
    render(<Button></Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('');
  });

  it('handles null children', () => {
    render(<Button>{null}</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('handles complex children', () => {
    render(
      <Button>
        <span>Complex</span>
        <strong>Button</strong>
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('ComplexButton');
  });
});