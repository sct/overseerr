import GenreSelector from '@app/components/GenreSelector';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { SWRConfig } from 'swr';

const mockGenres = [
  { id: 28, name: 'Action' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror' },
  { id: 10749, name: 'Romance' },
];

const MockSWRProvider = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig
    value={{
      provider: () =>
        new Map([
          ['/api/v1/genres/movie', { data: mockGenres }],
          ['/api/v1/genres/tv', { data: mockGenres }],
        ]),
      dedupingInterval: 0,
    }}
  >
    {children}
  </SWRConfig>
);

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <IntlProvider locale="en" messages={{}}>
    <MockSWRProvider>{children}</MockSWRProvider>
  </IntlProvider>
);

describe('GenreSelector', () => {
  const mockSetFieldValue = jest.fn();

  beforeEach(() => {
    mockSetFieldValue.mockClear();
  });

  describe('Basic rendering', () => {
    it('renders the genre selector', () => {
      render(
        <TestWrapper>
          <GenreSelector value="" setFieldValue={mockSetFieldValue} />
        </TestWrapper>
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('displays "No Exclusions" option by default', async () => {
      render(
        <TestWrapper>
          <GenreSelector value="" setFieldValue={mockSetFieldValue} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('No Exclusions')).toBeInTheDocument();
      });
    });

    it('displays server default option in user settings mode', async () => {
      render(
        <TestWrapper>
          <GenreSelector
            value=""
            setFieldValue={mockSetFieldValue}
            serverValue="28|35"
            isUserSettings={true}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Default \(Action, Comedy\)/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Genre selection', () => {
    it('allows selecting individual genres', async () => {
      render(
        <TestWrapper>
          <GenreSelector value="" setFieldValue={mockSetFieldValue} />
        </TestWrapper>
      );

      const selector = screen.getByRole('combobox');
      fireEvent.focus(selector);
      fireEvent.keyDown(selector, { key: 'ArrowDown' });

      await waitFor(() => {
        const actionOption = screen.getByText('Action');
        fireEvent.click(actionOption);
      });

      expect(mockSetFieldValue).toHaveBeenCalledWith('excludedGenres', '28');
    });

    it('allows selecting multiple genres', async () => {
      render(
        <TestWrapper>
          <GenreSelector value="28" setFieldValue={mockSetFieldValue} />
        </TestWrapper>
      );

      const selector = screen.getByRole('combobox');
      fireEvent.focus(selector);
      fireEvent.keyDown(selector, { key: 'ArrowDown' });

      await waitFor(() => {
        const comedyOption = screen.getByText('Comedy');
        fireEvent.click(comedyOption);
      });

      expect(mockSetFieldValue).toHaveBeenCalledWith('excludedGenres', '28|35');
    });

    it('handles "No Exclusions" selection in user settings', async () => {
      render(
        <TestWrapper>
          <GenreSelector
            value="28|35"
            setFieldValue={mockSetFieldValue}
            isUserSettings={true}
          />
        </TestWrapper>
      );

      const selector = screen.getByRole('combobox');
      fireEvent.focus(selector);
      fireEvent.keyDown(selector, { key: 'ArrowDown' });

      await waitFor(() => {
        const noneOption = screen.getByText('No Exclusions');
        fireEvent.click(noneOption);
      });

      expect(mockSetFieldValue).toHaveBeenCalledWith('excludedGenres', 'none');
    });

    it('handles "No Exclusions" selection in non-user settings', async () => {
      render(
        <TestWrapper>
          <GenreSelector value="28|35" setFieldValue={mockSetFieldValue} />
        </TestWrapper>
      );

      const selector = screen.getByRole('combobox');
      fireEvent.focus(selector);
      fireEvent.keyDown(selector, { key: 'ArrowDown' });

      await waitFor(() => {
        const noneOption = screen.getByText('No Exclusions');
        fireEvent.click(noneOption);
      });

      expect(mockSetFieldValue).toHaveBeenCalledWith('excludedGenres', '');
    });

    it('handles server default selection', async () => {
      render(
        <TestWrapper>
          <GenreSelector
            value="28|35"
            setFieldValue={mockSetFieldValue}
            serverValue="18|27"
            isUserSettings={true}
          />
        </TestWrapper>
      );

      const selector = screen.getByRole('combobox');
      fireEvent.focus(selector);
      fireEvent.keyDown(selector, { key: 'ArrowDown' });

      await waitFor(() => {
        const serverOption = screen.getByText(/Default \(Drama, Horror\)/);
        fireEvent.click(serverOption);
      });

      expect(mockSetFieldValue).toHaveBeenCalledWith('excludedGenres', '');
    });
  });

  describe('Value display', () => {
    it('displays selected genres correctly', () => {
      render(
        <TestWrapper>
          <GenreSelector value="28|35" setFieldValue={mockSetFieldValue} />
        </TestWrapper>
      );

      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('Comedy')).toBeInTheDocument();
    });

    it('shows "No Exclusions" when value is empty', () => {
      render(
        <TestWrapper>
          <GenreSelector value="" setFieldValue={mockSetFieldValue} />
        </TestWrapper>
      );

      expect(screen.getByText('No Exclusions')).toBeInTheDocument();
    });

    it('shows server default in user settings mode when value is server', () => {
      render(
        <TestWrapper>
          <GenreSelector
            value="server"
            setFieldValue={mockSetFieldValue}
            serverValue="28|35"
            isUserSettings={true}
          />
        </TestWrapper>
      );

      expect(
        screen.getByText(/Default \(Action, Comedy\)/)
      ).toBeInTheDocument();
    });

    it('shows "No Exclusions" in user settings when value is none', () => {
      render(
        <TestWrapper>
          <GenreSelector
            value="none"
            setFieldValue={mockSetFieldValue}
            isUserSettings={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('No Exclusions')).toBeInTheDocument();
    });
  });

  describe('Genre deduplication', () => {
    it('deduplicates genres by ID when movie and TV genres overlap', () => {
      const duplicatedGenres = [
        { id: 28, name: 'Action' },
        { id: 35, name: 'Comedy' },
      ];

      const CustomSWRProvider = ({
        children,
      }: {
        children: React.ReactNode;
      }) => (
        <SWRConfig
          value={{
            provider: () =>
              new Map([
                ['/api/v1/genres/movie', { data: duplicatedGenres }],
                ['/api/v1/genres/tv', { data: duplicatedGenres }],
              ]),
            dedupingInterval: 0,
          }}
        >
          {children}
        </SWRConfig>
      );

      render(
        <IntlProvider locale="en" messages={{}}>
          <CustomSWRProvider>
            <GenreSelector value="" setFieldValue={mockSetFieldValue} />
          </CustomSWRProvider>
        </IntlProvider>
      );

      const selector = screen.getByRole('combobox');
      fireEvent.focus(selector);
      fireEvent.keyDown(selector, { key: 'ArrowDown' });

      const actionOptions = screen.getAllByText('Action');
      expect(actionOptions).toHaveLength(1);
    });
  });

  describe('Edge cases', () => {
    it('handles invalid genre IDs gracefully', () => {
      render(
        <TestWrapper>
          <GenreSelector value="999|28" setFieldValue={mockSetFieldValue} />
        </TestWrapper>
      );

      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.queryByText('999')).not.toBeInTheDocument();
    });

    it('handles empty server value', () => {
      render(
        <TestWrapper>
          <GenreSelector
            value="server"
            setFieldValue={mockSetFieldValue}
            serverValue=""
            isUserSettings={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/Default \(No Exclusions\)/)).toBeInTheDocument();
    });

    it('handles undefined server value', () => {
      render(
        <TestWrapper>
          <GenreSelector
            value="server"
            setFieldValue={mockSetFieldValue}
            isUserSettings={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/Default \(No Exclusions\)/)).toBeInTheDocument();
    });
  });

  describe('Loading states', () => {
    it('handles loading state when genres are not available', () => {
      const EmptySWRProvider = ({
        children,
      }: {
        children: React.ReactNode;
      }) => (
        <SWRConfig
          value={{
            provider: () => new Map(),
            dedupingInterval: 0,
          }}
        >
          {children}
        </SWRConfig>
      );

      render(
        <IntlProvider locale="en" messages={{}}>
          <EmptySWRProvider>
            <GenreSelector value="" setFieldValue={mockSetFieldValue} />
          </EmptySWRProvider>
        </IntlProvider>
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });
});
