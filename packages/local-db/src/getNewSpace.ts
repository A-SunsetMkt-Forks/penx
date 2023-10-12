import { nanoid } from 'nanoid'
import { SettingsType } from '@penx/constants'
import { ISpace } from './interfaces/ISpace'

export function getNewSpace(name: string): ISpace {
  const spaceId = nanoid()
  return {
    id: spaceId,
    name,
    isActive: false,
    changes: {},
    catalogue: [],
    favorites: [],
    settings: {
      [SettingsType.SYNC]: {
        repo: '',
        githubToken: '',
        privateKey: '',
      },

      [SettingsType.APPEARANCE]: {},

      [SettingsType.PREFERENCES]: {},

      [SettingsType.HOTKEYS]: {},

      [SettingsType.EXTENSIONS]: {},
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}
