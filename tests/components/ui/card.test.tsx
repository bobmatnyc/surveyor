import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { testUtils } from '@/tests/utils/unit-test-helpers';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders with default props', () => {
      render(<Card>Card content</Card>);
      
      const card = screen.getByText('Card content');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-lg', 'border', 'bg-card');
    });

    it('accepts custom className', () => {
      render(<Card className="custom-card">Card content</Card>);
      
      const card = screen.getByText('Card content');
      expect(card).toHaveClass('custom-card');
    });

    it('passes through HTML attributes', () => {
      render(
        <Card data-testid="test-card" id="main-card">
          Card content
        </Card>
      );
      
      const card = screen.getByTestId('test-card');
      expect(card).toHaveAttribute('id', 'main-card');
    });

    it('has proper semantic structure', () => {
      render(<Card>Card content</Card>);
      
      const card = screen.getByText('Card content');
      expect(card.tagName).toBe('DIV');
    });
  });

  describe('CardHeader', () => {
    it('renders with default props', () => {
      render(<CardHeader>Header content</CardHeader>);
      
      const header = screen.getByText('Header content');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5');
    });

    it('accepts custom className', () => {
      render(<CardHeader className="custom-header">Header content</CardHeader>);
      
      const header = screen.getByText('Header content');
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('CardTitle', () => {
    it('renders with default props', () => {
      render(<CardTitle>Card Title</CardTitle>);
      
      const title = screen.getByText('Card Title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('text-2xl', 'font-semibold');
    });

    it('accepts custom className', () => {
      render(<CardTitle className="custom-title">Card Title</CardTitle>);
      
      const title = screen.getByText('Card Title');
      expect(title).toHaveClass('custom-title');
    });

    it('has proper semantic structure', () => {
      render(<CardTitle>Card Title</CardTitle>);
      
      const title = screen.getByText('Card Title');
      expect(title.tagName).toBe('H3');
    });
  });

  describe('CardDescription', () => {
    it('renders with default props', () => {
      render(<CardDescription>Card description</CardDescription>);
      
      const description = screen.getByText('Card description');
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });

    it('accepts custom className', () => {
      render(<CardDescription className="custom-desc">Card description</CardDescription>);
      
      const description = screen.getByText('Card description');
      expect(description).toHaveClass('custom-desc');
    });

    it('has proper semantic structure', () => {
      render(<CardDescription>Card description</CardDescription>);
      
      const description = screen.getByText('Card description');
      expect(description.tagName).toBe('P');
    });
  });

  describe('CardContent', () => {
    it('renders with default props', () => {
      render(<CardContent>Card content</CardContent>);
      
      const content = screen.getByText('Card content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('p-6', 'pt-0');
    });

    it('accepts custom className', () => {
      render(<CardContent className="custom-content">Card content</CardContent>);
      
      const content = screen.getByText('Card content');
      expect(content).toHaveClass('custom-content');
    });
  });

  describe('CardFooter', () => {
    it('renders with default props', () => {
      render(<CardFooter>Card footer</CardFooter>);
      
      const footer = screen.getByText('Card footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
    });

    it('accepts custom className', () => {
      render(<CardFooter className="custom-footer">Card footer</CardFooter>);
      
      const footer = screen.getByText('Card footer');
      expect(footer).toHaveClass('custom-footer');
    });
  });

  describe('Complete Card Structure', () => {
    it('renders full card with all components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>This is a test card</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Main content goes here</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );
      
      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('This is a test card')).toBeInTheDocument();
      expect(screen.getByText('Main content goes here')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('maintains proper hierarchy', () => {
      render(
        <Card data-testid="card">
          <CardHeader data-testid="header">
            <CardTitle data-testid="title">Test Card</CardTitle>
            <CardDescription data-testid="description">Description</CardDescription>
          </CardHeader>
          <CardContent data-testid="content">Content</CardContent>
          <CardFooter data-testid="footer">Footer</CardFooter>
        </Card>
      );
      
      const card = screen.getByTestId('card');
      const header = screen.getByTestId('header');
      const title = screen.getByTestId('title');
      const description = screen.getByTestId('description');
      const content = screen.getByTestId('content');
      const footer = screen.getByTestId('footer');
      
      expect(card).toContainElement(header);
      expect(card).toContainElement(content);
      expect(card).toContainElement(footer);
      expect(header).toContainElement(title);
      expect(header).toContainElement(description);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes when needed', () => {
      render(
        <Card role="article" aria-labelledby="card-title">
          <CardHeader>
            <CardTitle id="card-title">Accessible Card</CardTitle>
          </CardHeader>
          <CardContent>Accessible content</CardContent>
        </Card>
      );
      
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-labelledby', 'card-title');
      
      const title = screen.getByText('Accessible Card');
      expect(title).toHaveAttribute('id', 'card-title');
    });

    it('supports keyboard navigation', () => {
      render(
        <Card tabIndex={0}>
          <CardContent>Focusable card</CardContent>
        </Card>
      );
      
      const card = screen.getByText('Focusable card').parentElement;
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Performance', () => {
    it('renders quickly', async () => {
      const renderTime = await testUtils.createPerformanceTestHelpers().measureRenderTime(
        () => render(
          <Card>
            <CardHeader>
              <CardTitle>Performance Test</CardTitle>
            </CardHeader>
            <CardContent>Content</CardContent>
          </Card>
        )
      );
      
      expect(renderTime).toBeLessThan(50);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty content', () => {
      render(<Card></Card>);
      
      const card = screen.getByRole('generic');
      expect(card).toBeInTheDocument();
      expect(card).toBeEmptyDOMElement();
    });

    it('handles null children', () => {
      render(<Card>{null}</Card>);
      
      const card = screen.getByRole('generic');
      expect(card).toBeInTheDocument();
    });

    it('handles complex nested content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>
              <span>Complex</span>
              <em>Title</em>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p>Nested paragraph</p>
              <ul>
                <li>List item 1</li>
                <li>List item 2</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      );
      
      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Nested paragraph')).toBeInTheDocument();
      expect(screen.getByText('List item 1')).toBeInTheDocument();
      expect(screen.getByText('List item 2')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies correct default styles', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Styled Card</CardTitle>
            <CardDescription>With description</CardDescription>
          </CardHeader>
          <CardContent>Content</CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
      );
      
      const card = screen.getByText('Styled Card').closest('div');
      expect(card).toHaveClass('rounded-lg', 'border', 'bg-card');
      
      const header = screen.getByText('Styled Card').parentElement;
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5');
      
      const title = screen.getByText('Styled Card');
      expect(title).toHaveClass('text-2xl', 'font-semibold');
      
      const description = screen.getByText('With description');
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });

    it('combines custom classes with defaults', () => {
      render(
        <Card className="shadow-lg">
          <CardTitle className="text-blue-600">Custom Styled</CardTitle>
        </Card>
      );
      
      const card = screen.getByText('Custom Styled').closest('div');
      expect(card).toHaveClass('shadow-lg', 'rounded-lg', 'border');
      
      const title = screen.getByText('Custom Styled');
      expect(title).toHaveClass('text-blue-600', 'text-2xl', 'font-semibold');
    });
  });
});