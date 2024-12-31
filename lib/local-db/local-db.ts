import Dexie, { Table } from 'dexie'
import { IAsset } from '../model/IAsset'
import { IBlock } from '../model/IBlock'
import { IDatabase } from '../model/IDatabase'
import { IFile } from '../model/IFile'
import { IPage } from '../model/IPage'
import { uniqueId } from '../unique-id'

class LocalDB extends Dexie {
  file!: Table<IFile, string>
  asset!: Table<IAsset, string>
  block!: Table<IBlock, string>
  page!: Table<IPage, string>
  database!: Table<IDatabase, string>

  constructor() {
    super('penx-local')
    this.version(5).stores({
      // Primary key and indexed props
      file: 'id, hash',
      asset: 'id, url, isPublic, isTrashed',
      page: 'id, userId, parentId, isJournal',
      database: 'id, userId, parentId',
      block: 'id, userId, parentId, pageId, type',
    })
  }

  async addFile(hash: string, file: File) {
    try {
      return this.file.add({
        id: uniqueId(),
        hash,
        file,
      })
    } catch (error) {}
  }
}

export const localDB = new LocalDB()
