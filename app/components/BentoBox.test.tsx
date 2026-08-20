import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BentoBox } from './BentoBox';

describe('BentoBox Component', () => {
  it('renders children with custom className and styles', () => {
    render(
      <BentoBox className="custom-box">
        <div>Bento Content</div>
      </BentoBox>
    );

    expect(screen.getByText('Bento Content')).toBeInTheDocument();
  });
});
