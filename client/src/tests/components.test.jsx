import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../components/shared/Badge';

describe('Shared UI Badges', () => {
  it('renders status badge correctly', () => {
    render(<StatusBadge status="in_progress" />);
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
  });

  it('renders priority badge with score', () => {
    render(<PriorityBadge priority="critical" score={85} />);
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    expect(screen.getByText('(85)')).toBeInTheDocument();
  });

  it('renders category badge label', () => {
    render(<CategoryBadge category="road_damage" />);
    expect(screen.getByText('Road & Pothole')).toBeInTheDocument();
  });
});
