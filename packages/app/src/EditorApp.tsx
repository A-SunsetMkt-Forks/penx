import { FC, PropsWithChildren, useEffect } from 'react'
import { Provider } from 'jotai'
import { isServer } from '@penx/constants'
import { useWorkers } from '@penx/hooks'
import { appLoader, useLoaderStatus } from '@penx/loader'
import { JotaiNexus, store } from '@penx/store'
import { ClientOnly } from './components/ClientOnly'
import { EditorLayout } from './EditorLayout/EditorLayout'

if (!isServer) {
  appLoader.init()
}

export const EditorApp: FC<PropsWithChildren> = ({ children }) => {
  useWorkers()

  const { isLoaded } = useLoaderStatus()

  useEffect(() => {
    persist()
      .then((d) => {
        //
      })
      .catch((e) => {
        //
      })
  }, [])

  if (!isLoaded) {
    return null
  }

  return (
    <ClientOnly>
      <Provider store={store}>
        <JotaiNexus />
        <EditorLayout />
      </Provider>
    </ClientOnly>
  )
}

async function persist() {
  if (navigator.storage && navigator.storage.persist) {
    return navigator.storage.persist()
  }
}
