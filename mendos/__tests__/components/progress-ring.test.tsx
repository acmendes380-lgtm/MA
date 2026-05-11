// mendos/__tests__/components/progress-ring.test.tsx
import { render, screen } from '@testing-library/react'
import { ProgressRing } from '@/components/ui/progress-ring'

jest.mock('framer-motion', () => ({
  motion: {
    circle: (props: React.SVGProps<SVGCircleElement>) => <circle {...props} />,
  },
}))

describe('ProgressRing', () => {
  it('shows percentage label by default', () => {
    render(<ProgressRing value={75} />)
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('hides label when showValue is false', () => {
    render(<ProgressRing value={75} showValue={false} />)
    expect(screen.queryByText('75%')).not.toBeInTheDocument()
  })

  it('clamps value over max to 100%', () => {
    render(<ProgressRing value={150} max={100} />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('shows optional label', () => {
    render(<ProgressRing value={50} label="Habits" />)
    expect(screen.getByText('Habits')).toBeInTheDocument()
  })
})
