import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/input';
import { testUtils } from '@/tests/utils/unit-test-helpers';

describe('Input Component', () => {
  it('renders with default props', () => {
    render(<Input placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('flex', 'h-10', 'w-full');
  });

  it('accepts and displays value', () => {
    render(<Input value="test value" onChange={() => {}} />);
    
    const input = screen.getByDisplayValue('test value');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('test value');
  });

  it('handles onChange events', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new value' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: 'new value',
        }),
      })
    );
  });

  it('handles onFocus and onBlur events', () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();
    render(<Input onFocus={handleFocus} onBlur={handleBlur} />);
    
    const input = screen.getByRole('textbox');
    
    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    render(<Input disabled />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
  });

  it('supports different input types', () => {
    const { rerender } = render(<Input type="email" />);
    
    let input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
    
    rerender(<Input type="password" />);
    input = screen.getByRole('textbox'); // Note: password inputs still have textbox role
    expect(input).toHaveAttribute('type', 'password');
    
    rerender(<Input type="number" />);
    input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('accepts custom className', () => {
    render(<Input className="custom-input" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-input');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Input ref={ref} />);
    
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it('passes through HTML input attributes', () => {
    render(
      <Input
        id="test-input"
        name="testName"
        maxLength={100}
        minLength={5}
        pattern="[A-Za-z]+"
        required
        autoComplete="off"
        data-testid="custom-input"
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'test-input');
    expect(input).toHaveAttribute('name', 'testName');
    expect(input).toHaveAttribute('maxLength', '100');
    expect(input).toHaveAttribute('minLength', '5');
    expect(input).toHaveAttribute('pattern', '[A-Za-z]+');
    expect(input).toHaveAttribute('required');
    expect(input).toHaveAttribute('autoComplete', 'off');
    expect(input).toHaveAttribute('data-testid', 'custom-input');
  });

  it('has proper accessibility attributes', () => {
    render(
      <Input
        aria-label="Accessible input"
        aria-describedby="helper-text"
        aria-required="true"
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-label', 'Accessible input');
    expect(input).toHaveAttribute('aria-describedby', 'helper-text');
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  it('supports keyboard navigation', () => {
    const handleKeyDown = vi.fn();
    render(<Input onKeyDown={handleKeyDown} />);
    
    const input = screen.getByRole('textbox');
    
    // Focus the input
    input.focus();
    expect(input).toHaveFocus();
    
    // Press Enter
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(handleKeyDown).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'Enter',
        code: 'Enter',
      })
    );
    
    // Press Tab
    fireEvent.keyDown(input, { key: 'Tab', code: 'Tab' });
    expect(handleKeyDown).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'Tab',
        code: 'Tab',
      })
    );
  });

  it('has focus ring styles', () => {
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
  });

  // Form validation tests
  it('shows invalid state correctly', () => {
    render(<Input aria-invalid="true" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('handles form submission', () => {
    const handleSubmit = vi.fn((e) => e.preventDefault());
    render(
      <form onSubmit={handleSubmit}>
        <Input name="test" />
        <button type="submit">Submit</button>
      </form>
    );
    
    const input = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button');
    
    fireEvent.change(input, { target: { value: 'test data' } });
    fireEvent.click(submitButton);
    
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  // Performance test
  it('renders quickly', async () => {
    const renderTime = await testUtils.createPerformanceTestHelpers().measureRenderTime(
      () => render(<Input placeholder="Performance test" />)
    );
    
    // Should render in under 50ms
    expect(renderTime).toBeLessThan(50);
  });

  // Edge cases
  it('handles empty value', () => {
    render(<Input value="" onChange={() => {}} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('');
  });

  it('handles null value gracefully', () => {
    render(<Input value={null as any} onChange={() => {}} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('handles undefined value gracefully', () => {
    render(<Input value={undefined} onChange={() => {}} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('handles long text values', () => {
    const longText = 'a'.repeat(1000);
    render(<Input value={longText} onChange={() => {}} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue(longText);
  });

  it('handles special characters', () => {
    const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    render(<Input value={specialText} onChange={() => {}} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue(specialText);
  });

  it('handles Unicode characters', () => {
    const unicodeText = '你好世界 🌍 こんにちは';
    render(<Input value={unicodeText} onChange={() => {}} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue(unicodeText);
  });

  // Browser compatibility
  it('works with different event types', () => {
    const handleInput = vi.fn();
    render(<Input onInput={handleInput} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.input(input, { target: { value: 'input event' } });
    
    expect(handleInput).toHaveBeenCalledTimes(1);
  });

  it('handles paste events', () => {
    const handlePaste = vi.fn();
    render(<Input onPaste={handlePaste} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.paste(input, {
      clipboardData: {
        getData: () => 'pasted text',
      },
    });
    
    expect(handlePaste).toHaveBeenCalledTimes(1);
  });

  it('handles cut events', () => {
    const handleCut = vi.fn();
    render(<Input onCut={handleCut} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.cut(input);
    
    expect(handleCut).toHaveBeenCalledTimes(1);
  });
});