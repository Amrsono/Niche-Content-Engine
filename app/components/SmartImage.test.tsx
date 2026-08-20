import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import SmartImage from './SmartImage';

describe('SmartImage Component', () => {
  it('renders initial image source and passes accessibility alt text', () => {
    render(<SmartImage initialSrc="https://images.example.com/test.jpg" alt="Test Graphic" />);
    const img = screen.getByAltText('Test Graphic');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://images.example.com/test.jpg');
  });
});
