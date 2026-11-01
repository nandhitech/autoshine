import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the AutoShine landing page', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /autoshine/i })).toBeDefined();
  expect(screen.getByText(/premium detailing studio/i)).toBeDefined();
  expect(screen.getByRole('button', { name: /book a detail/i })).toBeDefined();
});
