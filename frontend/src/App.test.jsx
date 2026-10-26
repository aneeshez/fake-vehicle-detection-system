import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from './components/Home';
import AuthGate from './components/AuthGate';

const { getMock, postMock, refreshMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock('./api', () => ({
  api: { defaults: { baseURL: 'http://localhost:8000/api' }, get: getMock, post: postMock },
  refreshCsrfToken: refreshMock,
}));

describe('vehicle detection interface', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    refreshMock.mockReset();
    getMock.mockResolvedValue({ data: { authenticated: false } });
    refreshMock.mockResolvedValue('csrf-token');
  });

  it('shows the product overview and detection link', () => {
    render(<MemoryRouter><Home /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: /fake vehicle detection/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /start detection/i })).toHaveAttribute('href', '/detect');
  });

  it('requires sign-in before showing vehicle records', async () => {
    render(<AuthGate>{() => <p>Private vehicle records</p>}</AuthGate>);
    expect(await screen.findByRole('heading', { name: /sign in to continue/i })).toBeInTheDocument();
    expect(screen.queryByText('Private vehicle records')).not.toBeInTheDocument();
  });

  it('signs in with a CSRF-protected session request', async () => {
    postMock.mockResolvedValue({ data: { authenticated: true, username: 'operator' } });
    render(<AuthGate>{({ username }) => <p>Signed in: {username}</p>}</AuthGate>);
    await screen.findByRole('heading', { name: /sign in to continue/i });
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'operator' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'correct-password' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(postMock).toHaveBeenCalledWith('/auth/login/', {
      username: 'operator', password: 'correct-password',
    }, { headers: { 'X-CSRFToken': 'csrf-token' } }));
    expect(await screen.findByText('Signed in: operator')).toBeInTheDocument();
  });
});
