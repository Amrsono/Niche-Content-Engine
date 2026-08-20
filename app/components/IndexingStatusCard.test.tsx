import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IndexingStatusCard } from './IndexingStatusCard';

describe('IndexingStatusCard Component', () => {
  it('renders credential status correctly in live mode', () => {
    render(
      <IndexingStatusCard
        quotaUsed={50}
        dailyQuota={200}
        credentialStatus="live"
      />
    );

    expect(screen.getByTestId('cred-badge')).toHaveTextContent(/Service Account Connected/);
    expect(screen.getByTestId('quota-card')).toHaveTextContent('50 / 200 URLs');
  });

  it('renders mock mode warning and credential badge', () => {
    render(
      <IndexingStatusCard
        quotaUsed={10}
        dailyQuota={200}
        credentialStatus="mock"
      />
    );

    expect(screen.getByTestId('cred-badge')).toHaveTextContent(/Mock Mode/);
  });

  it('renders quota warning when present', () => {
    render(
      <IndexingStatusCard
        quotaUsed={190}
        dailyQuota={200}
        credentialStatus="live"
        quotaWarning="Approaching daily quota limit"
      />
    );

    expect(screen.getByTestId('quota-warning')).toHaveTextContent('Approaching daily quota limit');
  });

  it('renders summary statistics when provided', () => {
    render(
      <IndexingStatusCard
        quotaUsed={25}
        dailyQuota={200}
        credentialStatus="live"
        successCount={20}
        mockCount={3}
        failCount={2}
      />
    );

    expect(screen.getByTestId('stats-summary')).toBeInTheDocument();
    expect(screen.getByText('20 Indexed')).toBeInTheDocument();
    expect(screen.getByText('3 Mocked')).toBeInTheDocument();
    expect(screen.getByText('2 Failed')).toBeInTheDocument();
  });
});
