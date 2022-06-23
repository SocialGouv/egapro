import React, { ReactNode } from "react"
import { Icon as IconChakra, Box, IconProps, ChakraComponent } from "@chakra-ui/react"
import { SearchIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/solid"
import {
  LightBulbIcon,
  UserIcon,
  UserCircleIcon,
  UserGroupIcon,
  CalendarIcon,
  CurrencyEuroIcon,
  TrendingUpIcon,
  ArrowNarrowLeftIcon,
  ExclamationIcon,
  XCircleIcon as XCircleLineIcon,
  OfficeBuildingIcon,
  TrashIcon,
  MenuIcon,
  QuestionMarkCircleIcon,
  LogoutIcon,
  LoginIcon,
  ExternalLinkIcon,
  ChevronRightIcon,
  PencilIcon,
  PlusCircleIcon,
} from "@heroicons/react/outline"

type SvgComponent = ChakraComponent<"svg", Record<string, unknown>>

const Icon: SvgComponent = ((props: IconProps) => (
  <IconChakra aria-hidden="true" sx={{ verticalAlign: "middle" }} {...props} />
)) as SvgComponent

export const IconText = ({ children }: { children: ReactNode }) => {
  return (
    <Box fontSize="xs" fontWeight="bold" lineHeight={1} aria-hidden="true">
      {children}
    </Box>
  )
}

export const IconEdit: SvgComponent = (props) => <Icon as={PencilIcon} {...props} />

export const IconSearch: SvgComponent = (props) => <Icon as={SearchIcon} {...props} />

export const IconValid: SvgComponent = (props) => <Icon as={CheckCircleIcon} {...props} />

export const IconInvalid: SvgComponent = (props) => <Icon as={XCircleIcon} {...props} />

export const IconLamp: SvgComponent = (props) => <Icon as={LightBulbIcon} {...props} />

export const IconPeople: SvgComponent = (props) => <Icon as={UserIcon} {...props} />

export const IconPeopleCircle: SvgComponent = (props) => <Icon as={UserCircleIcon} {...props} />

export const IconCalendar: SvgComponent = (props) => <Icon as={CalendarIcon} {...props} />

export const IconMoney: SvgComponent = (props) => <Icon as={CurrencyEuroIcon} {...props} />

export const IconGrow: SvgComponent = (props) => <Icon as={TrendingUpIcon} {...props} />

export const IconBack: SvgComponent = (props) => <Icon as={ArrowNarrowLeftIcon} {...props} />

export const IconFemale: SvgComponent = (props) => (
  <Icon {...props}>
    <path
      d="M12 2C8.691 2 6 4.691 6 8c0 2.967 2.167 5.432 5 5.91V17H8v2h3v2.988h2V19h3v-2h-3v-3.09c2.833-.479 5-2.943 5-5.91 0-3.309-2.691-6-6-6zm0 10c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4z"
      fill="currentColor"
    />
  </Icon>
)

export const IconMale: SvgComponent = (props) => (
  <Icon {...props}>
    <path
      d="M20 11V4h-7l2.793 2.793-4.322 4.322A5.961 5.961 0 0 0 8 10c-3.309 0-6 2.691-6 6s2.691 6 6 6 6-2.691 6-6c0-1.294-.416-2.49-1.115-3.471l4.322-4.322L20 11zM8 20c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4z"
      fill="currentColor"
    />
  </Icon>
)

export const IconWarning: SvgComponent = (props) => <Icon as={ExclamationIcon} {...props} />

export const IconCircleCross: SvgComponent = (props) => <Icon as={XCircleLineIcon} {...props} />

export const IconOfficeBuilding: SvgComponent = (props) => <Icon as={OfficeBuildingIcon} {...props} />

export const IconDelete: SvgComponent = (props) => <Icon as={TrashIcon} {...props} />

export const IconPlusCircle: SvgComponent = (props) => <Icon as={PlusCircleIcon} {...props} />

export const IconMenu: SvgComponent = (props) => <Icon as={MenuIcon} {...props} />

export const IconLogout: SvgComponent = (props) => <Icon as={LogoutIcon} {...props} />

export const IconLogin: SvgComponent = (props) => <Icon as={LoginIcon} {...props} />

export const IconQuestionMarkCircle: SvgComponent = (props) => <Icon as={QuestionMarkCircleIcon} {...props} />

export const IconUserGroup: SvgComponent = (props) => <Icon as={UserGroupIcon} {...props} />

export const IconDrag: SvgComponent = (props) => (
  <Icon {...props}>
    <path
      d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
      fill="currentColor"
    />
  </Icon>
)

export const IconExternalLink: SvgComponent = (props) => <Icon as={ExternalLinkIcon} {...props} />

export const IconArrowRight: SvgComponent = (props) => <Icon as={ChevronRightIcon} {...props} />
