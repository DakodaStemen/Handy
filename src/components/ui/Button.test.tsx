import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from './Button'

describe('Button Component', () => {
    it('renders with children text', () => {
        render(<Button>Click Me</Button>)
        expect(screen.getByText('Click Me')).toBeInTheDocument()
    })

    it('is disabled when the disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>)
        const button = screen.getByRole('button')
        expect(button).toBeDisabled()
    })

    it('applies the correct variant class', () => {
        render(<Button variant="danger">Danger</Button>)
        const button = screen.getByRole('button')
        expect(button.className).toContain('bg-red-600')
    })
})
