import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './components/Home';

test('shows the vehicle verification overview and detection link', () => {
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );

  expect(screen.getByRole('heading', { name: /fake vehicle detection system/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /start detection/i })).toHaveAttribute('href', '/detect');
});
