import { Box } from '@fower/react'
import { CatalogueBox } from '../EditorLayout/Catalogue/CatalogueBox'
import { SpacePopover } from './SpacePopover'

export const Sidebar = () => {
  return (
    <Box
      column
      borderRight
      borderGray100
      flex-1
      display={['none', 'none', 'flex']}
      bgZinc100
      px2
    >
      <SpacePopover />
      <Box gray600 px3 bgWhite rounded2XL>
        <CatalogueBox />
      </Box>
    </Box>
  )
}
