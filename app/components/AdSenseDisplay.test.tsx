import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import AdSenseDisplay from './AdSenseDisplay';

describe('AdSenseDisplay Component', () => {
  it('renders advertisement container and adsbygoogle element', () => {
    render(<AdSenseDisplay />);
    expect(screen.getByText('Advertisement')).toBeInTheDocument();
  });
});
