import { fireEvent, render, screen } from '@testing-library/react';
import { AnalyticalStates } from '../src/AnalyticalStates';

it.each(['overview', 'detail'] as const)('distinguishes pending, failed and empty coverage in %s', view => {
  render(<AnalyticalStates view={view} />);
  const choose = (value: string) => fireEvent.change(screen.getByLabelText('Simulated analytical state'), { target: { value } });
  expect(screen.getByRole('status')).toHaveTextContent('Analytical data is not connected');
  choose('loading');
  expect(screen.getByRole('status')).toHaveTextContent('Results are pending');
  choose('error');
  expect(screen.getByRole('status')).toHaveTextContent('an error does not mean there are no records');
  fireEvent.click(screen.getByRole('button', { name: 'Simulate retry' }));
  expect(screen.getByRole('status')).toHaveTextContent('Loading analytical data');
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  choose('no-imports');
  expect(screen.getByRole('status')).toHaveTextContent('Missing imports do not represent zero faults');
  choose('no-matches');
  expect(screen.getByRole('status')).toHaveTextContent('no records match the selected filters');
  fireEvent.click(screen.getByRole('button', { name: 'Reset state preview' }));
  expect(screen.getByRole('status')).toHaveTextContent('Analytical data is not connected');
  expect(screen.queryByText(/Simulated state ·/)).not.toBeInTheDocument();
});
