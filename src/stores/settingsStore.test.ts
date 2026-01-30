import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSettingsStore } from './settingsStore'
import { commands } from '@/bindings'

// Mock the commands
vi.mock('@/bindings', () => ({
    commands: {
        getAppSettings: vi.fn(),
        getDefaultSettings: vi.fn(),
    }
}))

describe('SettingsStore', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('correctly manages multiple LLM prompts', async () => {
        const mockSettings = {
            status: 'ok',
            data: {
                post_process_prompts: [
                    { id: 'p1', name: 'Prompt 1', prompt: 'Prompt 1 Text' },
                    { id: 'p2', name: 'Prompt 2', prompt: 'Prompt 2 Text' }
                ],
                post_process_selected_prompt_id: 'p1',
                post_process_enabled: true,
            }
        }

        // @ts-ignore
        commands.getAppSettings.mockResolvedValue(mockSettings)
        // @ts-ignore
        commands.getDefaultSettings.mockResolvedValue(mockSettings)

        const store = useSettingsStore.getState()
        await store.initialize()

        const settings = useSettingsStore.getState().settings
        expect(settings?.post_process_prompts).toHaveLength(2)
        expect(settings?.post_process_selected_prompt_id).toBe('p1')
    })

    it('correctly handles provider presets including LM Studio', async () => {
        const mockSettings = {
            status: 'ok',
            data: {
                post_process_providers: [
                    { id: 'openai', label: 'OpenAI' },
                    { id: 'lm_studio', label: 'LM Studio' },
                    { id: 'custom', label: 'Custom' }
                ],
                post_process_provider_id: 'lm_studio'
            }
        }

        // @ts-ignore
        commands.getAppSettings.mockResolvedValue(mockSettings)
        // @ts-ignore
        commands.getDefaultSettings.mockResolvedValue(mockSettings)

        const store = useSettingsStore.getState()
        await store.initialize()

        const settings = useSettingsStore.getState().settings
        expect(settings?.post_process_providers).toHaveLength(3)
        expect(settings?.post_process_providers?.find(p => p.id === 'lm_studio')?.label).toBe('LM Studio')
    })
})
