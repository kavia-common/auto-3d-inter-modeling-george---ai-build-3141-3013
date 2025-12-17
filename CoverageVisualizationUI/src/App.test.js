import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app title and controls', () => {
  render(<App />);
  expect(screen.getByText(/Coverage Visualization UI/i)).toBeInTheDocument();
  expect(screen.getByText(/Controls/i)).toBeInTheDocument();
  expect(screen.getByText(/Export/i)).toBeInTheDocument();
});
