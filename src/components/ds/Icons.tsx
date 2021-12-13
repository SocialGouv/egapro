import React, { ReactNode, FunctionComponent } from "react"
import { Icon as IconChakra, Box } from "@chakra-ui/react"
import {
  HiCheckCircle,
  HiOutlineCalendar,
  HiOutlineLightBulb,
  HiOutlineTrendingUp,
  HiOutlineUser,
  HiXCircle,
  IoFemaleSharp,
  IoMaleSharp,
  RiCloseCircleLine,
  RiMoneyEuroCircleLine,
  RiAlertLine,
  RiArrowGoBackLine,
  RiSearchLine,
  HiOutlineOfficeBuilding,
  RiDeleteBinLine,
  MdOutlineDragIndicator,
  RiExternalLinkLine,
  RiArrowDropRightLine,
} from "react-icons/all"
import { IconType } from "react-icons"

const Icon: FunctionComponent<IconProps> = ({ ...props }) => <IconChakra aria-hidden="true" {...props} />

export const IconText = ({ children }: { children: ReactNode }) => {
  return (
    <Box fontSize="xs" fontWeight="bold" lineHeight={1} aria-hidden="true">
      {children}
    </Box>
  )
}

type IconProps = {
  boxSize?: string
  color?: string
  valid?: boolean
  className?: string
  as?: IconType
}

export const IconSearch: FunctionComponent<IconProps> = ({ ...props }) => <Icon as={RiSearchLine} {...props} />

export const IconValid: FunctionComponent<IconProps> = ({ ...props }) => <Icon as={HiCheckCircle} {...props} />

export const IconInvalid: FunctionComponent<IconProps> = ({ ...props }) => <Icon as={HiXCircle} {...props} />

export const IconLamp: FunctionComponent<IconProps> = ({ ...props }) => <Icon as={HiOutlineLightBulb} {...props} />

export const IconPeople: FunctionComponent<IconProps> = ({ ...props }) => <Icon as={HiOutlineUser} {...props} />

export const IconCalendar: FunctionComponent<IconProps> = ({ ...props }) => <Icon as={HiOutlineCalendar} {...props} />

export const IconMoney: FunctionComponent<IconProps> = ({ ...props }) => <Icon as={RiMoneyEuroCircleLine} {...props} />

export const IconGrow: FunctionComponent<IconProps> = ({ ...props }) => <Icon as={HiOutlineTrendingUp} {...props} />

export const IconBack: FunctionComponent<IconProps> = ({ ...props }) => <Icon as={RiArrowGoBackLine} {...props} />

export const IconFemale: FunctionComponent<IconProps> = ({ ...props }) => <Icon as={IoFemaleSharp} {...props} />

export const IconMale: FunctionComponent<IconProps> = ({ ...props }) => <Icon as={IoMaleSharp} {...props} />

export const IconWarning: FunctionComponent<IconProps> = ({ ...props }) => <Icon as={RiAlertLine} {...props} />

export const IconCircleCross: FunctionComponent<IconProps> = ({ ...props }) => (
  <Icon as={RiCloseCircleLine} {...props} />
)

export const IconOfficeBuilding: FunctionComponent<IconProps> = ({ ...props }) => (
  <Icon as={HiOutlineOfficeBuilding} {...props} />
)

export const IconDelete: FunctionComponent<IconProps> = ({ ...props }) => <Icon as={RiDeleteBinLine} {...props} />

export const IconDrag: FunctionComponent<IconProps> = ({ ...props }) => <Icon as={MdOutlineDragIndicator} {...props} />

export const IconExternalLink: FunctionComponent<IconProps> = ({ ...props }) => (
  <Icon as={RiExternalLinkLine} {...props} />
)

export const IconArrowRight: FunctionComponent<IconProps> = ({ ...props }) => (
  <Icon as={RiArrowDropRightLine} {...props} />
)
