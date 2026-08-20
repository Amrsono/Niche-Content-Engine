import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BaseAd } from './BaseAd';

// Mock Next.js CSS modules
vi.mock('./AdStyles.module.css', () => ({
  default: {
    adWrapper: 'adWrapper',
    adWrapperInArticle: 'adWrapperInArticle',
    adLabel: 'adLabel',
    sidebarAd: 'sidebarAd',
    sidebarAdLabel: 'sidebarAdLabel',
    sidebarColumn: 'sidebarColumn',
  },
}));

describe('BaseAd component', () => {
  it('renders display variant with "Advertisement" label by default', () => {
    render(<BaseAd variant="display" />);
    expect(screen.getByText('Advertisement')).toBeDefined();
  });

  it('renders in-article variant with custom label', () => {
    render(<BaseAd variant="in-article" label="Sponsored Content" />);
    expect(screen.getByText('Sponsored Content')).toBeDefined();
  });

  it('renders banner variant with custom children', () => {
    render(
      <BaseAd variant="banner" label="Partner Offer">
        <span data-testid="custom-child">Custom Banner</span>
      </BaseAd>
    );
    expect(screen.getByTestId('custom-child')).toBeDefined();
    expect(screen.getByText('Partner Offer')).toBeDefined();
  });

  it('renders sidebar variant inside sidebarColumn wrapper', () => {
    const { container } = render(<BaseAd variant="sidebar" label="Ad" />);
    const column = container.querySelector('.sidebarColumn');
    expect(column).not.toBeNull();
  });

  it('renders adsbygoogle ins tag when slotId is provided', () => {
    const { container } = render(<BaseAd variant="display" slotId="1234567890" />);
    const ins = container.querySelector('ins.adsbygoogle');
    expect(ins).not.toBeNull();
    expect(ins?.getAttribute('data-ad-slot')).toBe('1234567890');
  });

  it('renders nothing inside wrapper when no slotId and no children', () => {
    const { container } = render(<BaseAd variant="display" />);
    const ins = container.querySelector('ins');
    expect(ins).toBeNull();
  });

  it('passes custom className and style to wrapper', () => {
    const { container } = render(
      <BaseAd variant="display" className="my-custom" style={{ marginTop: '10px' }} />
    );
    const wrapper = container.querySelector('.adWrapper.my-custom') as HTMLElement | null;
    expect(wrapper).not.toBeNull();
    expect(wrapper?.style.marginTop).toBe('10px');
  });
});
