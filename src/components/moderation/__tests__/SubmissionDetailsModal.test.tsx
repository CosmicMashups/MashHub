import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubmissionDetailsModal } from '../SubmissionDetailsModal';
import * as moderationService from '../../../services/moderationService';

vi.mock('../../../services/moderationService', () => ({
  fetchSubmissionById: vi.fn(),
}));

vi.mock('../../../hooks/useCoverImage', () => ({
  useCoverImage: () => ({
    coverImageUrl: 'https://example.com/cover.jpg',
    loading: false,
    source: 'spotify',
  }),
}));

vi.mock('../../../hooks/useImageColors', () => ({
  useImageColors: () => ({
    colors: null,
    gradient: 'linear-gradient(to bottom, #111, #222)',
    loading: false,
  }),
}));

vi.mock('../../../hooks/useMediaQuery', () => ({
  useIsMobile: () => false,
}));

describe('SubmissionDetailsModal', () => {
  const mockSubmission: moderationService.NewSongRow = {
    id: 'sub-123',
    title: 'Blue Bird',
    artist: 'Ikimono Gakari',
    type: 'Anime',
    origin: 'Naruto Shippuden',
    season: 'Spring',
    year: 2008,
    notes: 'Opening theme 3',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    submitted_by_user_id: 'user-1',
    submitted_by_username: 'NarutoFan',
    status: 'pending',
    submitted_at: '2026-01-01T00:00:00Z',
    reviewed_by_user_id: null,
    reviewed_by_username: null,
    reviewed_at: null,
    rejection_reason: null,
    revision_notes: null,
    approved_song_id: null,
    new_song_sections: [
      {
        section_id: 'sec-1',
        song_id: 'sub-123',
        part: 'Intro',
        bpm: 152,
        key: 'F Minor',
        section_order: 1,
        created_at: '2026-01-01T00:00:00Z',
      },
      {
        section_id: 'sec-2',
        song_id: 'sub-123',
        part: 'Chorus',
        bpm: 152,
        key: 'Ab Major',
        section_order: 2,
        created_at: '2026-01-01T00:00:00Z',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <SubmissionDetailsModal
        isOpen={false}
        submissionId="sub-123"
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders loading state initially then displays song details', async () => {
    vi.mocked(moderationService.fetchSubmissionById).mockResolvedValueOnce(mockSubmission);

    render(
      <SubmissionDetailsModal
        isOpen={true}
        submissionId="sub-123"
        onClose={vi.fn()}
      />
    );

    // Initial loading or immediate resolve
    await waitFor(() => {
      expect(screen.getByText('Blue Bird')).toBeDefined();
    });

    expect(screen.getByText(/by Ikimono Gakari/i)).toBeDefined();
    expect(screen.getByText('Naruto Shippuden')).toBeDefined();
    expect(screen.getByText('Anime')).toBeDefined();
    expect(screen.getByText('Spring')).toBeDefined();
    expect(screen.getByText('2008')).toBeDefined();
    expect(screen.getByText('NarutoFan')).toBeDefined();

    // Check Song Structure table
    expect(screen.getByText('Intro')).toBeDefined();
    expect(screen.getByText('Chorus')).toBeDefined();
    expect(screen.getByText('F Minor')).toBeDefined();
    expect(screen.getByText('Ab Major')).toBeDefined();
  });

  it('renders rejection reason and Edit / Resubmit button when status is rejected', async () => {
    const rejectedSubmission: moderationService.NewSongRow = {
      ...mockSubmission,
      status: 'rejected',
      rejection_reason: 'Incorrect BPM on chorus',
    };
    vi.mocked(moderationService.fetchSubmissionById).mockResolvedValueOnce(rejectedSubmission);

    const onEdit = vi.fn();
    render(
      <SubmissionDetailsModal
        isOpen={true}
        submissionId="sub-123"
        onClose={vi.fn()}
        onEdit={onEdit}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Rejection Reason')).toBeDefined();
      expect(screen.getByText('Incorrect BPM on chorus')).toBeDefined();
    });

    const editBtn = screen.getByRole('button', { name: /Edit \/ Resubmit/i });
    expect(editBtn).toBeDefined();
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledWith('sub-123');
  });

  it('calls onClose when close button is clicked', async () => {
    vi.mocked(moderationService.fetchSubmissionById).mockResolvedValueOnce(mockSubmission);
    const onClose = vi.fn();

    render(
      <SubmissionDetailsModal
        isOpen={true}
        submissionId="sub-123"
        onClose={onClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Blue Bird')).toBeDefined();
    });

    const closeBtn = screen.getByLabelText('Close song details');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
