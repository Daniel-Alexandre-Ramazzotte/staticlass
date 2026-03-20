import { Button, styled } from 'tamagui';
import { palette } from '../constants/style';

export const AppButton = styled(Button, {
  borderRadius: 25,
  minHeight: 50,
  alignItems: 'center',
  justifyContent: 'center',
  pressStyle: { opacity: 0.8, scale: 0.98 },
  animation: 'quick',

  variants: {
    type: {
      primary: {
        backgroundColor: palette.primaryBlue,
        color: palette.offWhite,
        borderColor: 'transparent',
      },
      secondary: {
        backgroundColor: palette.primaryGreen,
        color: palette.offWhite,
        borderColor: 'transparent',
      },
      alts: {
        backgroundColor: palette.lightBlue,
        color: palette.offWhite,
        borderColor: 'transparent',
      },
      altSelected: {
        backgroundColor: palette.darkBlue,
        color: palette.offWhite,
        borderColor: 'transparent',
      },
      inactive: {
        backgroundColor: palette.grey,
        color: palette.offWhite,
        borderColor: palette.grey,
      },
    },
    buttonSize: {
      small: {
        px: '$3',
        py: '$2',
        minHeight: 40,
        fontSize: 14,
        lineHeight: 18,
      },
      default: {
        px: '$5',
        py: '$3',
        minHeight: 50,
        fontSize: 18,
        lineHeight: 24,
      },
      big: {
        px: '$6',
        py: '$3',
        minHeight: 64,
        fontSize: 22,
        lineHeight: 30,
      },
    },
  } as const,

  defaultVariants: {
    type: 'primary',
    buttonSize: 'default',
  },
});
